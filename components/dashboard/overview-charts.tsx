"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface OverviewChartsProps {
  data: Array<{
    month: string;
    sales: number;
    expenses: number;
    profit: number;
  }>;
}

function formatTick(value: number) {
  if (value >= 10_00_000) return `₹${(value / 10_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return `₹${value}`;
}

export function OverviewCharts({ data }: OverviewChartsProps) {
  // Show only the last 3 months
  const chartData = data.slice(-3);

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 72, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(17, 17, 17, 0.08)" />
          <XAxis
            dataKey="month"
            stroke="#6B6259"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(17,17,17,0.1)" }}
          />
          <YAxis
            stroke="#6B6259"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatTick}
            width={68}
          />
          <Tooltip formatter={(value) => `₹${Number(value ?? 0).toLocaleString("en-IN")}`} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Line
            dataKey="sales"
            name="Sales"
            stroke="#111111"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#111111" }}
            activeDot={{ r: 6 }}
          />
          <Line
            dataKey="expenses"
            name="Expenses"
            stroke="#F26A1B"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#F26A1B" }}
            activeDot={{ r: 6 }}
          />
          <Line
            dataKey="profit"
            name="Profit"
            stroke="#1F7A45"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#1F7A45" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
