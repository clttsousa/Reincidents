"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error" | "info";

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastRecord extends ToastInput {
  id: string;
}

interface ToastContextValue {
  pushToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneClasses: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.98),rgba(220,252,231,0.94))] text-emerald-900",
  error: "border-rose-200 bg-[linear-gradient(180deg,rgba(255,241,242,0.98),rgba(255,228,230,0.94))] text-rose-900 dark:border-rose-500/30 dark:bg-[linear-gradient(180deg,rgba(76,5,25,0.95),rgba(55,4,18,0.92))] dark:text-rose-100",
  info: "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] text-slate-900 dark:border-slate-700/60 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(17,24,39,0.96))] dark:text-slate-100",
};

const toneIcons = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
};

const progressClasses: Record<ToastTone, string> = {
  success: "bg-emerald-500/80",
  error: "bg-rose-500/80",
  info: "bg-slate-900/75",
};

const pillClasses: Record<ToastTone, string> = {
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  error: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  info: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const pillLabels: Record<ToastTone, string> = {
  success: "Concluído",
  error: "Atenção",
  info: "Contexto",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const durationMs = toast.durationMs ?? 4200;
      setToasts((current) => [...current, { id, tone: toast.tone ?? "info", ...toast, durationMs }]);
      window.setTimeout(() => removeToast(id), durationMs);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-3 px-4 sm:items-end sm:px-6">
        {toasts.map((toast) => {
          const tone = toast.tone ?? "info";
          const Icon = toneIcons[tone];
          const duration = toast.durationMs ?? 4200;

          return (
            <div
              key={toast.id}
              className={cn(
                "animate-toast pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-[24px] border px-4 py-3 shadow-[0_30px_60px_-36px_rgba(15,23,42,0.38)] backdrop-blur",
                toneClasses[tone],
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-9 items-center justify-center rounded-2xl bg-white/85 text-current shadow-[0_12px_24px_-22px_rgba(15,23,42,0.3)]">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]", pillClasses[tone])}>
                      {pillLabels[tone]}
                    </span>
                    <p className="text-sm font-semibold">{toast.title}</p>
                  </div>
                  {toast.description ? <p className="mt-1 text-sm opacity-80">{toast.description}</p> : null}
                  {toast.actionLabel && toast.onAction ? (
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full border border-black/8 bg-white/70 px-3 text-xs font-semibold text-current hover:bg-white"
                        onClick={() => {
                          toast.onAction?.();
                          removeToast(toast.id);
                        }}
                      >
                        {toast.actionLabel}
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </div>
                <button type="button" className="rounded-full p-1 opacity-65 transition hover:bg-black/5 hover:opacity-100" onClick={() => removeToast(toast.id)} aria-label="Fechar notificação">
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/55">
                <div
                  className={cn("h-full w-full origin-left rounded-full", progressClasses[tone])}
                  style={{ animation: `shrink ${duration}ms linear forwards` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
