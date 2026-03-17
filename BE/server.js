require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// MySQL pool using XAMPP (default user/pass: root / "")
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "iot_db",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

app.get("/api/health", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.query("SELECT 1");
    conn.release();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "DB connection failed" });
  }
});

// Devices
app.get("/api/devices", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, device_name, mac_address, status, created_at FROM devices ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load devices" });
  }
});

app.patch("/api/devices/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!Number.isFinite(id) || typeof status !== "boolean") {
    return res.status(400).json({ error: "Invalid id/status" });
  }
  try {
    const [result] = await pool.query("UPDATE devices SET status=? WHERE id=?", [status, id]);
    if (!result.affectedRows) return res.status(404).json({ error: "Device not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update device status" });
  }
});

// Action history
app.get("/api/action-history", async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 100), 500);
  try {
    const [rows] = await pool.query(
      `SELECT ah.id, ah.device_id, d.device_name, ah.action, ah.command_value, ah.status, ah.created_at, ah.updated_at
       FROM action_history ah
       JOIN devices d ON d.id = ah.device_id
       ORDER BY ah.created_at DESC
       LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load action history" });
  }
});

app.post("/api/action-history", async (req, res) => {
  const { device_id, action, command_value, status } = req.body;
  if (!device_id || !action || !command_value || !status) {
    return res.status(400).json({ error: "Missing fields" });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO action_history (device_id, action, command_value, status) VALUES (?, ?, ?, ?)",
      [device_id, action, command_value, status]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to insert action history" });
  }
});

// Sensors
app.get("/api/sensors", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, sensor_name, sensor_type, unit, mqtt_topic FROM sensors ORDER BY id ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load sensors" });
  }
});

// Sensor data
app.get("/api/sensor-data", async (req, res) => {
  const sensorId = req.query.sensor_id ? Number(req.query.sensor_id) : null;
  const limit = Math.min(Number(req.query.limit || 50), 1000);
  try {
    const sql = sensorId
      ? `SELECT sd.id, sd.sensor_id, s.sensor_name, s.sensor_type, s.unit, sd.value, sd.timestamp
         FROM sensor_data sd
         JOIN sensors s ON s.id = sd.sensor_id
         WHERE sd.sensor_id = ?
         ORDER BY sd.timestamp DESC
         LIMIT ?`
      : `SELECT sd.id, sd.sensor_id, s.sensor_name, s.sensor_type, s.unit, sd.value, sd.timestamp
         FROM sensor_data sd
         JOIN sensors s ON s.id = sd.sensor_id
         ORDER BY sd.timestamp DESC
         LIMIT ?`;

    const params = sensorId ? [sensorId, limit] : [limit];
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load sensor data" });
  }
});

// Latest sensors summary (one latest row per sensor)
app.get("/api/latest-sensors", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id,
              s.sensor_name,
              s.sensor_type,
              s.unit,
              sd.value,
              sd.timestamp
       FROM sensors s
       JOIN sensor_data sd ON sd.sensor_id = s.id
       WHERE sd.id IN (
         SELECT MAX(id) FROM sensor_data GROUP BY sensor_id
       )`
    );

    const latest = {};
    const tableRows = [];

    for (const row of rows) {
      const type = row.sensor_type; // e.g. temp, humidity, light
      const valueNum = Number(row.value);
      latest[type] = {
        name: row.sensor_name,
        value: valueNum,
        unit: row.unit,
        time: row.timestamp,
      };

      tableRows.push({
        id: row.id,
        name: row.sensor_name,
        type,
        value: `${valueNum} ${row.unit}`,
        time: row.timestamp,
      });
    }

    res.json({ latest, rows: tableRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load latest sensors" });
  }
});

// Device action helper: update device status + log to action_history
app.post("/api/device-action", async (req, res) => {
  const { device, status } = req.body || {};
  if (!device || !status) {
    return res.status(400).json({ error: "Missing device/status" });
  }

  const statusUpper = String(status).toUpperCase() === "ON" ? "ON" : "OFF";
  const statusBool = statusUpper === "ON" ? 1 : 0;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Find or create device by name
    const [existing] = await conn.query(
      "SELECT id FROM devices WHERE device_name = ? LIMIT 1",
      [device]
    );

    let deviceId;
    if (existing.length) {
      deviceId = existing[0].id;
      await conn.query("UPDATE devices SET status=? WHERE id=?", [statusBool, deviceId]);
    } else {
      const [insertDevice] = await conn.query(
        "INSERT INTO devices (device_name, mac_address, status, created_at) VALUES (?, ?, ?, NOW())",
        [device, "", statusBool]
      );
      deviceId = insertDevice.insertId;
    }

    // Insert action history
    await conn.query(
      "INSERT INTO action_history (device_id, action, command_value, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [deviceId, statusUpper, "", statusUpper]
    );

    await conn.commit();
    res.json({ ok: true, device_id: deviceId, status: statusUpper });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to process device action" });
  } finally {
    conn.release();
  }
});

app.post("/api/sensor-data", async (req, res) => {
  const { sensor_id, value, timestamp } = req.body;
  if (!sensor_id || value === undefined || value === null) {
    return res.status(400).json({ error: "Missing fields" });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO sensor_data (sensor_id, value, timestamp) VALUES (?, ?, ?)",
      [sensor_id, value, timestamp || new Date()]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to insert sensor data" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

