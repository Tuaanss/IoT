function deviceIdFromName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 50);
}

async function ensureDeviceRow(conn, deviceName, deviceState) {
  const id = deviceIdFromName(deviceName);
  const [existing] = await conn.query("SELECT id, device_state FROM devices WHERE id = ? LIMIT 1", [
    id,
  ]);
  if (existing.length) {
    return { id: existing[0].id, prevState: String(existing[0].device_state || "") };
  }
  await conn.query(
    "INSERT INTO devices (id, name, topic, device_state, created_at) VALUES (?, ?, ?, ?, NOW())",
    [id, deviceName, "", deviceState]
  );
  return { id, prevState: "" };
}

module.exports = { deviceIdFromName, ensureDeviceRow };
