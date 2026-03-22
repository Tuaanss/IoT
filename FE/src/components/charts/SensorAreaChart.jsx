import React, { useMemo } from "react";
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
      <div className="chartTooltipMeta">Sample #{label}</div>
      <div className="chartTooltipValue">
        {v}
        {unit ? <span className="chartTooltipUnit">{unit}</span> : null}
      </div>
    </div>
  );
}

/**
 * @param {'temp'|'humidity'|'lightPct'} props.variant — Y-axis scale
 */
export default function SensorAreaChart({
  data,
  color,
  gradientId,
  unit,
  decimals = 1,
  variant = "temp",
}) {
  const gid = `${gradientId}-fill`;

  const maxT = useMemo(() => {
    if (!data?.length) return 0;
    return Math.max(...data.map((d) => d.t), 0);
  }, [data]);

  const xTicks = useMemo(() => {
    const m = Math.max(maxT, 0);
    const set = new Set();
    for (let i = 0; i <= m; i += 5) set.add(i);
    set.add(m);
    return [...set].sort((a, b) => a - b);
  }, [maxT]);

  const yDomain = useMemo(() => {
    const vals = (data || []).map((d) => d.v).filter((x) => Number.isFinite(x));
    const maxV = vals.length ? Math.max(...vals) : 0;
    const minV = vals.length ? Math.min(...vals) : 0;

    if (variant === "humidity" || variant === "lightPct") return [0, 100];
    // temp: avoid Recharts shrinking to ~[0,4] when values are flat
    const hi = Math.max(25, maxV + 5, minV + 10);
    return [0, Math.min(90, Math.ceil(hi))];
  }, [data, variant]);

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
          type="number"
          dataKey="t"
          domain={[0, Math.max(maxT, 1)]}
          ticks={xTicks}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 10 }}
          allowDecimals={false}
        />

        <YAxis
          tickLine={false}
          axisLine={false}
          width={36}
          domain={yDomain}
          tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 10 }}
          tickFormatter={(v) =>
            typeof v === "number"
              ? variant === "temp"
                ? Number.isInteger(v)
                  ? String(v)
                  : v.toFixed(1)
                : String(Math.round(v))
              : v
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
