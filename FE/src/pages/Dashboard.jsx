import React, { useMemo } from "react";
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
import { adcToBrightnessPercent } from "../constants/charts";

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

function SensorChartCard({
  title,
  subtitle,
  icon,
  data,
  color,
  gradientId,
  unit,
  decimals,
  variant,
}) {
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
            variant={variant}
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
  const lightPct = adcToBrightnessPercent(lv);

  const chartLightPct = useMemo(
    () => chartLight.map(({ t, v }) => ({ t, v: adcToBrightnessPercent(v) })),
    [chartLight]
  );

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
          title="Light"
          value={`${lightPct}%`}
          icon={<Sun size={14} color={colors.light} />}
        />
      </div>

      <div className="chartsGrid">
        <SensorChartCard
          title="Temperature"
          subtitle="30 most recent samples"
          icon={<Thermometer size={14} />}
          data={chartTemp}
          color={colors.temp}
          gradientId="gradTemp"
          unit="°C"
          decimals={1}
          variant="temp"
        />
        <SensorChartCard
          title="Humidity"
          subtitle="30 most recent samples"
          icon={<Droplets size={14} />}
          data={chartHumidity}
          color={colors.humidity}
          gradientId="gradHum"
          unit="%"
          decimals={1}
          variant="humidity"
        />
        <SensorChartCard
          title="Light"
          subtitle="30 most recent samples"
          icon={<Sun size={14} />}
          data={chartLightPct}
          color={colors.light}
          gradientId="gradLight"
          unit="%"
          decimals={0}
          variant="lightPct"
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
              pending={pendingDevice === "Fan"}
              disabled={pendingDevice === "Fan"}
              setValue={(v) => {
                setFan(v);
                logAction("Fan", v);
              }}
            />
            <span
              className={`deviceState ${
                pendingDevice === "Fan"
                  ? "deviceStateWaiting"
                  : fan
                    ? "deviceStateActive"
                    : "deviceStateInactive"
              }`}
            >
              {pendingDevice === "Fan" ? "WAITING" : fan ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="deviceItem">
            <Toggle
              icon={<Lightbulb size={16} />}
              label="Light"
              value={light}
              pending={pendingDevice === "Light"}
              disabled={pendingDevice === "Light"}
              setValue={(v) => {
                setLight(v);
                logAction("Light", v);
              }}
            />
            <span
              className={`deviceState ${
                pendingDevice === "Light"
                  ? "deviceStateWaiting"
                  : light
                    ? "deviceStateActive"
                    : "deviceStateInactive"
              }`}
            >
              {pendingDevice === "Light" ? "WAITING" : light ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="deviceItem">
            <Toggle
              icon={<Projector size={16} />}
              label="Projector"
              value={projector}
              pending={pendingDevice === "Projector"}
              disabled={pendingDevice === "Projector"}
              setValue={(v) => {
                setProjector(v);
                logAction("Projector", v);
              }}
            />
            <span
              className={`deviceState ${
                pendingDevice === "Projector"
                  ? "deviceStateWaiting"
                  : projector
                    ? "deviceStateActive"
                    : "deviceStateInactive"
              }`}
            >
              {pendingDevice === "Projector" ? "WAITING" : projector ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
