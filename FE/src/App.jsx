import React, { useEffect, useRef, useState } from "react";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Sensors from "./pages/Sensors";
import HistoryPage from "./pages/HistoryPage";
import Profile from "./pages/Profile";
import {
  fetchActionHistory,
  fetchDevices,
  fetchLatestSensors,
  fetchSensorData,
  sendDeviceAction,
} from "./services/api";
import { SENSOR_COLORS } from "./constants/theme";
import { CHART_SAMPLE_COUNT } from "./constants/charts";

/** Re-index t as 0..n-1 for X-axis; keep at most CHART_SAMPLE_COUNT points */
function appendChartSample(prev, value) {
  const vals = prev.length ? prev.map((p) => p.v) : [];
  vals.push(value);
  const trimmed = vals.slice(-CHART_SAMPLE_COUNT);
  return trimmed.map((v, i) => ({ t: i, v }));
}

/** BE watchdog marks TIMEOUT after 10s; poll a bit longer to catch the update */
const DEVICE_CMD_POLL_MS = 1000;
const DEVICE_CMD_WINDOW_MS = 12000;

function applyDeviceStates(devices, setFan, setLight, setProjector) {
  if (!Array.isArray(devices)) return;
  const byName = {};
  for (const d of devices) {
    if (!d?.name) continue;
    byName[String(d.name).toLowerCase()] = d;
  }
  const fanDev = byName.fan;
  const lightDev = byName.light;
  const projDev = byName.projector;
  if (fanDev) setFan(String(fanDev.device_state || "").toUpperCase() === "ON");
  if (lightDev) setLight(String(lightDev.device_state || "").toUpperCase() === "ON");
  if (projDev) setProjector(String(projDev.device_state || "").toUpperCase() === "ON");
}

