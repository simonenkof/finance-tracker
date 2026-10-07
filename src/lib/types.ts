export type OperationType = "income" | "expense";
export type RecurringPeriod = "day" | "week" | "month";
export type BudgetDuration = "twoWeeks" | "month" | "year";
export type NetWorthKind = "asset" | "liability";

export interface Category {
  id: string;
  name: string;
}

export interface Operation {
  id: string;
  type: OperationType;
  date: string; // YYYY-MM-DD
  amount: number;
  categoryId: string;
  comment: string;
}

export interface RecurringPayment {
  id: string;
  period: RecurringPeriod;
  startDate: string;
  amount: number;
  categoryId: string;
  comment: string;
  active: boolean;
  lastGeneratedDate: string | null;
}

export interface BalanceSnapshot {
  date: string;
  amount: number;
}

export interface Account {
  id: string;
  name: string;
  history: BalanceSnapshot[];
}

export interface NetWorthItem {
  id: string;
  name: string;
  kind: NetWorthKind;
  history: BalanceSnapshot[];
}

export interface CategoryLimit {
  categoryIds: string[];
  limit: number;
}

export interface Budget {
  id: string;
  startDate: string;
  duration: BudgetDuration;
  overallLimit?: number;
  categoryLimits: CategoryLimit[];
}

export interface FinanceData {
  version: 1;
  categories: Category[];
  operations: Operation[];
  recurring: RecurringPayment[];
  accounts: Account[];
  netWorthItems: NetWorthItem[];
  budgets: Budget[];
}

export function emptyFinanceData(): FinanceData {
  return {
    version: 1,
    categories: [],
    operations: [],
    recurring: [],
    accounts: [],
    netWorthItems: [],
    budgets: [],
  };
}
