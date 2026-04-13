"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import type { MonthProjection } from "@/types";
import { formatCHF } from "@/lib/format";

interface CashflowChartProps {
  projections: MonthProjection[];
  minCashBuffer: number;
}

export function CashflowChart({
  projections,
  minCashBuffer,
}: CashflowChartProps) {
  const data = projections.map((p) => ({
    label: p.label,
    cash: Math.round(p.endingCash),
    breached: p.runwayBreached,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            formatter={(value) => [formatCHF(Number(value)), "Cash Balance"]}
            labelStyle={{ color: "#0f172a", fontWeight: 600 }}
            contentStyle={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          />
          <ReferenceLine
            y={minCashBuffer}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            label={{
              value: `Buffer: ${formatCHF(minCashBuffer)}`,
              position: "insideBottomRight",
              fontSize: 11,
              fill: "#f59e0b",
            }}
          />
          <Area
            type="monotone"
            dataKey="cash"
            fill="url(#cashGradient)"
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="cash"
            stroke="var(--color-chart-1)"
            strokeWidth={2.5}
            dot={(props: Record<string, unknown>) => {
              const { cx, cy, payload } = props as { cx: number; cy: number; payload: { breached: boolean } };
              if (payload.breached) {
                return (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill="#ef4444"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }
              return (
                <circle
                  key={`dot-${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill="var(--color-chart-1)"
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
