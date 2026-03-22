import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await fetchDevices();
        if (Array.isArray(devices)) {
          const byName = {};
          devices.forEach((d) => {
            if (!d.name) return;
            byName[d.name.toLowerCase()] = d;
          });

          const fanDev = byName["fan"];
          const lightDev = byName["light"];
          const projDev = byName["projector"];

          if (fanDev) setFan(String(fanDev.device_state || "").toUpperCase() === "ON");
          if (lightDev) setLight(String(lightDev.device_state || "").toUpperCase() === "ON");
          if (projDev) setProjector(String(projDev.device_state || "").toUpperCase() === "ON");
        }
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

        setChartTemp((prev) => {
          const next = [...prev, { t: prev.length, v: tv }];
          if (next.length > 60) next.shift();
          return next;
        });
        setChartHumidity((prev) => {
          const next = [...prev, { t: prev.length, v: hv }];
          if (next.length > 60) next.shift();
          return next;
        });
        setChartLight((prev) => {
          const next = [...prev, { t: prev.length, v: lv }];
          if (next.length > 60) next.shift();
          return next;
        });
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

  const logAction = async (device, state) => {
    const cmd = state ? "ON" : "OFF";
    const entry = {
      id: history.length + 1,
      device,
      action: cmd,
      status: "WAITING",
      time: new Date().toLocaleTimeString(),
    };

    setHistory((h) => [entry, ...h]);

    setPendingDevice(device);
    try {
      await sendDeviceAction(device, cmd);
    } catch (e) {
      console.error("Failed to send device action", e);
    } finally {
      setPendingDevice(null);
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
