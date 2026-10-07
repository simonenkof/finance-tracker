"use client";

import { useState } from "react";
import {
  BarChart3,
  CreditCard,
  Database,
  Landmark,
  Menu,
  PiggyBank,
  Tags,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useFinance } from "@/lib/finance-context";
import { OperationsView } from "@/components/views/operations-view";
import { CategoriesView } from "@/components/views/categories-view";
import { BudgetView } from "@/components/views/budget-view";
import { AccountsView } from "@/components/views/accounts-view";
import { NetWorthView } from "@/components/views/net-worth-view";
import { AnalyticsView } from "@/components/views/analytics-view";
import { DataView } from "@/components/views/data-view";

const NAV = [
  { id: "operations", label: "Операции", icon: Wallet },
  { id: "categories", label: "Категории", icon: Tags },
  { id: "budget", label: "Бюджет", icon: PiggyBank },
  { id: "accounts", label: "Счета", icon: CreditCard },
  { id: "networth", label: "Net worth", icon: Landmark },
  { id: "analytics", label: "Аналитика", icon: BarChart3 },
  { id: "data", label: "Данные", icon: Database },
] as const;

type NavId = (typeof NAV)[number]["id"];

export function AppShell() {
  const { status, error, dirty, save, load, clearError } = useFinance();
  const [tab, setTab] = useState<NavId>("operations");
  const [mobileOpen, setMobileOpen] = useState(false);

  const navButton = (id: NavId, label: string, Icon: typeof Wallet) => (
    <button
      key={id}
      type="button"
      onClick={() => {
        setTab(id);
        setMobileOpen(false);
      }}
      className={
        tab === id
          ? "flex w-full items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          : "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      }
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  );

  return (
    <div className="flex min-h-full flex-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-background to-slate-100">
      <aside className="hidden w-56 shrink-0 border-r border-border/60 bg-background/80 p-4 backdrop-blur md:flex md:flex-col">
        <div className="mb-6 px-1">
          <p className="text-lg font-semibold tracking-tight text-emerald-900">
            Finance tracker
          </p>
          <p className="text-xs text-muted-foreground">Локальный учёт · RUB</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => navButton(item.id, item.label, item.icon))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button variant="outline" size="icon" className="md:hidden" />
                }
              >
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                <SheetHeader>
                  <SheetTitle>Finance tracker</SheetTitle>
                </SheetHeader>
                <nav className="mt-4 flex flex-col gap-1">
                  {NAV.map((item) => navButton(item.id, item.label, item.icon))}
                </nav>
              </SheetContent>
            </Sheet>
            <h1 className="text-base font-semibold md:text-lg">
              {NAV.find((n) => n.id === tab)?.label}
            </h1>
            {dirty ? (
              <Badge variant="secondary">Не сохранено</Badge>
            ) : null}
            {status === "loading" ? (
              <Badge variant="outline">Загрузка…</Badge>
            ) : null}
            {status === "saving" ? (
              <Badge variant="outline">Сохранение…</Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={status === "loading" || status === "saving"}
            >
              Обновить
            </Button>
            <Button
              size="sm"
              onClick={() => void save()}
              disabled={status === "loading" || status === "saving" || !dirty}
            >
              Сохранить
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-6">
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearError}
                  className="shrink-0"
                >
                  Скрыть
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {status === "loading" || status === "idle" ? (
            <div className="rounded-lg border border-dashed border-border bg-background/60 p-10 text-center text-muted-foreground">
              Загрузка данных из GitHub…
            </div>
          ) : (
            <>
              {tab === "operations" ? <OperationsView /> : null}
              {tab === "categories" ? <CategoriesView /> : null}
              {tab === "budget" ? <BudgetView /> : null}
              {tab === "accounts" ? <AccountsView /> : null}
              {tab === "networth" ? <NetWorthView /> : null}
              {tab === "analytics" ? <AnalyticsView /> : null}
              {tab === "data" ? <DataView /> : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
