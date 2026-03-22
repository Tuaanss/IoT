const express = require("express");

function createSensorDataRouter(pool) {
  const r = express.Router();

  r.get("/", async (req, res) => {
    const sensorId = req.query.sensor_id ? String(req.query.sensor_id) : null;
    const limit = Math.min(Number(req.query.limit || 50), 1000);
    try {
      const sql = sensorId
        ? `SELECT sd.id, sd.sensor_id, s.name AS sensor_name, sd.value, sd.created_at
           FROM sensor_data sd
           JOIN sensors s ON s.id = sd.sensor_id
           WHERE sd.sensor_id = ?
           ORDER BY sd.created_at DESC
           LIMIT ?`
        : `SELECT sd.id, sd.sensor_id, s.name AS sensor_name, sd.value, sd.created_at
           FROM sensor_data sd
           JOIN sensors s ON s.id = sd.sensor_id
           ORDER BY sd.created_at DESC
           LIMIT ?`;

      const params = sensorId ? [sensorId, limit] : [limit];
      const [rows] = await pool.query(sql, params);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load sensor data" });
    }
  });

  r.post("/", async (req, res) => {
    const { sensor_id, value, timestamp } = req.body;
    if (!sensor_id || value === undefined || value === null) {
      return res.status(400).json({ error: "Missing fields" });
    }
    try {
      const [result] = await pool.query(
        "INSERT INTO sensor_data (sensor_id, value, created_at) VALUES (?, ?, ?)",
        [sensor_id, value, timestamp ? new Date(timestamp) : new Date()]
      );
      res.status(201).json({ id: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to insert sensor data" });
    }
  });

  return r;
}

module.exports = createSensorDataRouter;
