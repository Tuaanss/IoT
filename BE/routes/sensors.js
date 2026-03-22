const express = require("express");

function createSensorsRouter(pool) {
  const r = express.Router();

  r.get("/", async (req, res) => {
    try {
      const [rows] = await pool.query(
        "SELECT id, name, topic, created_at FROM sensors ORDER BY created_at DESC"
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load sensors" });
    }
  });

  return r;
}

module.exports = createSensorsRouter;
