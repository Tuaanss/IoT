// Simple API helper for talking to the Node.js backend (Express) using XAMPP MySQL.
// Backend server (BE/server.js) listens on PORT (default 4000).

const BASE_URL = "http://localhost:4000/api";

export async function fetchLatestSensors() {
  const res = await fetch(`${BASE_URL}/latest-sensors`);
  if (!res.ok) throw new Error("Failed to load sensors");
  return res.json(); // { latest, rows }
}

export async function fetchActionHistory(limit = 100) {
  const res = await fetch(`${BASE_URL}/action-history?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to load history");
  const data = await res.json();
  // Backend returns an array of rows; wrap to match App.jsx expectation { history: [...] }
  return { history: data };
}

export async function fetchDevices() {
  const res = await fetch(`${BASE_URL}/devices`);
  if (!res.ok) throw new Error("Failed to load devices");
  return res.json();
}

export async function sendDeviceAction(device, status) {
  const res = await fetch(`${BASE_URL}/device-action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device, status }),
  });
  if (!res.ok) throw new Error("Failed to send device action");
  return res.json();
}

