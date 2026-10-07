import { inRange } from "./dates";
import type { Category, FinanceData, Operation } from "./types";

export interface CategoryExpenseBar {
  categoryId: string;
  categoryName: string;
  total: number;
}

export function expensesByCategory(
  data: FinanceData,
  from: string,
  to: string,
): CategoryExpenseBar[] {
  const nameById = new Map(data.categories.map((c) => [c.id, c.name]));
  const totals = new Map<string, number>();

  for (const op of data.operations) {
    if (op.type !== "expense") continue;
    if (!inRange(op.date, from, to)) continue;
    totals.set(op.categoryId, (totals.get(op.categoryId) ?? 0) + op.amount);
  }

  return [...totals.entries()]
    .map(([categoryId, total]) => ({
      categoryId,
      categoryName: nameById.get(categoryId) ?? "Без категории",
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

export function filterOperations(
  operations: Operation[],
  from: string,
  to: string,
): Operation[] {
  return operations.filter((op) => inRange(op.date, from, to));
}

export function categoryName(
  categories: Category[],
  id: string,
): string {
  return categories.find((c) => c.id === id)?.name ?? "—";
}
