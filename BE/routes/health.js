const express = require("express");

function createHealthRouter(pool) {
  const r = express.Router();
  r.get("/", async (req, res) => {
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
  return r;
}

module.exports = createHealthRouter;
