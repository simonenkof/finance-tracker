import type { Account, BalanceSnapshot, FinanceData, NetWorthItem } from "./types";

function latestAmount(history: BalanceSnapshot[]): number {
  if (history.length === 0) return 0;
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  return sorted[sorted.length - 1]?.amount ?? 0;
}

export function accountBalance(account: Account): number {
  return latestAmount(account.history);
}

export function itemBalance(item: NetWorthItem): number {
  return latestAmount(item.history);
}

export function computeNetWorth(data: FinanceData): {
  assets: number;
  liabilities: number;
  total: number;
} {
  let assets = 0;
  let liabilities = 0;
  for (const item of data.netWorthItems) {
    const v = itemBalance(item);
    if (item.kind === "asset") assets += v;
    else liabilities += v;
  }
  return { assets, liabilities, total: assets - liabilities };
}

/** Combined net worth history by date across all items. */
export function netWorthHistorySeries(
  data: FinanceData,
): { date: string; total: number }[] {
  const dates = new Set<string>();
  for (const item of data.netWorthItems) {
    for (const s of item.history) dates.add(s.date);
  }
  const sortedDates = [...dates].sort();
  return sortedDates.map((date) => {
    let assets = 0;
    let liabilities = 0;
    for (const item of data.netWorthItems) {
      const relevant = item.history
        .filter((s) => s.date <= date)
        .sort((a, b) => a.date.localeCompare(b.date));
      const amount = relevant[relevant.length - 1]?.amount ?? 0;
      if (item.kind === "asset") assets += amount;
      else liabilities += amount;
    }
    return { date, total: assets - liabilities };
  });
}

export function accountHistorySeries(
  account: Account,
): { date: string; amount: number }[] {
  return [...account.history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({ date: s.date, amount: s.amount }));
}
