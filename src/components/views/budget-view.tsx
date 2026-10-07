"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { allBudgetProgress } from "@/lib/budget";
import { formatDate, formatRub, todayISO } from "@/lib/dates";
import { useFinance } from "@/lib/finance-context";
import { newId } from "@/lib/id";
import type { Budget, BudgetDuration, CategoryLimit } from "@/lib/types";

const DURATION_LABEL: Record<BudgetDuration, string> = {
  twoWeeks: "2 недели",
  month: "Месяц",
  year: "Год",
};

export function BudgetView() {
  const { data, setData } = useFinance();
  const progress = useMemo(() => allBudgetProgress(data), [data]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState<BudgetDuration>("month");
  const [overallLimit, setOverallLimit] = useState("");
  const [catLimit, setCatLimit] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const openCreate = () => {
    setEditing(null);
    setStartDate(todayISO());
    setDuration("month");
    setOverallLimit("");
    setCatLimit("");
    setSelectedCats([]);
    setOpen(true);
  };

  const openEdit = (b: Budget) => {
    setEditing(b);
    setStartDate(b.startDate);
    setDuration(b.duration);
    setOverallLimit(
      b.overallLimit != null ? String(b.overallLimit) : "",
    );
    const first = b.categoryLimits[0];
    setCatLimit(first ? String(first.limit) : "");
    setSelectedCats(first?.categoryIds ?? []);
    setOpen(true);
  };

  const toggleCat = (id: string) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const save = () => {
    const overall =
      overallLimit.trim() === "" ? undefined : Number(overallLimit);
    if (overall != null && (!Number.isFinite(overall) || overall < 0)) return;

    const categoryLimits: CategoryLimit[] = [];
    if (selectedCats.length > 0 && catLimit.trim() !== "") {
      const limit = Number(catLimit);
      if (!Number.isFinite(limit) || limit < 0) return;
      categoryLimits.push({ categoryIds: selectedCats, limit });
    }

    if (overall == null && categoryLimits.length === 0) return;

    const next: Budget = {
      id: editing?.id ?? newId(),
      startDate,
      duration,
      overallLimit: overall,
      categoryLimits: editing
        ? categoryLimits.length > 0
          ? categoryLimits
          : editing.categoryLimits
        : categoryLimits,
    };

    // When editing, if user cleared category selection keep existing unless they set new ones
    if (editing && selectedCats.length === 0 && catLimit.trim() === "") {
      next.categoryLimits = editing.categoryLimits;
    }

    if (editing) {
      setData({
        ...data,
        budgets: data.budgets.map((b) => (b.id === editing.id ? next : b)),
      });
    } else {
      setData({ ...data, budgets: [...data.budgets, next] });
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    setData({
      ...data,
      budgets: data.budgets.filter((b) => b.id !== id),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Период с любой даты · лимит общий и/или по категориям.
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Бюджет
        </Button>
      </div>

      {progress.length === 0 ? (
        <EmptyState
          title="Бюджетов нет"
          hint="Задайте период и лимиты — увидите потрачено / запланировано."
          actionLabel="Создать бюджет"
          onAction={openCreate}
        />
      ) : (
        <div className="space-y-4">
          {progress.map((p) => (
            <div
              key={p.budget.id}
              className="rounded-lg border bg-background/70 p-4"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {DURATION_LABEL[p.budget.duration]} ·{" "}
                    {formatDate(p.budget.startDate)} —{" "}
                    {formatDate(p.endDate)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(p.budget)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(p.budget.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {p.overall ? (
                <LimitBar
                  label="Общий лимит"
                  spent={p.overall.spent}
                  limit={p.overall.limit}
                  ratio={p.overall.ratio}
                />
              ) : null}

              {p.categories.map((c) => (
                <LimitBar
                  key={c.categoryIds.join("-")}
                  label={c.label}
                  spent={c.spent}
                  limit={c.limit}
                  ratio={c.ratio}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Редактировать бюджет" : "Новый бюджет"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="bud-start">Дата начала</Label>
              <Input
                id="bud-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Длительность</Label>
              <Select
                value={duration}
                onValueChange={(v) => {
                  if (v) setDuration(v as BudgetDuration);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twoWeeks">2 недели</SelectItem>
                  <SelectItem value="month">Месяц</SelectItem>
                  <SelectItem value="year">Год</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bud-overall">Общий лимит (₽, опционально)</Label>
              <Input
                id="bud-overall"
                type="number"
                min={0}
                value={overallLimit}
                onChange={(e) => setOverallLimit(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Категории для лимита</Label>
              {data.categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Нет категорий — можно задать только общий лимит.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCat(c.id)}
                      className={
                        selectedCats.includes(c.id)
                          ? "rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
                          : "rounded-md border px-2 py-1 text-xs"
                      }
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bud-cat">Лимит по выбранным категориям (₽)</Label>
              <Input
                id="bud-cat"
                type="number"
                min={0}
                value={catLimit}
                onChange={(e) => setCatLimit(e.target.value)}
                disabled={selectedCats.length === 0}
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

function LimitBar({
  label,
  spent,
  limit,
  ratio,
}: {
  label: string;
  spent: number;
  limit: number;
  ratio: number;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {formatRub(spent)} / {formatRub(limit)}
        </span>
      </div>
      <Progress value={ratio * 100} />
    </div>
  );
}
