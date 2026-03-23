"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface TrendChartProps {
  data: Array<{ date: string; score: number }>;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${month}/${day}`;
}

export function TrendChart({ data }: TrendChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted}>
          <CartesianGrid stroke="#1E2030" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: "#5E6078", fontSize: 12 }}
            axisLine={{ stroke: "#1E2030" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{
              fill: "#5E6078",
              fontSize: 12,
              fontFamily: "var(--font-body)",
            }}
            axisLine={{ stroke: "#1E2030" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1A1B26",
              border: "1px solid #2A2D42",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "var(--font-body)",
              color: "#E8E9ED",
            }}
            labelStyle={{ color: "#9496A8" }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#00D4AA"
            strokeWidth={2}
            dot={{ fill: "#00D4AA", r: 3 }}
            activeDot={{ r: 5, fill: "#00D4AA" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
