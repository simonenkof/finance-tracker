"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { expensesByCategory } from "@/lib/analytics";
import {
  formatDate,
  formatRub,
  monthRange,
  weekRange,
} from "@/lib/dates";
import { useFinance } from "@/lib/finance-context";

type FilterMode = "week" | "month" | "custom";

export function AnalyticsView() {
  const { data } = useFinance();
  const [mode, setMode] = useState<FilterMode>("month");
  const [customFrom, setCustomFrom] = useState(monthRange().from);
  const [customTo, setCustomTo] = useState(monthRange().to);

  const range = useMemo(() => {
    if (mode === "week") return weekRange();
    if (mode === "month") return monthRange();
    return { from: customFrom, to: customTo };
  }, [mode, customFrom, customTo]);

  const bars = useMemo(
    () => expensesByCategory(data, range.from, range.to),
    [data, range.from, range.to],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Расходы по категориям. Фильтры: неделя, месяц или произвольный диапазон
        дат (без времени).
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={mode === "week" ? "default" : "outline"}
          onClick={() => setMode("week")}
        >
          Неделя
        </Button>
        <Button
          size="sm"
          variant={mode === "month" ? "default" : "outline"}
          onClick={() => setMode("month")}
        >
          Месяц
        </Button>
        <Button
          size="sm"
          variant={mode === "custom" ? "default" : "outline"}
          onClick={() => setMode("custom")}
        >
          Диапазон
        </Button>
      </div>

      {mode === "custom" ? (
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <Label htmlFor="from">С</Label>
            <Input
              id="from"
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to">По</Label>
            <Input
              id="to"
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
        </div>
      ) : null}

      <p className="text-sm tabular-nums text-muted-foreground">
        Период: {formatDate(range.from)} — {formatDate(range.to)}
      </p>

      {bars.length === 0 ? (
        <EmptyState
          title="Нет расходов за период"
          hint="Добавьте операции расхода или смените фильтр дат."
        />
      ) : (
        <div className="rounded-lg border bg-background/70 p-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bars}
                margin={{ top: 8, right: 8, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="categoryName"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={60}
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
                />
                <Bar
                  dataKey="total"
                  fill="var(--color-emerald-700, #047857)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 space-y-1 text-sm">
            {bars.map((b) => (
              <li
                key={b.categoryId}
                className="flex justify-between tabular-nums"
              >
                <span>{b.categoryName}</span>
                <span>{formatRub(b.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
