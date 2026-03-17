import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Droplets,
  Fan,
  Lightbulb,
  Projector,
  SlidersHorizontal,
  Sun,
  Thermometer,
} from "lucide-react";
import Toggle from "./Toggle";

function Metric({
  title,
  value,
  sensorKey,
  sensorView,
  setSensorView,
  colors,
  icon,
}) {
  const active =
    sensorKey === "temp"
      ? "metricActiveRed"
      : sensorKey === "humidity"
        ? "metricActiveBlue"
        : "metricActiveYellow";

  return (
    <div
      onClick={() => setSensorView(sensorKey)}
      className={`panel metric ${sensorView === sensorKey ? active : ""}`}
    >
      <div className="metricHeader">
        {icon}
        <span>{title}</span>
      </div>
      <div className="metricValue">{value}</div>
    </div>
  );
}

export default function Dashboard({
  temp,
  humidity,
  lightLevel,
  sensorView,
  setSensorView,
  chart,
  colors,
  card,
  fan,
  setFan,
  light,
  setLight,
  projector,
  setProjector,
  logAction,
  pendingDevice,
}) {
  const maxV = chart.reduce((m, p) => (p.v > m ? p.v : m), -Infinity);
  const minV = chart.reduce((m, p) => (p.v < m ? p.v : m), Infinity);
  const unit = sensorView === "temp" ? "°C" : sensorView === "humidity" ? "%" : "lux";
  const chartTitle =
    sensorView === "temp"
      ? "Temperature History"
      : sensorView === "humidity"
        ? "Humidity History"
        : "Light Intensity History";

  return (
    <>
      <div className="gridTop">
        <Metric
          title="Temperature"
          value={`${temp} °C`}
          sensorKey="temp"
          sensorView={sensorView}
          setSensorView={setSensorView}
          colors={colors}
          icon={<Thermometer size={14} color={colors.temp} />}
        />
        <Metric
          title="Humidity"
          value={`${humidity}%`}
          sensorKey="humidity"
          sensorView={sensorView}
          setSensorView={setSensorView}
          colors={colors}
          icon={<Droplets size={14} color={colors.humidity} />}
        />
        <Metric
          title="Light Level"
          value={`${lightLevel}lx`}
          sensorKey="light"
          sensorView={sensorView}
          setSensorView={setSensorView}
          colors={colors}
          icon={<Sun size={14} color={colors.light} />}
        />
      </div>

      <div className="chartRow">
        <div className="panel chartWrap">
          <div className="panelInner">
            <div className="sectionTitle">
              <span className="pill">
                {sensorView === "temp" ? (
                  <Thermometer size={14} />
                ) : sensorView === "humidity" ? (
                  <Droplets size={14} />
                ) : (
                  <Sun size={14} />
                )}
              </span>
              <div>
                <div>{chartTitle}</div>
                <div className="sectionSub">Last 60 seconds of data</div>
              </div>
            </div>

            <div className="chartBox">
              <ResponsiveContainer>
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="color" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors[sensorView]} stopOpacity={0.55} />
                      <stop offset="95%" stopColor={colors[sensorView]} stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="rgba(255,255,255,.06)" />
                  <XAxis dataKey="t" stroke="rgba(255,255,255,.35)" />
                  <YAxis stroke="rgba(255,255,255,.35)" />
                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={colors[sensorView]}
                    strokeWidth={3}
                    fill="url(#color)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="statsCol">
          <div className="statCard">
            <div className="statLabel">Max</div>
            <div className="statValue">
              {Number.isFinite(maxV) ? `${maxV.toFixed(1)} ${unit}` : "-"}
            </div>
          </div>
          <div className="statCard">
            <div className="statLabel">Min</div>
            <div className="statValue">
              {Number.isFinite(minV) ? `${minV.toFixed(1)} ${unit}` : "-"}
            </div>
          </div>
        </div>
      </div>

      <div className="panel deviceBar">
        <div className="deviceBarLeft">
          <span className="pill">
            <SlidersHorizontal size={14} />
          </span>
          Device Control
        </div>

        <div className="deviceBarRight">
          <div className="deviceItem">
            <Toggle
              icon={<Fan size={16} />}
              label="Fan"
              value={fan}
              disabled={pendingDevice === "Fan"}
              setValue={(v) => {
                setFan(v);
                logAction("Fan", v);
              }}
            />
            <span className={`deviceState ${fan ? "deviceStateActive" : "deviceStateInactive"}`}>
              {pendingDevice === "Fan" ? "Waiting..." : fan ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="deviceItem">
            <Toggle
              icon={<Lightbulb size={16} />}
              label="Light"
              value={light}
              disabled={pendingDevice === "Light"}
              setValue={(v) => {
                setLight(v);
                logAction("Light", v);
              }}
            />
            <span
              className={`deviceState ${light ? "deviceStateActive" : "deviceStateInactive"}`}
            >
              {pendingDevice === "Light" ? "Waiting..." : light ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="deviceItem">
            <Toggle
              icon={<Projector size={16} />}
              label="Projector"
              value={projector}
              disabled={pendingDevice === "Projector"}
              setValue={(v) => {
                setProjector(v);
                logAction("Projector", v);
              }}
            />
            <span
              className={`deviceState ${
                projector ? "deviceStateActive" : "deviceStateInactive"
              }`}
            >
              {pendingDevice === "Projector" ? "Waiting..." : projector ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

