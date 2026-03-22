const mqtt = require("mqtt");
const config = require("../config");
const state = require("./state");

const mqttClient = mqtt.connect(config.MQTT_URL, {
  reconnectPeriod: 2000,
  connectTimeout: 5000,
});

function initMqttClient(pool) {
  const { refreshSensorMap, sensorKeyToId } = require("../lib/sensorMap");
  const { ensureDeviceRow } = require("../lib/deviceHelpers");
  const { MQTT_TOPIC_SENSOR, MQTT_TOPIC_DEVICE_STATUS, ROOM_ID } = config;

  mqttClient.on("connect", async () => {
    state.mqttReady = true;
    console.log(`MQTT connected: ${config.MQTT_URL}`);
    mqttClient.subscribe([MQTT_TOPIC_SENSOR, MQTT_TOPIC_DEVICE_STATUS], { qos: 0 }, (err) => {
      if (err) console.error("MQTT subscribe error", err);
      else console.log("MQTT subscribed:", MQTT_TOPIC_SENSOR, MQTT_TOPIC_DEVICE_STATUS);
    });
    await refreshSensorMap(pool);
  });

  mqttClient.on("reconnect", () => {
    state.mqttReady = false;
  });

  mqttClient.on("error", (err) => {
    console.error("MQTT error", err);
  });

  mqttClient.on("message", async (topic, payloadBuf) => {
    const payloadStr = payloadBuf.toString("utf8").trim();

    try {
      if (topic === MQTT_TOPIC_SENSOR && payloadStr.startsWith("{")) {
        const obj = JSON.parse(payloadStr);
        if (ROOM_ID && String(obj.room_id || "") !== ROOM_ID) return;

        const ts = obj.timestamp || obj.ts;
        const createdAt = ts ? new Date(ts) : new Date();

        const temp = Number(obj.temp);
        const hum = Number(obj.hum);
        const light = Number(obj.light);

        const inserts = [];
        const tempId = sensorKeyToId.get("temp");
        const humId = sensorKeyToId.get("humidity");
        const lightId = sensorKeyToId.get("light");

        if (Number.isFinite(temp) && tempId) inserts.push([tempId, temp, createdAt]);
        if (Number.isFinite(hum) && humId) inserts.push([humId, hum, createdAt]);
        if (Number.isFinite(light) && lightId) inserts.push([lightId, light, createdAt]);

        if (inserts.length) {
          await pool.query("INSERT INTO sensor_data (sensor_id, value, created_at) VALUES ?", [
            inserts,
          ]);
        }
        return;
      }

      if (topic === MQTT_TOPIC_DEVICE_STATUS && payloadStr.startsWith("{")) {
        const obj = JSON.parse(payloadStr);
        if (ROOM_ID && String(obj.room_id || "") !== ROOM_ID) return;

        const updates = [];
        if (typeof obj.device === "string") {
          const statusUpper = String(obj.status || "").toUpperCase() === "ON" ? "ON" : "OFF";
          updates.push({ device: obj.device, statusUpper });
        } else {
          if (typeof obj.fan === "boolean")
            updates.push({ device: "Fan", statusUpper: obj.fan ? "ON" : "OFF" });
          if (typeof obj.light === "boolean")
            updates.push({ device: "Light", statusUpper: obj.light ? "ON" : "OFF" });
          if (typeof obj.projector === "boolean")
            updates.push({ device: "Projector", statusUpper: obj.projector ? "ON" : "OFF" });
        }

        if (!updates.length) return;

        const conn = await pool.getConnection();
        try {
          await conn.beginTransaction();

          for (const u of updates) {
            const { id: deviceId, prevState } = await ensureDeviceRow(conn, u.device, u.statusUpper);

            await conn.query("UPDATE devices SET device_state=? WHERE id=?", [u.statusUpper, deviceId]);

            const [updWaiting] = await conn.query(
              `UPDATE action_history
               SET action = ?, status = ?
               WHERE device_id = ? AND action = 'WAITING'
               ORDER BY created_at DESC, id DESC
               LIMIT 1`,
              [u.statusUpper, u.statusUpper, deviceId]
            );
            if (updWaiting && typeof updWaiting.affectedRows === "number" && updWaiting.affectedRows > 0) {
              console.log("Resolved WAITING ->", u.statusUpper, "for", u.device);
            }

            const devKey = String(u.device).toLowerCase();
            state.lastDeviceReport.set(devKey, { at: Date.now(), statusUpper: u.statusUpper });

            const pending = state.pendingDeviceCmd.get(devKey);
            if (pending && Date.now() >= pending.issuedAt && pending.desired === u.statusUpper) {
              clearTimeout(pending.timer);
              state.pendingDeviceCmd.delete(devKey);
            }

            if (!prevState || prevState !== u.statusUpper) {
              await conn.query(
                "INSERT INTO action_history (request_id, device_id, action, status, created_at) VALUES (?, ?, ?, ?, NOW())",
                [String(Date.now()), deviceId, "REPORT", u.statusUpper]
              );
            }
          }

          await conn.commit();
        } catch (err) {
          await conn.rollback();
          console.error("Failed to sync device status from ESP", err);
        } finally {
          conn.release();
        }
        return;
      }
    } catch (err) {
      console.error("MQTT message handling failed", err);
    }
  });
}

module.exports = { mqttClient, initMqttClient };
