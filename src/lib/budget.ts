import { budgetEndDate, inRange } from "./dates";
import type { Budget, FinanceData } from "./types";

export interface BudgetProgress {
  budget: Budget;
  endDate: string;
  overall?: { spent: number; limit: number; ratio: number };
  categories: {
    categoryIds: string[];
    label: string;
    spent: number;
    limit: number;
    ratio: number;
  }[];
}

function clampRatio(spent: number, limit: number): number {
  if (limit <= 0) return spent > 0 ? 1 : 0;
  return Math.min(spent / limit, 1);
}

export function computeBudgetProgress(
  data: FinanceData,
  budget: Budget,
): BudgetProgress {
  const endDate = budgetEndDate(budget.startDate, budget.duration);
  const expenses = data.operations.filter(
    (op) =>
      op.type === "expense" &&
      inRange(op.date, budget.startDate, endDate),
  );

  const nameById = new Map(data.categories.map((c) => [c.id, c.name]));

  const categories = budget.categoryLimits.map((cl) => {
    const spent = expenses
      .filter((op) => cl.categoryIds.includes(op.categoryId))
      .reduce((s, op) => s + op.amount, 0);
    const label =
      cl.categoryIds
        .map((id) => nameById.get(id) ?? id)
        .join(", ") || "Категории";
    return {
      categoryIds: cl.categoryIds,
      label,
      spent,
      limit: cl.limit,
      ratio: clampRatio(spent, cl.limit),
    };
  });

  let overall: BudgetProgress["overall"];
  if (budget.overallLimit != null) {
    const spent = expenses.reduce((s, op) => s + op.amount, 0);
    overall = {
      spent,
      limit: budget.overallLimit,
      ratio: clampRatio(spent, budget.overallLimit),
    };
  }

  return { budget, endDate, overall, categories };
}

export function allBudgetProgress(data: FinanceData): BudgetProgress[] {
  return data.budgets.map((b) => computeBudgetProgress(data, b));
}
