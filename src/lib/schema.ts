import { z } from "zod";
import type { FinanceData } from "./types";
import { emptyFinanceData } from "./types";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const snapshotSchema = z.object({
  date: dateString,
  amount: z.number(),
});

const financeDataSchema = z.object({
  version: z.literal(1),
  categories: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
    }),
  ),
  operations: z.array(
    z.object({
      id: z.string().min(1),
      type: z.enum(["income", "expense"]),
      date: dateString,
      amount: z.number(),
      categoryId: z.string(),
      comment: z.string(),
    }),
  ),
  recurring: z.array(
    z.object({
      id: z.string().min(1),
      period: z.enum(["day", "week", "month"]),
      startDate: dateString,
      amount: z.number(),
      categoryId: z.string(),
      comment: z.string(),
      active: z.boolean(),
      lastGeneratedDate: dateString.nullable(),
    }),
  ),
  accounts: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      history: z.array(snapshotSchema),
    }),
  ),
  netWorthItems: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      kind: z.enum(["asset", "liability"]),
      history: z.array(snapshotSchema),
    }),
  ),
  budgets: z.array(
    z.object({
      id: z.string().min(1),
      startDate: dateString,
      duration: z.enum(["twoWeeks", "month", "year"]),
      overallLimit: z.number().optional(),
      categoryLimits: z.array(
        z.object({
          categoryIds: z.array(z.string()),
          limit: z.number(),
        }),
      ),
    }),
  ),
});

export function parseFinanceData(raw: unknown): FinanceData {
  const result = financeDataSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid finance data: ${result.error.message}`);
  }
  return result.data;
}

export function tryParseFinanceData(raw: unknown): FinanceData {
  try {
    return parseFinanceData(raw);
  } catch {
    return emptyFinanceData();
  }
}