export default function App() {
  const [page, setPage] = useState("dashboard");

  const [temp, setTemp] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [lightLevel, setLightLevel] = useState(0);

  const [fan, setFan] = useState(true);
  const [light, setLight] = useState(true);
  const [projector, setProjector] = useState(false);
  const [pendingDevice, setPendingDevice] = useState(null);

  const [history, setHistory] = useState([]);
  const [chartTemp, setChartTemp] = useState([]);
  const [chartHumidity, setChartHumidity] = useState([]);
  const [chartLight, setChartLight] = useState([]);
  const [sensorRows, setSensorRows] = useState([]);

  const devicePollRef = useRef(null);
  const pollBusyRef = useRef(false);

  useEffect(() => {
    return () => {
      if (devicePollRef.current) {
        clearInterval(devicePollRef.current);
        devicePollRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await fetchDevices();
        applyDeviceStates(devices, setFan, setLight, setProjector);
      } catch (e) {
        console.error("Failed to load devices", e);
      }
    };
    loadDevices();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchActionHistory(100);
        if (data && Array.isArray(data.history)) {
          setHistory(data.history);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    if (page !== "history") return;

    const loadHistory = async () => {
      try {
        const data = await fetchActionHistory(200);
        if (data && Array.isArray(data.history)) {
          setHistory(data.history);
        }
      } catch (e) {
        console.error("Failed to refresh history", e);
      }
    };

    loadHistory();
  }, [page]);

  useEffect(() => {
    let isCancelled = false;

    const fetchLatest = async () => {
      try {
        const data = await fetchLatestSensors();
        if (!data || !data.latest || isCancelled) return;

        const { latest } = data;

        if (latest.temp) setTemp(Number(latest.temp.value || 0));
        if (latest.humidity) setHumidity(Number(latest.humidity.value || 0));
        if (latest.light) setLightLevel(Number(latest.light.value || 0));

        const tv = latest.temp ? Number(latest.temp.value || 0) : 0;
        const hv = latest.humidity ? Number(latest.humidity.value || 0) : 0;
        const lv = latest.light ? Number(latest.light.value || 0) : 0;

        setChartTemp((prev) => appendChartSample(prev, tv));
        setChartHumidity((prev) => appendChartSample(prev, hv));
        setChartLight((prev) => appendChartSample(prev, lv));
      } catch (e) {
        console.error("Failed to load sensors", e);
      }
    };

    fetchLatest();
    const intervalId = setInterval(fetchLatest, 2000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (page !== "sensors") return;

    let isCancelled = false;

    const loadLog = async () => {
      try {
        const rows = await fetchSensorData({ limit: 200 });
        if (isCancelled || !Array.isArray(rows)) return;

        const mapped = rows.map((r) => ({
          id: r.id,
          name: r.sensor_name,
          type: r.sensor_id,
          value: `${r.value}`,
          time: r.created_at,
        }));
        setSensorRows(mapped);
      } catch (e) {
        console.error("Failed to load sensor data log", e);
      }
    };

    loadLog();
    const i = setInterval(loadLog, 2000);

    return () => {
      isCancelled = true;
      clearInterval(i);
    };
  }, [page]);

  const syncDevicesAndHistory = async () => {
    const [histRes, devices] = await Promise.all([
      fetchActionHistory(200),
      fetchDevices(),
    ]);
    if (histRes?.history && Array.isArray(histRes.history)) {
      setHistory(histRes.history);
    }
    applyDeviceStates(devices, setFan, setLight, setProjector);
  };

  const logAction = async (device, state) => {
    const cmd = state ? "ON" : "OFF";

    if (devicePollRef.current) {
      clearInterval(devicePollRef.current);
      devicePollRef.current = null;
    }

    setPendingDevice(device);

    const finishPending = () => {
      if (devicePollRef.current) {
        clearInterval(devicePollRef.current);
        devicePollRef.current = null;
      }
      setPendingDevice(null);
    };

    try {
      const res = await sendDeviceAction(device, cmd);
      const requestId = res?.request_id;

      await syncDevicesAndHistory();

      const started = Date.now();

      const tick = async () => {
        if (pollBusyRef.current) return;
        pollBusyRef.current = true;
        try {
          const [histRes, devices] = await Promise.all([
            fetchActionHistory(200),
            fetchDevices(),
          ]);
          const list = histRes?.history;
          if (!Array.isArray(list)) return;

          setHistory(list);
          applyDeviceStates(devices, setFan, setLight, setProjector);

          const row = requestId ? list.find((h) => h.request_id === requestId) : null;
          const stillWaiting =
            row && String(row.status || "").toUpperCase() === "WAITING";
          const elapsed = Date.now() - started;

          if (!stillWaiting || elapsed >= DEVICE_CMD_WINDOW_MS) {
            finishPending();
            if (stillWaiting && elapsed >= DEVICE_CMD_WINDOW_MS) {
              await syncDevicesAndHistory();
            }
          }
        } catch (e) {
          console.error("Device command poll failed", e);
        } finally {
          pollBusyRef.current = false;
        }
      };

      devicePollRef.current = setInterval(tick, DEVICE_CMD_POLL_MS);
      void tick();
    } catch (e) {
      console.error("Failed to send device action", e);
      finishPending();
      try {
        await syncDevicesAndHistory();
      } catch (e2) {
        console.error("Failed to sync after error", e2);
      }
    }
  };

  const renderPage = () => {
    if (page === "dashboard") {
      return (
        <Dashboard
          temp={temp}
          humidity={humidity}
          lightLevel={lightLevel}
          chartTemp={chartTemp}
          chartHumidity={chartHumidity}
          chartLight={chartLight}
          colors={SENSOR_COLORS}
          fan={fan}
          setFan={setFan}
          light={light}
          setLight={setLight}
          projector={projector}
          setProjector={setProjector}
          logAction={logAction}
          pendingDevice={pendingDevice}
        />
      );
    }

    if (page === "sensors") {
      return <Sensors rows={sensorRows} />;
    }

    if (page === "history") return <HistoryPage history={history} />;
    if (page === "profile") return <Profile />;
    return null;
  };

  return (
    <AppShell page={page} setPage={setPage}>
      {renderPage()}
    </AppShell>
  );
}
