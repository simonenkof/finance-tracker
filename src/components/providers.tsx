"use client";

import type { ReactNode } from "react";
import { FinanceProvider } from "@/lib/finance-context";

export function Providers({ children }: { children: ReactNode }) {
  return <FinanceProvider>{children}</FinanceProvider>;
}
