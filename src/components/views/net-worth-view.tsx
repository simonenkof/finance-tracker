"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { HistoryLineChart } from "@/components/history-chart";
import { formatRub, todayISO } from "@/lib/dates";
import { useFinance } from "@/lib/finance-context";
import { newId } from "@/lib/id";
import {
  computeNetWorth,
  itemBalance,
  netWorthHistorySeries,
} from "@/lib/net-worth";
import type { NetWorthItem, NetWorthKind } from "@/lib/types";

export function NetWorthView() {
  const { data, setData } = useFinance();
  const totals = computeNetWorth(data);
  const series = netWorthHistorySeries(data);

  const [open, setOpen] = useState(false);
  const [snapOpen, setSnapOpen] = useState(false);
  const [editing, setEditing] = useState<NetWorthItem | null>(null);
  const [snapItem, setSnapItem] = useState<NetWorthItem | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<NetWorthKind>("asset");
  const [snapDate, setSnapDate] = useState(todayISO());
  const [snapAmount, setSnapAmount] = useState("");

  const openCreate = () => {
    setEditing(null);
    setName("");
    setKind("asset");
    setOpen(true);
  };

  const openEdit = (item: NetWorthItem) => {
    setEditing(item);
    setName(item.name);
    setKind(item.kind);
    setOpen(true);
  };

  const saveItem = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editing) {
      setData({
        ...data,
        netWorthItems: data.netWorthItems.map((i) =>
          i.id === editing.id ? { ...i, name: trimmed, kind } : i,
        ),
      });
    } else {
      setData({
        ...data,
        netWorthItems: [
          ...data.netWorthItems,
          { id: newId(), name: trimmed, kind, history: [] },
        ],
      });
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    setData({
      ...data,
      netWorthItems: data.netWorthItems.filter((i) => i.id !== id),
    });
  };

  const openSnap = (item: NetWorthItem) => {
    setSnapItem(item);
    setSnapDate(todayISO());
    setSnapAmount("");
    setSnapOpen(true);
  };

  const saveSnap = () => {
    if (!snapItem) return;
    const amount = Number(snapAmount);
    if (!snapDate || !Number.isFinite(amount)) return;
    setData({
      ...data,
      netWorthItems: data.netWorthItems.map((i) => {
        if (i.id !== snapItem.id) return i;
        const history = [
          ...i.history.filter((h) => h.date !== snapDate),
          { date: snapDate, amount },
        ].sort((x, y) => x.date.localeCompare(y.date));
        return { ...i, history };
      }),
    });
    setSnapOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Активы и пассивы. Итог = активы − пассивы (по последним снимкам).
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Позиция
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Активы" value={formatRub(totals.assets)} />
        <Stat label="Пассивы" value={formatRub(totals.liabilities)} />
        <Stat label="Net worth" value={formatRub(totals.total)} emphasize />
      </div>

      <div className="rounded-lg border bg-background/70 p-4">
        <p className="mb-2 text-sm font-medium">История net worth</p>
        <HistoryLineChart
          data={series}
          dataKey="total"
          emptyHint="Добавьте позиции и снимки — появится кривая."
        />
      </div>

      {data.netWorthItems.length === 0 ? (
        <EmptyState
          title="Позиций нет"
          hint="Добавьте актив или пассив и снимки (дата, сумма)."
          actionLabel="Добавить"
          onAction={openCreate}
        />
      ) : (
        <div className="space-y-3">
          {data.netWorthItems.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border bg-background/70 p-4"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{item.name}</p>
                  <Badge variant="outline">
                    {item.kind === "asset" ? "Актив" : "Пассив"}
                  </Badge>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {formatRub(itemBalance(item))}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openSnap(item)}
                  >
                    Снимок
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <HistoryLineChart
                data={[...item.history]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((h) => ({ date: h.date, amount: h.amount }))}
              />
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Редактировать позицию" : "Новая позиция"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="nw-name">Название</Label>
              <Input
                id="nw-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Тип</Label>
              <Select
                value={kind}
                onValueChange={(v) => {
                  if (v) setKind(v as NetWorthKind);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Актив</SelectItem>
                  <SelectItem value="liability">Пассив</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={saveItem} disabled={!name.trim()}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={snapOpen} onOpenChange={setSnapOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Снимок{snapItem ? `: ${snapItem.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="nw-snap-date">Дата</Label>
              <Input
                id="nw-snap-date"
                type="date"
                value={snapDate}
                onChange={(e) => setSnapDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nw-snap-amount">Сумма (₽)</Label>
              <Input
                id="nw-snap-amount"
                type="number"
                value={snapAmount}
                onChange={(e) => setSnapAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSnapOpen(false)}>
              Отмена
            </Button>
            <Button onClick={saveSnap}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={
        emphasize
          ? "rounded-lg border border-emerald-200 bg-emerald-50/80 p-3"
          : "rounded-lg border bg-background/70 p-3"
      }
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
