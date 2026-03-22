const express = require("express");
const config = require("../config");
const { ensureDeviceRow } = require("../lib/deviceHelpers");
const state = require("../mqtt/state");
const { mqttClient } = require("../mqtt/client");

function createDeviceActionRouter(pool) {
  const r = express.Router();

  r.post("/", async (req, res) => {
    const { device, status } = req.body || {};
    if (!device || !status) {
      return res.status(400).json({ error: "Missing device/status" });
    }

    const statusUpper = String(status).toUpperCase() === "ON" ? "ON" : "OFF";
    const issuedAt = Date.now();
    const requestId = `${issuedAt}-${Math.random().toString(16).slice(2, 10)}`.slice(0, 50);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const { id: deviceId } = await ensureDeviceRow(conn, device, statusUpper);
      await conn.query("UPDATE devices SET device_state=? WHERE id=?", [statusUpper, deviceId]);

      // action = lệnh ON/OFF; status = WAITING | ACK | TIMEOUT
      await conn.query(
        "INSERT INTO action_history (request_id, device_id, action, status, created_at) VALUES (?, ?, ?, ?, NOW())",
        [requestId, deviceId, statusUpper, "WAITING"]
      );

      await conn.commit();

      if (state.mqttReady) {
        const msg = JSON.stringify({
          room_id: config.ROOM_ID || undefined,
          device,
          status: statusUpper,
          ts: new Date().toISOString(),
        });
        mqttClient.publish(config.MQTT_TOPIC_DEVICE_CONTROL, msg, { qos: 0, retain: false });
        console.log("MQTT publish", config.MQTT_TOPIC_DEVICE_CONTROL, msg);
      }

      const devKey = String(device).toLowerCase();
      const prevPending = state.pendingDeviceCmd.get(devKey);
      if (prevPending) {
        clearTimeout(prevPending.timer);
        state.pendingDeviceCmd.delete(devKey);
      }
      const timer = setTimeout(async () => {
        const last = state.lastDeviceReport.get(devKey);
        const acked = last && last.at >= issuedAt && last.statusUpper === statusUpper;
        if (acked) return;

        const c = await pool.getConnection();
        try {
          await c.beginTransaction();
          const id = deviceId;
          await c.query("UPDATE devices SET device_state=? WHERE id=?", ["OFF", id]);
          await c.query(
            `UPDATE action_history
             SET status = 'TIMEOUT'
             WHERE device_id = ? AND status = 'WAITING'
             ORDER BY created_at DESC, id DESC
             LIMIT 1`,
            [id]
          );
          await c.commit();
        } catch (e) {
          await c.rollback();
          console.error("Timeout watchdog failed", e);
        } finally {
          c.release();
        }

        if (state.mqttReady) {
          const offMsg = JSON.stringify({
            room_id: config.ROOM_ID || undefined,
            device,
            status: "OFF",
            ts: new Date().toISOString(),
          });
          mqttClient.publish(config.MQTT_TOPIC_DEVICE_CONTROL, offMsg, { qos: 0, retain: false });
        }

        state.pendingDeviceCmd.delete(devKey);
      }, 10000);

      state.pendingDeviceCmd.set(devKey, { desired: statusUpper, issuedAt, timer });

      res.json({
        ok: true,
        request_id: requestId,
        device_id: deviceId,
        status: statusUpper,
      });
    } catch (err) {
      await conn.rollback();
      console.error(err);
      res.status(500).json({ error: "Failed to process device action" });
    } finally {
      conn.release();
    }
  });

  return r;
}

module.exports = createDeviceActionRouter;
