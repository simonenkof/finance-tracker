import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isAfter,
  isBefore,
  isEqual,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function parseDate(iso: string): Date {
  return parseISO(iso);
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), "dd.MM.yyyy");
}

export function addPeriod(
  iso: string,
  period: "day" | "week" | "month",
): string {
  const d = parseISO(iso);
  if (period === "day") return format(addDays(d, 1), "yyyy-MM-dd");
  if (period === "week") return format(addWeeks(d, 1), "yyyy-MM-dd");
  return format(addMonths(d, 1), "yyyy-MM-dd");
}

export function dateLTE(a: string, b: string): boolean {
  const da = parseISO(a);
  const db = parseISO(b);
  return isBefore(da, db) || isEqual(da, db);
}

export function dateGTE(a: string, b: string): boolean {
  const da = parseISO(a);
  const db = parseISO(b);
  return isAfter(da, db) || isEqual(da, db);
}

export function inRange(date: string, from: string, to: string): boolean {
  return dateGTE(date, from) && dateLTE(date, to);
}

export function weekRange(anchor = new Date()): { from: string; to: string } {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  return {
    from: format(start, "yyyy-MM-dd"),
    to: format(addDays(start, 6), "yyyy-MM-dd"),
  };
}

export function monthRange(anchor = new Date()): { from: string; to: string } {
  const start = startOfMonth(anchor);
  const end = addDays(addMonths(start, 1), -1);
  return {
    from: format(start, "yyyy-MM-dd"),
    to: format(end, "yyyy-MM-dd"),
  };
}

export function budgetEndDate(
  startDate: string,
  duration: "twoWeeks" | "month" | "year",
): string {
  const start = parseISO(startDate);
  if (duration === "twoWeeks") {
    return format(addDays(start, 13), "yyyy-MM-dd");
  }
  if (duration === "month") {
    return format(addDays(addMonths(start, 1), -1), "yyyy-MM-dd");
  }
  return format(addDays(addMonths(start, 12), -1), "yyyy-MM-dd");
}

export function formatRub(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}
