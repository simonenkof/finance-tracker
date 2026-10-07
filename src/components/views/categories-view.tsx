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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { useFinance } from "@/lib/finance-context";
import { newId } from "@/lib/id";
import type { Category } from "@/lib/types";

export function CategoriesView() {
  const { data, setData } = useFinance();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");

  const openCreate = () => {
    setEditing(null);
    setName("");
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setOpen(true);
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editing) {
      setData({
        ...data,
        categories: data.categories.map((c) =>
          c.id === editing.id ? { ...c, name: trimmed } : c,
        ),
      });
    } else {
      setData({
        ...data,
        categories: [...data.categories, { id: newId(), name: trimmed }],
      });
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    setData({
      ...data,
      categories: data.categories.filter((c) => c.id !== id),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Категории для доходов и расходов. Без подкатегорий.
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Добавить
        </Button>
      </div>

      {data.categories.length === 0 ? (
        <EmptyState
          title="Категорий пока нет"
          hint="Создайте первую категорию, чтобы размечать операции."
          actionLabel="Создать категорию"
          onAction={openCreate}
        />
      ) : (
        <div className="rounded-lg border bg-background/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead className="w-28 text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(c.id)}
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
              {editing ? "Редактировать категорию" : "Новая категория"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cat-name">Название</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Продукты"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={save} disabled={!name.trim()}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
