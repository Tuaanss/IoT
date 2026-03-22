const express = require("express");

function createActionHistoryRouter(pool) {
  const r = express.Router();

  r.get("/", async (req, res) => {
    const limit = Math.min(Number(req.query.limit || 100), 500);
    try {
      const [rows] = await pool.query(
        `SELECT ah.id, ah.request_id, ah.device_id, d.name AS device_name, ah.action, ah.status, ah.created_at
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

  r.post("/", async (req, res) => {
    // action = ON | OFF (lệnh); status = WAITING | ACK | TIMEOUT
    const { request_id, device_id, action, status } = req.body;
    if (!request_id || !device_id || !action || !status) {
      return res.status(400).json({ error: "Missing fields" });
    }
    try {
      const [result] = await pool.query(
        "INSERT INTO action_history (request_id, device_id, action, status, created_at) VALUES (?, ?, ?, ?, NOW())",
        [request_id, device_id, action, status]
      );
      res.status(201).json({ id: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to insert action history" });
    }
  });

  return r;
}

module.exports = createActionHistoryRouter;
