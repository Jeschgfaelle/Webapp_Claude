"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MonthProjection } from "@/types";
import { formatCHF } from "@/lib/format";

interface MonthlyBarChartProps {
  projections: MonthProjection[];
}

export function MonthlyBarChart({ projections }: MonthlyBarChartProps) {
  const data = projections.map((p) => ({
    label: p.label,
    income: Math.round(p.projectedIncome),
    expenses: Math.round(p.projectedExpenses),
    net: Math.round(p.netCashflow),
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
            }
          />
          <Tooltip
            formatter={(value, name) => [
              formatCHF(Number(value)),
              String(name).charAt(0).toUpperCase() + String(name).slice(1),
            ]}
            labelStyle={{ color: "#0f172a", fontWeight: 600 }}
            contentStyle={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
          />
          <Bar
            dataKey="income"
            name="Income"
            fill="var(--color-chart-income)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expenses"
            name="Expenses"
            fill="var(--color-chart-expense)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="net"
            name="Net Cashflow"
            fill="var(--color-chart-net)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
