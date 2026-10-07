"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { useFinance } from "@/lib/finance-context";
import { formatDate, formatRub, todayISO } from "@/lib/dates";
import { newId } from "@/lib/id";
import type {
  Operation,
  OperationType,
  RecurringPayment,
  RecurringPeriod,
} from "@/lib/types";

export function OperationsView() {
  return (
    <Tabs defaultValue="ops" className="space-y-4">
      <TabsList>
        <TabsTrigger value="ops">Доходы и расходы</TabsTrigger>
        <TabsTrigger value="recurring">Повторяющиеся</TabsTrigger>
      </TabsList>
      <TabsContent value="ops">
        <OrdinaryOps />
      </TabsContent>
      <TabsContent value="recurring">
        <RecurringOps />
      </TabsContent>
    </Tabs>
  );
}

function OrdinaryOps() {
  const { data, setData } = useFinance();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Operation | null>(null);
  const [type, setType] = useState<OperationType>("expense");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [comment, setComment] = useState("");

  const sorted = useMemo(
    () =>
      [...data.operations].sort((a, b) => b.date.localeCompare(a.date)),
    [data.operations],
  );

  const catName = (id: string) =>
    data.categories.find((c) => c.id === id)?.name ?? "—";

  const openCreate = () => {
    setEditing(null);
    setType("expense");
    setDate(todayISO());
    setAmount("");
    setCategoryId(data.categories[0]?.id ?? "");
    setComment("");
    setOpen(true);
  };

  const openEdit = (op: Operation) => {
    setEditing(op);
    setType(op.type);
    setDate(op.date);
    setAmount(String(op.amount));
    setCategoryId(op.categoryId);
    setComment(op.comment);
    setOpen(true);
  };

  const save = () => {
    const value = Number(amount);
    if (!date || !Number.isFinite(value) || value < 0 || !categoryId) return;
    const next: Operation = {
      id: editing?.id ?? newId(),
      type,
      date,
      amount: value,
      categoryId,
      comment: comment.trim(),
    };
    if (editing) {
      setData({
        ...data,
        operations: data.operations.map((o) =>
          o.id === editing.id ? next : o,
        ),
      });
    } else {
      setData({ ...data, operations: [...data.operations, next] });
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    setData({
      ...data,
      operations: data.operations.filter((o) => o.id !== id),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Обычные операции. Суммы в рублях, даты без времени.
        </p>
        <Button
          size="sm"
          onClick={openCreate}
          disabled={data.categories.length === 0}
        >
          <Plus className="size-4" />
          Добавить
        </Button>
      </div>

      {data.categories.length === 0 ? (
        <EmptyState
          title="Сначала создайте категорию"
          hint="Операции привязываются к категориям."
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="Операций пока нет"
          hint="Добавьте доход или расход."
          actionLabel="Добавить операцию"
          onAction={openCreate}
        />
      ) : (
        <div className="rounded-lg border bg-background/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Комментарий</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead className="w-28 text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((op) => (
                <TableRow key={op.id}>
                  <TableCell>{formatDate(op.date)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={op.type === "income" ? "default" : "secondary"}
                    >
                      {op.type === "income" ? "Доход" : "Расход"}
                    </Badge>
                  </TableCell>
                  <TableCell>{catName(op.categoryId)}</TableCell>
                  <TableCell className="max-w-[12rem] truncate text-muted-foreground">
                    {op.comment || "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatRub(op.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(op)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(op.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Редактировать операцию" : "Новая операция"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Тип</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  if (v) setType(v as OperationType);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Расход</SelectItem>
                  <SelectItem value="income">Доход</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="op-date">Дата</Label>
              <Input
                id="op-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="op-amount">Сумма (₽)</Label>
              <Input
                id="op-amount"
                type="number"
                min={0}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => {
                  if (v) setCategoryId(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите" />
                </SelectTrigger>
                <SelectContent>
                  {data.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="op-comment">Комментарий</Label>
              <Textarea
                id="op-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={save}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecurringOps() {
  const { data, setData } = useFinance();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringPayment | null>(null);
  const [period, setPeriod] = useState<RecurringPeriod>("month");
  const [startDate, setStartDate] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [comment, setComment] = useState("");
  const [active, setActive] = useState(true);

  const periodLabel: Record<RecurringPeriod, string> = {
    day: "День",
    week: "Неделя",
    month: "Месяц",
  };

  const catName = (id: string) =>
    data.categories.find((c) => c.id === id)?.name ?? "—";

  const openCreate = () => {
    setEditing(null);
    setPeriod("month");
    setStartDate(todayISO());
    setAmount("");
    setCategoryId(data.categories[0]?.id ?? "");
    setComment("");
    setActive(true);
    setOpen(true);
  };

  const openEdit = (r: RecurringPayment) => {
    setEditing(r);
    setPeriod(r.period);
    setStartDate(r.startDate);
    setAmount(String(r.amount));
    setCategoryId(r.categoryId);
    setComment(r.comment);
    setActive(r.active);
    setOpen(true);
  };

  const save = () => {
    const value = Number(amount);
    if (!startDate || !Number.isFinite(value) || value < 0 || !categoryId)
      return;
    const next: RecurringPayment = {
      id: editing?.id ?? newId(),
      period,
      startDate,
      amount: value,
      categoryId,
      comment: comment.trim(),
      active,
      lastGeneratedDate: editing?.lastGeneratedDate ?? null,
    };
    if (editing) {
      setData({
        ...data,
        recurring: data.recurring.map((r) =>
          r.id === editing.id ? next : r,
        ),
      });
    } else {
      setData({ ...data, recurring: [...data.recurring, next] });
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    setData({
      ...data,
      recurring: data.recurring.filter((r) => r.id !== id),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          При загрузке и сохранении просроченные периоды создают обычные
          расходы.
        </p>
        <Button
          size="sm"
          onClick={openCreate}
          disabled={data.categories.length === 0}
        >
          <Plus className="size-4" />
          Добавить
        </Button>
      </div>

      {data.categories.length === 0 ? (
        <EmptyState
          title="Сначала создайте категорию"
          hint="Повторяющиеся платежи тоже привязаны к категориям."
        />
      ) : data.recurring.length === 0 ? (
        <EmptyState
          title="Повторяющихся платежей нет"
          hint="Подписки и регулярные списания — здесь."
          actionLabel="Добавить"
          onAction={openCreate}
        />
      ) : (
        <div className="rounded-lg border bg-background/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Период</TableHead>
                <TableHead>Старт</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead className="w-28 text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recurring.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{periodLabel[r.period]}</TableCell>
                  <TableCell>{formatDate(r.startDate)}</TableCell>
                  <TableCell>{catName(r.categoryId)}</TableCell>
                  <TableCell>
                    <Badge variant={r.active ? "default" : "outline"}>
                      {r.active ? "Активен" : "Выкл"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatRub(r.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(r)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(r.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? "Редактировать повтор"
                : "Новый повторяющийся платёж"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Период</Label>
              <Select
                value={period}
                onValueChange={(v) => {
                  if (v) setPeriod(v as RecurringPeriod);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">День</SelectItem>
                  <SelectItem value="week">Неделя</SelectItem>
                  <SelectItem value="month">Месяц</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rec-start">Дата старта</Label>
              <Input
                id="rec-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rec-amount">Сумма (₽)</Label>
              <Input
                id="rec-amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => {
                  if (v) setCategoryId(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rec-comment">Комментарий</Label>
              <Textarea
                id="rec-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Активен (автосоздание расходов)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={save}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
