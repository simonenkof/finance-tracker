"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { useFinance } from "@/lib/finance-context";

export function DataView() {
  const {
    data,
    sha,
    dirty,
    status,
    save,
    load,
    createBackup,
    listBackups,
    restore,
  } = useFinance();
  const [backups, setBackups] = useState<{ name: string; path: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshBackups = async () => {
    setBusy(true);
    const list = await listBackups();
    setBackups(list);
    setBusy(false);
  };

  useEffect(() => {
    void refreshBackups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async () => {
    setBusy(true);
    setMessage(null);
    const ok = await save();
    setMessage(ok ? "Сохранено в data/live.json" : null);
    setBusy(false);
  };

  const onBackup = async () => {
    setBusy(true);
    setMessage(null);
    const path = await createBackup();
    if (path) {
      setMessage(`Бэкап создан: ${path}`);
      await refreshBackups();
    }
    setBusy(false);
  };

  const onRestore = async (path: string) => {
    if (
      !confirm(
        `Восстановить ${path}? Текущий live.json будет перезаписан.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage(null);
    const ok = await restore(path);
    setMessage(ok ? `Восстановлено из ${path}` : null);
    setBusy(false);
  };

  const counts = {
    categories: data.categories.length,
    operations: data.operations.length,
    recurring: data.recurring.length,
    accounts: data.accounts.length,
    netWorth: data.netWorthItems.length,
    budgets: data.budgets.length,
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-background/70 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="font-medium">Рабочие данные</h2>
          {dirty ? (
            <Badge variant="secondary">Есть несохранённые изменения</Badge>
          ) : (
            <Badge variant="outline">Синхронизировано</Badge>
          )}
          {sha ? (
            <Badge variant="outline" className="font-mono text-[10px]">
              sha {sha.slice(0, 7)}
            </Badge>
          ) : (
            <Badge variant="outline">live.json ещё не создан</Badge>
          )}
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Файл <code className="text-xs">data/live.json</code> в репозитории{" "}
          <code className="text-xs">simonenkof/finance-tracker-data</code>.
          Токен только в <code className="text-xs">.env.local</code>.
        </p>
        <ul className="mb-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <li>Категории: {counts.categories}</li>
          <li>Операции: {counts.operations}</li>
          <li>Повторы: {counts.recurring}</li>
          <li>Счета: {counts.accounts}</li>
          <li>Net worth: {counts.netWorth}</li>
          <li>Бюджеты: {counts.budgets}</li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void onSave()}
            disabled={busy || status === "loading"}
          >
            Сохранить в GitHub
          </Button>
          <Button
            variant="outline"
            onClick={() => void load()}
            disabled={busy || status === "loading"}
          >
            Перезагрузить
          </Button>
          <Button
            variant="outline"
            onClick={() => void onBackup()}
            disabled={busy}
          >
            Создать бэкап
          </Button>
        </div>
        {message ? (
          <p className="mt-3 text-sm text-emerald-800">{message}</p>
        ) : null}
      </div>

      <div className="rounded-lg border bg-background/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-medium">Бэкапы</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void refreshBackups()}
            disabled={busy}
          >
            Обновить список
          </Button>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Отдельные снимки в <code className="text-xs">backups/*.json</code>.
          Восстановление копирует выбранный файл в live.json.
        </p>
        {backups.length === 0 ? (
          <EmptyState
            title="Бэкапов пока нет"
            hint="Создайте бэкап кнопкой выше."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Файл</TableHead>
                <TableHead className="w-36 text-right">Действие</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((b) => (
                <TableRow key={b.path}>
                  <TableCell className="font-mono text-xs">{b.name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void onRestore(b.path)}
                    >
                      Восстановить
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
