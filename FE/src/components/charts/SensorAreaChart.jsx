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

function DarkTooltip({ active, payload, label, unit, decimals = 1 }) {
  if (!active || !payload?.length) return null;
  const raw = payload[0].value;
  const v =
    typeof raw === "number"
      ? decimals === 0
        ? Math.round(raw)
        : raw.toFixed(decimals)
      : raw;
  return (
    <div className="chartTooltip">
      <div className="chartTooltipMeta">Mẫu #{label}</div>
      <div className="chartTooltipValue">
        {v}
        {unit ? <span className="chartTooltipUnit">{unit}</span> : null}
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {Array<{t:number,v:number}>} props.data
 * @param {string} props.color - stroke / accent
 * @param {string} props.gradientId - unique SVG id
 * @param {string} props.unit - hiển thị trong tooltip
 * @param {number} [props.decimals=1]
 */
export default function SensorAreaChart({ data, color, gradientId, unit, decimals = 1 }) {
  const gid = `${gradientId}-fill`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 14, right: 6, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="40%" stopColor={color} stopOpacity={0.14} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="5 10"
          stroke="rgba(255,255,255,0.06)"
          vertical={false}
        />

        <XAxis
          dataKey="t"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 10 }}
          minTickGap={28}
          tickFormatter={(t) => (Number(t) % 15 === 0 ? String(t) : "")}
        />

        <YAxis
          tickLine={false}
          axisLine={false}
          width={36}
          tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 10 }}
          domain={["auto", "auto"]}
          tickFormatter={(v) =>
            typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toFixed(1)) : v
          }
        />

        <Tooltip
          content={(tipProps) => (
            <DarkTooltip {...tipProps} unit={unit} decimals={decimals} />
          )}
          cursor={{ stroke: "rgba(255,255,255,0.14)", strokeWidth: 1 }}
          animationDuration={200}
        />

        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gid})`}
          fillOpacity={1}
          dot={false}
          activeDot={{
            r: 5,
            strokeWidth: 2,
            stroke: "rgba(255,255,255,0.85)",
            fill: color,
          }}
          isAnimationActive
          animationDuration={450}
          animationEasing="ease-out"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
