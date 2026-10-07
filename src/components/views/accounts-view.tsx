"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { HistoryLineChart } from "@/components/history-chart";
import { formatRub, todayISO } from "@/lib/dates";
import { useFinance } from "@/lib/finance-context";
import { newId } from "@/lib/id";
import { accountBalance, accountHistorySeries } from "@/lib/net-worth";
import type { Account } from "@/lib/types";

export function AccountsView() {
  const { data, setData } = useFinance();
  const [open, setOpen] = useState(false);
  const [snapOpen, setSnapOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [snapAccount, setSnapAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [snapDate, setSnapDate] = useState("");
  const [snapAmount, setSnapAmount] = useState("");

  const openCreate = () => {
    setEditing(null);
    setName("");
    setOpen(true);
  };

  const openEdit = (a: Account) => {
    setEditing(a);
    setName(a.name);
    setOpen(true);
  };

  const saveAccount = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editing) {
      setData({
        ...data,
        accounts: data.accounts.map((a) =>
          a.id === editing.id ? { ...a, name: trimmed } : a,
        ),
      });
    } else {
      setData({
        ...data,
        accounts: [
          ...data.accounts,
          { id: newId(), name: trimmed, history: [] },
        ],
      });
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    setData({
      ...data,
      accounts: data.accounts.filter((a) => a.id !== id),
    });
  };

  const openSnap = (a: Account) => {
    setSnapAccount(a);
    setSnapDate(todayISO());
    setSnapAmount("");
    setSnapOpen(true);
  };

  const saveSnap = () => {
    if (!snapAccount) return;
    const amount = Number(snapAmount);
    if (!snapDate || !Number.isFinite(amount)) return;
    setData({
      ...data,
      accounts: data.accounts.map((a) => {
        if (a.id !== snapAccount.id) return a;
        const history = [
          ...a.history.filter((h) => h.date !== snapDate),
          { date: snapDate, amount },
        ].sort((x, y) => x.date.localeCompare(y.date));
        return { ...a, history };
      }),
    });
    setSnapOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Счета не связаны с операциями — только ручные снимки баланса.
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Счёт
        </Button>
      </div>

      {data.accounts.length === 0 ? (
        <EmptyState
          title="Счетов нет"
          hint="Создайте счёт и добавьте снимки баланса (дата, сумма)."
          actionLabel="Создать счёт"
          onAction={openCreate}
        />
      ) : (
        <div className="space-y-4">
          {data.accounts.map((a) => (
            <div
              key={a.id}
              className="rounded-lg border bg-background/70 p-4"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    Баланс: {formatRub(accountBalance(a))}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => openSnap(a)}>
                    Снимок
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(a)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(a.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <HistoryLineChart data={accountHistorySeries(a)} />
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Редактировать счёт" : "Новый счёт"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="acc-name">Название</Label>
            <Input
              id="acc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Тинькофф"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={saveAccount} disabled={!name.trim()}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={snapOpen} onOpenChange={setSnapOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Снимок баланса{snapAccount ? `: ${snapAccount.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="snap-date">Дата</Label>
              <Input
                id="snap-date"
                type="date"
                value={snapDate}
                onChange={(e) => setSnapDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="snap-amount">Сумма (₽)</Label>
              <Input
                id="snap-amount"
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
