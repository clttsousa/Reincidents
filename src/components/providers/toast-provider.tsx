"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error" | "info";

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
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
  error: "border-rose-200 bg-[linear-gradient(180deg,rgba(255,241,242,0.98),rgba(255,228,230,0.94))] text-rose-900",
  info: "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] text-slate-900",
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

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((current) => [...current, { id, tone: toast.tone ?? "info", ...toast }]);
      window.setTimeout(() => removeToast(id), 4200);
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
                  <p className="text-sm font-semibold">{toast.title}</p>
                  {toast.description ? <p className="mt-1 text-sm opacity-80">{toast.description}</p> : null}
                </div>
                <button type="button" className="rounded-full p-1 opacity-65 transition hover:bg-black/5 hover:opacity-100" onClick={() => removeToast(toast.id)} aria-label="Fechar notificação">
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/55">
                <div className={cn("h-full w-full origin-left animate-[shrink_4.2s_linear_forwards] rounded-full", progressClasses[tone])} />
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
