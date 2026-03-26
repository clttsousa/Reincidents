"use client";

import { useState } from "react";
import { Bell, CheckCheck, X, AlertTriangle, Clock, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type NotifType = "alert" | "info" | "success" | "warning";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "alert",
    title: "3 clientes críticos sem ação",
    description: "Clientes com SLA vencido aguardam follow-up urgente.",
    time: "Agora",
    read: false,
  },
  {
    id: "2",
    type: "warning",
    title: "5 O.S. abertas há mais de 7 dias",
    description: "Ordens de serviço com prazo estendido precisam de revisão.",
    time: "2h atrás",
    read: false,
  },
  {
    id: "3",
    type: "info",
    title: "Novo cliente adicionado",
    description: "João Silva foi adicionado à carteira por Ana Costa.",
    time: "4h atrás",
    read: true,
  },
  {
    id: "4",
    type: "success",
    title: "12 clientes resolvidos hoje",
    description: "Ótimo ritmo de fechamento no período.",
    time: "6h atrás",
    read: true,
  },
];

const typeConfig: Record<NotifType, { icon: typeof Bell; color: string; bg: string }> = {
  alert: {
    icon: AlertTriangle,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/20",
  },
  warning: {
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  info: {
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
  success: {
    icon: FileText,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
};

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "relative inline-flex size-11 items-center justify-center rounded-2xl border transition-all duration-200",
          "hover:-translate-y-0.5 active:scale-95",
          open
            ? "border-indigo-300/70 bg-indigo-50 text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-900/30 dark:text-indigo-400"
            : "border-slate-200/90 bg-white/90 text-slate-500 shadow-[0_12px_28px_-22px_rgba(15,23,42,0.18)] dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-400",
        )}
        aria-label="Notificações"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label="Fechar notificações"
          />
          <div
            className={cn(
              "animate-scale-in absolute right-0 top-14 z-50 w-[340px] overflow-hidden rounded-[24px]",
              "surface-card dark:border-slate-700/50",
              "shadow-[0_32px_80px_-40px_rgba(0,0,0,0.25)] dark:shadow-[0_32px_80px_-40px_rgba(0,0,0,0.6)]",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-950 dark:text-slate-50">Notificações</p>
                {unreadCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <CheckCheck className="size-3.5" />
                    Marcar lidas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                  <Bell className="size-8 text-slate-300 dark:text-slate-600" />
                  <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Sem notificações
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {notifications.map((notif) => {
                    const config = typeConfig[notif.type];
                    const Icon = config.icon;

                    return (
                      <div
                        key={notif.id}
                        className={cn(
                          "group relative flex items-start gap-3 px-4 py-3.5 transition-colors",
                          notif.read
                            ? "opacity-60 hover:opacity-100"
                            : "bg-slate-50/60 dark:bg-slate-800/30",
                          "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-2xl",
                            config.bg,
                          )}
                        >
                          <Icon className={cn("size-4", config.color)} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] font-semibold leading-snug text-slate-950 dark:text-slate-50">
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="mt-1 size-2 shrink-0 rounded-full bg-indigo-500" />
                            )}
                          </div>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            {notif.description}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                            {notif.time}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => dismiss(notif.id)}
                          className="absolute right-2 top-2 hidden rounded-lg p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 group-hover:flex dark:hover:bg-slate-700 dark:hover:text-slate-200"
                          aria-label="Dispensar"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200/80 px-4 py-3 dark:border-slate-700/50">
              <button
                type="button"
                className="w-full rounded-xl py-2 text-center text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                Ver todas as notificações
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
