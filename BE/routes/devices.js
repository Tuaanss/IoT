const express = require("express");

function createDevicesRouter(pool) {
  const r = express.Router();

  r.get("/", async (req, res) => {
    try {
      const [rows] = await pool.query(
        "SELECT id, name, topic, device_state, created_at FROM devices ORDER BY created_at DESC"
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load devices" });
    }
  });

  r.patch("/:id/status", async (req, res) => {
    const id = String(req.params.id || "");
    const { device_state } = req.body || {};
    const next = String(device_state || "").toUpperCase() === "ON" ? "ON" : "OFF";
    try {
      const [result] = await pool.query("UPDATE devices SET device_state=? WHERE id=?", [next, id]);
      if (!result.affectedRows) return res.status(404).json({ error: "Device not found" });
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update device status" });
    }
  });

  return r;
}

module.exports = createDevicesRouter;
