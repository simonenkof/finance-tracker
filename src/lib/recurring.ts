import { v4 as uuidv4 } from "uuid";
import { addPeriod, dateLTE, todayISO } from "./dates";
import type { FinanceData, Operation, RecurringPayment } from "./types";

/**
 * For each active recurring payment, create expense operations for every
 * due period up to and including today, then update lastGeneratedDate.
 */
export function applyRecurring(data: FinanceData, today = todayISO()): FinanceData {
  const newOps: Operation[] = [];
  const updatedRecurring: RecurringPayment[] = data.recurring.map((r) => {
    if (!r.active) return r;

    let cursor = r.lastGeneratedDate
      ? addPeriod(r.lastGeneratedDate, r.period)
      : r.startDate;

    let lastGenerated = r.lastGeneratedDate;

    while (dateLTE(cursor, today)) {
      newOps.push({
        id: uuidv4(),
        type: "expense",
        date: cursor,
        amount: r.amount,
        categoryId: r.categoryId,
        comment: r.comment
          ? `[повтор] ${r.comment}`
          : `[повтор] ${r.period}`,
      });
      lastGenerated = cursor;
      cursor = addPeriod(cursor, r.period);
    }

    if (lastGenerated === r.lastGeneratedDate) return r;
    return { ...r, lastGeneratedDate: lastGenerated };
  });

  if (newOps.length === 0) {
    return data;
  }

  return {
    ...data,
    operations: [...data.operations, ...newOps],
    recurring: updatedRecurring,
  };
}
