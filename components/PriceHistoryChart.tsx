"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDateLabel(dateStr: string): string {
  // dateStr is "YYYY-MM-DD"
  const [, mm, dd] = dateStr.split("-");
  const month = MONTH_ABBR[Number(mm) - 1] ?? mm;
  const day = Number(dd);
  return `${month} ${day}`;
}

type PricePoint = {
  date: string;
  close: number;
};

type Props = {
  data: PricePoint[];
};

export default function PriceHistoryChart({ data }: Props) {
  const chartData = [...data]
    .slice(0, 30)
    .reverse()
    .map((item) => ({
      date: item.date,
      label: formatDateLabel(item.date),
      close: Number(item.close.toFixed(2)),
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[380px] w-full items-center justify-center rounded-2xl border border-slate-600/40 bg-[#232336] p-4 shadow-sm">
        <p className="text-slate-500">No price data available</p>
      </div>
    );
  }

  // Pick ticks every 10 trading days, always including first and last
  let tickValues: string[];
  if (chartData.length <= 1) {
    tickValues = chartData.map((d) => d.label);
  } else {
    const tickIndices: number[] = [0];
    for (let i = 10; i < chartData.length - 1; i += 10) {
      tickIndices.push(i);
    }
    tickIndices.push(chartData.length - 1);
    tickValues = tickIndices.map((i) => chartData[i].label);
  }

  // Green if price went up over the period, red if it went down
  const firstClose = chartData[0].close;
  const lastClose = chartData[chartData.length - 1].close;
  const trendColor = lastClose >= firstClose ? "#22c55e" : "#ef4444";

  return (
    <div className="h-[380px] w-full rounded-2xl border border-slate-600/40 bg-[#232336] p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-white">
        30-Day Price History
      </h2>

      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={trendColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={trendColor} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
          <XAxis
            dataKey="label"
            ticks={tickValues}
            tickLine={true}
            tick={{ fontSize: 12, fill: "#64748b" }}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={({ x, y, payload, index }: any) => {
              if (index === 0) return <g />;
              return (
                <text x={x} y={y} fontSize={12} fill="#64748b" textAnchor="end">
                  ${payload.value}
                </text>
              );
            }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #2a2a3a",
              backgroundColor: "#1a1a2e",
              color: "#e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
            labelFormatter={(label) => label}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [
              `$${Number(value).toFixed(2)}`,
              "Close",
            ]}
          />
          <Area
            type="linear"
            dataKey="close"
            stroke={trendColor}
            strokeWidth={2}
            fill="url(#colorClose)"
            dot={false}
            activeDot={{ r: 5, fill: trendColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
