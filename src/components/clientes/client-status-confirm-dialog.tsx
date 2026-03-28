import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ClientStatus } from "@/types/mock";

export interface PendingStatusChange {
  clientId: string;
  clientName: string;
  currentStatus: ClientStatus;
  nextStatus: ClientStatus;
  reason: string;
}

export function ClientStatusConfirmDialog({
  pendingChange,
  onCancel,
  onConfirm,
}: {
  pendingChange: PendingStatusChange | null;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  if (!pendingChange) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 animate-in fade-in duration-200">
      <div className="surface-card w-full max-w-md rounded-[32px] border-none p-8 shadow-2xl animate-scale-in">
        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertTriangle className="size-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Confirmar alteração crítica?</h3>
        <p className="mt-2 leading-relaxed text-slate-500 dark:text-slate-400">
          Você está mudando <span className="font-semibold text-slate-900 dark:text-slate-100">{pendingChange.clientName}</span> de {" "}
          <span className="font-semibold text-slate-900 dark:text-slate-100">{pendingChange.currentStatus}</span> para{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-100">{pendingChange.nextStatus}</span>.
        </p>
        <p className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100/90">
          {pendingChange.reason}
        </p>
        <div className="mt-8 flex gap-3">
          <Button variant="outline" className="h-12 flex-1 rounded-2xl" onClick={onCancel}>
            Cancelar
          </Button>
          <Button className="h-12 flex-1 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => void onConfirm()}>
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}
