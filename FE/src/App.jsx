import React, { useEffect, useState } from "react";
import { Database, History, LayoutDashboard, User } from "lucide-react";
import Dashboard from "./components/Dashboard";
import Sensors from "./components/Sensors";
import HistoryPage from "./components/HistoryPage";
import Profile from "./components/Profile";
import NavItem from "./components/NavItem";
import { fetchActionHistory, fetchDevices, fetchLatestSensors, sendDeviceAction } from "./api";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sensorView, setSensorView] = useState("temp");

  const [temp, setTemp] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [lightLevel, setLightLevel] = useState(0);

  const [fan, setFan] = useState(true);
  const [light, setLight] = useState(true);
  const [projector, setProjector] = useState(false);
  const [pendingDevice, setPendingDevice] = useState(null);

  const [history, setHistory] = useState([]);
  const [chart, setChart] = useState([]);
  const [sensorRows, setSensorRows] = useState([]);

  // Load initial device states from backend
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await fetchDevices();
        if (Array.isArray(devices)) {
          const byName = {};
          devices.forEach((d) => {
            if (!d.device_name) return;
            byName[d.device_name.toLowerCase()] = d;
          });

          const fanDev = byName["fan"];
          const lightDev = byName["light"];
          const projDev = byName["projector"];

          if (fanDev) setFan(Boolean(fanDev.status));
          if (lightDev) setLight(Boolean(lightDev.status));
          if (projDev) setProjector(Boolean(projDev.status));
        }
      } catch (e) {
        console.error("Failed to load devices", e);
      }
    };
    loadDevices();
  }, []);

  // Load initial history from backend
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

  // Poll latest sensor values from backend every 2s
  useEffect(() => {
    let isCancelled = false;

    const fetchLatest = async () => {
      try {
        const data = await fetchLatestSensors();
        if (!data || !data.latest || isCancelled) return;

        const { latest, rows } = data;

        if (latest.temp) setTemp(Number(latest.temp.value || 0));
        if (latest.humidity) setHumidity(Number(latest.humidity.value || 0));
        if (latest.light) setLightLevel(Number(latest.light.value || 0));

        if (Array.isArray(rows)) {
          setSensorRows(rows);
        }

        setChart((prev) => {
          const nextVal =
            sensorView === "temp"
              ? (latest.temp ? Number(latest.temp.value || 0) : 0)
              : sensorView === "humidity"
                ? (latest.humidity ? Number(latest.humidity.value || 0) : 0)
                : (latest.light ? Number(latest.light.value || 0) : 0);

          const next = [...prev, { t: prev.length, v: nextVal }];
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
  }, [sensorView]);

  const logAction = async (device, state) => {
    const entry = {
      id: history.length + 1,
      device,
      status: state ? "ON" : "OFF",
      time: new Date().toLocaleTimeString(),
    };

    setHistory((h) => [entry, ...h]);

    setPendingDevice(device);
    try {
      await sendDeviceAction(device, entry.status);
    } catch (e) {
      console.error("Failed to send device action", e);
    } finally {
      setPendingDevice(null);
    }
  };

  const colors = {
    temp: "#ff4d4f",
    humidity: "#3b82f6",
    light: "#facc15",
  };

  const card = {
    background: "linear-gradient(145deg,#1a1d23,#111317)",
    borderRadius: 16,
    padding: 22,
    boxShadow: "0 0 0 1px rgba(255,255,255,0.03),0 10px 40px rgba(0,0,0,0.7)",
  };

  const renderPage = () => {
    if (page === "dashboard") {
      return (
        <Dashboard
          temp={temp}
          humidity={humidity}
          lightLevel={lightLevel}
          sensorView={sensorView}
          setSensorView={setSensorView}
          chart={chart}
          colors={colors}
          card={card}
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
      return (
        <Sensors
          rows={sensorRows}
        />
      );
    }

    if (page === "history") return <HistoryPage history={history} />;
    if (page === "profile") return <Profile />;
    return null;
  };

  return (
    <div className="appShell">
      <div className="sidebar">
        <div className="brand">SmartHome</div>

        <div className="nav">
          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            id="dashboard"
            page={page}
            setPage={setPage}
          />
          <NavItem
            icon={<Database size={18} />}
            label="Sensors Data"
            id="sensors"
            page={page}
            setPage={setPage}
          />
          <NavItem
            icon={<History size={18} />}
            label="Action History"
            id="history"
            page={page}
            setPage={setPage}
          />
          <NavItem
            icon={<User size={18} />}
            label="Profile"
            id="profile"
            page={page}
            setPage={setPage}
          />
        </div>
      </div>

      <div className="content">
        <div className="pageTitle">
          <h2>
            {page === "dashboard" && "Overview"}
            {page === "sensors" && "Data sensor"}
            {page === "history" && "Action History"}
            {page === "profile" && "Profile"}
          </h2>
        </div>

        {renderPage()}
      </div>
    </div>
  );
}
