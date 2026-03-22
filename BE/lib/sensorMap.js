const sensorKeyToId = new Map(); // "temp"|"humidity"|"light" -> sensor_id (VARCHAR)

function normalizeSensorKey(s) {
  const v = String(s || "").trim().toLowerCase();
  if (!v) return "";
  if (v === "temp" || v === "temperature") return "temp";
  if (v === "hum" || v === "humidity") return "humidity";
  if (v === "light" || v === "ldr") return "light";
  return v;
}

async function refreshSensorMap(pool) {
  try {
    const [sensors] = await pool.query("SELECT id, name, topic FROM sensors");
    sensorKeyToId.clear();
    for (const s of sensors) {
      const keyFromId = normalizeSensorKey(s.id);
      const keyFromName = normalizeSensorKey(s.name);
      const key = keyFromId || keyFromName;
      if (!key) continue;
      if (key === "temp" || key === "humidity" || key === "light") {
        sensorKeyToId.set(key, String(s.id));
      }
    }
  } catch (err) {
    console.error("Failed to refresh sensor map", err);
  }
}

module.exports = { sensorKeyToId, normalizeSensorKey, refreshSensorMap };
