import React from "react";
import {
  Droplets,
  Fan,
  Lightbulb,
  Projector,
  SlidersHorizontal,
  Sun,
  Thermometer,
} from "lucide-react";
import Toggle from "../components/Toggle";
import SensorAreaChart from "../components/charts/SensorAreaChart";

function StatTile({ title, value, icon }) {
  return (
    <div className="panel metric">
      <div className="metricHeader">
        {icon}
        <span>{title}</span>
      </div>
      <div className="metricValue">{value}</div>
    </div>
  );
}

function SensorChartCard({ title, subtitle, icon, data, color, gradientId, unit, decimals }) {
  return (
    <div className="chartCell">
      <div className="panelInner">
        <div className="sectionTitle">
          <span className="pill" style={{ color }}>
            {icon}
          </span>
          <div>
            <div>{title}</div>
            <div className="sectionSub">{subtitle}</div>
          </div>
        </div>
        <div className="chartBox">
          <SensorAreaChart
            data={data}
            color={color}
            gradientId={gradientId}
            unit={unit}
            decimals={decimals}
          />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({
  temp,
  humidity,
  lightLevel,
  chartTemp,
  chartHumidity,
  chartLight,
  colors,
  fan,
  setFan,
  light,
  setLight,
  projector,
  setProjector,
  logAction,
  pendingDevice,
}) {
  const lv = Number(lightLevel);
  const lightPct = Number.isFinite(lv)
    ? Math.round((Math.max(0, Math.min(1023, lv)) / 1023) * 100)
    : 0;
  const lightDisplay = Number.isFinite(lv) ? `${Math.round(lv)} (${lightPct}%)` : "—";

  return (
    <>
      <div className="gridTop">
        <StatTile
          title="Temperature"
          value={`${temp} °C`}
          icon={<Thermometer size={14} color={colors.temp} />}
        />
        <StatTile
          title="Humidity"
          value={`${humidity}%`}
          icon={<Droplets size={14} color={colors.humidity} />}
        />
        <StatTile
          title="Light (ADC)"
          value={lightDisplay}
          icon={<Sun size={14} color={colors.light} />}
        />
      </div>

      <div className="chartsGrid">
        <SensorChartCard
          title="Temperature"
          subtitle="60 mẫu gần nhất · ~2s/lần"
          icon={<Thermometer size={14} />}
          data={chartTemp}
          color={colors.temp}
          gradientId="gradTemp"
          unit="°C"
          decimals={1}
        />
        <SensorChartCard
          title="Humidity"
          subtitle="60 mẫu gần nhất · ~2s/lần"
          icon={<Droplets size={14} />}
          data={chartHumidity}
          color={colors.humidity}
          gradientId="gradHum"
          unit="%"
          decimals={1}
        />
        <SensorChartCard
          title="Light (ADC)"
          subtitle="Giá trị 0–1023 (ESP8266 ADC)"
          icon={<Sun size={14} />}
          data={chartLight}
          color={colors.light}
          gradientId="gradLight"
          unit="ADC"
          decimals={0}
        />
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
