"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate, formatRub } from "@/lib/dates";

export function HistoryLineChart({
  data,
  dataKey = "amount",
  emptyHint = "Добавьте снимки, чтобы увидеть график.",
}: {
  data: { date: string; [key: string]: string | number }[];
  dataKey?: string;
  emptyHint?: string;
}) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyHint}
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => formatDate(v)}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(v: number) =>
              new Intl.NumberFormat("ru-RU", {
                notation: "compact",
              }).format(v)
            }
            tick={{ fontSize: 11 }}
            width={48}
          />
          <Tooltip
            formatter={(value) => formatRub(Number(value))}
            labelFormatter={(label) => formatDate(String(label))}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="var(--color-emerald-700, #047857)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
