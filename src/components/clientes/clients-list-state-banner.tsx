import { AlertTriangle, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ClientsListStateBanner({
  message,
  staleData,
  refreshing,
  onRetry,
}: {
  message: string;
  staleData: boolean;
  refreshing?: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(254,243,199,0.9))] p-5 shadow-[0_24px_50px_-36px_rgba(120,53,15,0.35)] dark:border-amber-500/20 dark:bg-[linear-gradient(180deg,rgba(69,26,3,0.85),rgba(52,21,4,0.72))] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-white/80 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">{staleData ? "Dados desatualizados" : "Falha ao carregar a carteira"}</p>
          <p className="mt-1 text-sm leading-6 text-amber-900/80 dark:text-amber-100/80">{message}</p>
        </div>
      </div>

      <Button variant="outline" className="h-11 rounded-2xl border-amber-300 bg-white/80 text-amber-950 hover:bg-white" onClick={onRetry} disabled={refreshing}>
        <RefreshCcw className="size-4" />
        {refreshing ? "Tentando novamente..." : "Tentar novamente"}
      </Button>
    </div>
  );
}
