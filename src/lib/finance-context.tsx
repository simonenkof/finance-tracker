"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { emptyFinanceData, type FinanceData } from "./types";

type Status = "idle" | "loading" | "ready" | "saving" | "error";

interface FinanceContextValue {
  data: FinanceData;
  setData: (updater: FinanceData | ((prev: FinanceData) => FinanceData)) => void;
  sha: string | null;
  status: Status;
  error: string | null;
  dirty: boolean;
  load: () => Promise<void>;
  save: () => Promise<boolean>;
  createBackup: () => Promise<string | null>;
  listBackups: () => Promise<{ name: string; path: string }[]>;
  restore: (path: string) => Promise<boolean>;
  clearError: () => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `Ошибка ${res.status}`;
  } catch {
    return `Ошибка ${res.status}`;
  }
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<FinanceData>(() => emptyFinanceData());
  const [sha, setSha] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const setData = useCallback(
    (updater: FinanceData | ((prev: FinanceData) => FinanceData)) => {
      setDataState((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
      setDirty(true);
    },
    [],
  );

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/data", { cache: "no-store" });
      if (!res.ok) {
        setError(await readError(res));
        setStatus("error");
        return;
      }
      const body = (await res.json()) as {
        data: FinanceData;
        sha: string | null;
        generated?: boolean;
      };
      setDataState(body.data);
      setSha(body.sha);
      setDirty(Boolean(body.generated));
      setStatus("ready");
    } catch {
      setError("Не удалось загрузить данные. Проверьте сеть и .env.local.");
      setStatus("error");
    }
  }, []);

  const save = useCallback(async () => {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, sha }),
      });
      if (!res.ok) {
        setError(await readError(res));
        setStatus("error");
        return false;
      }
      const body = (await res.json()) as {
        data: FinanceData;
        sha: string;
      };
      setDataState(body.data);
      setSha(body.sha);
      setDirty(false);
      setStatus("ready");
      return true;
    } catch {
      setError("Не удалось сохранить данные.");
      setStatus("error");
      return false;
    }
  }, [data, sha]);

  const createBackup = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) {
        setError(await readError(res));
        return null;
      }
      const body = (await res.json()) as { path: string };
      return body.path;
    } catch {
      setError("Не удалось создать бэкап.");
      return null;
    }
  }, [data]);

  const listBackups = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/backups");
      if (!res.ok) {
        setError(await readError(res));
        return [];
      }
      const body = (await res.json()) as {
        backups: { name: string; path: string }[];
      };
      return body.backups;
    } catch {
      setError("Не удалось получить список бэкапов.");
      return [];
    }
  }, []);

  const restore = useCallback(
    async (path: string) => {
      setStatus("saving");
      setError(null);
      try {
        const res = await fetch("/api/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, sha }),
        });
        if (!res.ok) {
          setError(await readError(res));
          setStatus("error");
          return false;
        }
        const body = (await res.json()) as {
          data: FinanceData;
          sha: string;
        };
        setDataState(body.data);
        setSha(body.sha);
        setDirty(false);
        setStatus("ready");
        return true;
      } catch {
        setError("Не удалось восстановить бэкап.");
        setStatus("error");
        return false;
      }
    },
    [sha],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("loading");
      setError(null);
      try {
        const res = await fetch("/api/data", { cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) {
          setError(await readError(res));
          setStatus("error");
          return;
        }
        const body = (await res.json()) as {
          data: FinanceData;
          sha: string | null;
          generated?: boolean;
        };
        if (cancelled) return;
        setDataState(body.data);
        setSha(body.sha);
        setDirty(Boolean(body.generated));
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setError("Не удалось загрузить данные. Проверьте сеть и .env.local.");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      data,
      setData,
      sha,
      status,
      error,
      dirty,
      load,
      save,
      createBackup,
      listBackups,
      restore,
      clearError: () => setError(null),
    }),
    [
      data,
      setData,
      sha,
      status,
      error,
      dirty,
      load,
      save,
      createBackup,
      listBackups,
      restore,
    ],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error("useFinance must be used within FinanceProvider");
  }
  return ctx;
}
