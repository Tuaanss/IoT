const express = require("express");
const { normalizeSensorKey } = require("../lib/sensorMap");

function createLatestSensorsRouter(pool) {
  const r = express.Router();

  r.get("/", async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT s.id,
                s.name AS sensor_name,
                sd.value,
                sd.created_at
         FROM sensors s
         JOIN sensor_data sd ON sd.sensor_id = s.id
         WHERE sd.id IN (SELECT MAX(id) FROM sensor_data GROUP BY sensor_id)`
      );

      const latest = {};
      for (const row of rows) {
        const key = normalizeSensorKey(row.id) || normalizeSensorKey(row.sensor_name);
        const valueNum = Number(row.value);
        latest[key] = {
          name: row.sensor_name,
          value: valueNum,
          time: row.created_at,
        };
      }
      res.json({ latest });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load latest sensors" });
    }
  });

  return r;
}

module.exports = createLatestSensorsRouter;
