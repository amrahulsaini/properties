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

export function OverviewCharts({ data }: OverviewChartsProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(17, 17, 17, 0.08)" />
          <XAxis dataKey="month" stroke="#6B6259" />
          <YAxis stroke="#6B6259" />
          <Tooltip />
          <Legend />
          <Line dataKey="sales" name="Sales" stroke="#111111" strokeWidth={3} />
          <Line dataKey="expenses" name="Expenses" stroke="#F26A1B" strokeWidth={3} />
          <Line dataKey="profit" name="Profit" stroke="#1F7A45" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
