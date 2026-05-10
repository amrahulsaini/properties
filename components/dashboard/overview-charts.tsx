"use client";

import { useEffect, useState } from "react";
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
  const chartData = data.slice(-3);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 8, left: isMobile ? 0 : 56, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(17, 17, 17, 0.08)" />
          <XAxis
            dataKey="month"
            stroke="#6B6259"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(17,17,17,0.1)" }}
          />
          {!isMobile && (
            <YAxis
              stroke="#6B6259"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatTick}
              width={56}
            />
          )}
          <Tooltip formatter={(value) => `₹${Number(value ?? 0).toLocaleString("en-IN")}`} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Line
            dataKey="sales"
            name="Sales"
            stroke="#111111"
            strokeWidth={2}
            dot={{ r: 3, fill: "#111111" }}
            activeDot={{ r: 5 }}
          />
          <Line
            dataKey="expenses"
            name="Expenses"
            stroke="#F26A1B"
            strokeWidth={2}
            dot={{ r: 3, fill: "#F26A1B" }}
            activeDot={{ r: 5 }}
          />
          <Line
            dataKey="profit"
            name="Profit"
            stroke="#1F7A45"
            strokeWidth={2}
            dot={{ r: 3, fill: "#1F7A45" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
