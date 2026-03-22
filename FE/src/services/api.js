import { API_BASE } from "../config/env.js";

export async function fetchLatestSensors() {
  const res = await fetch(`${API_BASE}/latest-sensors`);
  if (!res.ok) throw new Error("Failed to load sensors");
  return res.json();
}

export async function fetchActionHistory(limit = 100) {
  const res = await fetch(`${API_BASE}/action-history?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to load history");
  const data = await res.json();
  return { history: data };
}

export async function fetchDevices() {
  const res = await fetch(`${API_BASE}/devices`);
  if (!res.ok) throw new Error("Failed to load devices");
  return res.json();
}

export async function fetchSensorData({ limit = 200, sensorId } = {}) {
  const qs = new URLSearchParams();
  if (limit) qs.set("limit", String(limit));
  if (sensorId) qs.set("sensor_id", String(sensorId));
  const res = await fetch(`${API_BASE}/sensor-data?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to load sensor data");
  return res.json();
}

export async function sendDeviceAction(device, status) {
  const res = await fetch(`${API_BASE}/device-action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device, status }),
  });
  if (!res.ok) throw new Error("Failed to send device action");
  return res.json();
}
