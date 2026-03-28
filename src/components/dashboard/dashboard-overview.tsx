"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Gauge,
  PhoneCall,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { useClients } from "@/components/providers/clients-provider";
import { ClientsListStateBanner } from "@/components/clientes/clients-list-state-banner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateLabel, formatPhone } from "@/lib/client-helpers";
import { buildDashboardInsights, type DashboardPeriod } from "@/lib/services/dashboard-service";
import { cn } from "@/lib/utils";

const PERIOD_STORAGE_KEY = "recorrenciaos-dashboard-period-v52";

const periodOptions: Array<{ label: string; value: DashboardPeriod }> = [
  { label: "7 dias", value: 7 },
  { label: "15 dias", value: 15 },
  { label: "30 dias", value: 30 },
];

type DashboardCard = {
  key: string;
  label: string;
  value: number;
  helper: string;
  href: string;
  icon: typeof PhoneCall;
  emphasis?: "default" | "warning" | "success";
  trend?: { delta: number; percentage: number; direction: "up" | "down" | "neutral" };
};

function useAnimatedNumber(value: number) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let frame = 0;
    const startValue = displayValue;
    const diff = value - startValue;
    if (diff === 0) return;
    const duration = 360;
    const startTime = performance.now();

    const loop = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + diff * eased));
      if (progress < 1) frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return displayValue;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="skeleton-shimmer h-[210px] rounded-[30px] border border-slate-200 bg-white/75" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "skeleton-shimmer h-[118px] rounded-[28px] border border-slate-200 bg-white/75",
              index === 0 ? "col-span-2 xl:col-span-1" : "col-span-1",
            )}
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.04fr_0.96fr]">
        <div className="skeleton-shimmer h-[380px] rounded-[28px] border border-slate-200 bg-white/75" />
        <div className="skeleton-shimmer h-[380px] rounded-[28px] border border-slate-200 bg-white/75" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="skeleton-shimmer h-[360px] rounded-[28px] border border-slate-200 bg-white/75" />
        <div className="skeleton-shimmer h-[360px] rounded-[28px] border border-slate-200 bg-white/75" />
      </div>
    </div>
  );
}

function TrendPill({ delta, percentage, direction }: { delta: number; percentage: number; direction: "up" | "down" | "neutral" }) {
  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Gauge;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        direction === "up" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        direction === "down" && "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
        direction === "neutral" && "bg-slate-100 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300",
      )}
    >
      <Icon className="size-3.5" />
      {delta === 0 ? "Estável" : `${delta > 0 ? "+" : ""}${delta} · ${percentage > 0 ? "+" : ""}${percentage}%`}
    </span>
  );
}

function MiniSparkBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-10 items-end gap-1.5">
      {values.map((value, index) => (
        <div
          key={`${index}-${value}`}
          className="w-2 rounded-full bg-[linear-gradient(180deg,rgba(129,140,248,0.92),rgba(15,23,42,0.98))] opacity-90"
          style={{ height: `${Math.max((value / max) * 100, value > 0 ? 18 : 10)}%` }}
        />
      ))}
    </div>
  );
}

function StatusBar({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {value} · {percentage}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a,#334155)] transition-all duration-300 dark:bg-[linear-gradient(90deg,#4f46e5,#818cf8)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ProductivityBar({ label, value, total }: { label: string; value: number; total: number }) {
  const width = total ? Math.max(Math.round((value / total) * 100), value > 0 ? 8 : 0) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-medium text-slate-900 dark:text-slate-100">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a,#334155)] transition-all duration-300 dark:bg-[linear-gradient(90deg,#4f46e5,#818cf8)]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function FocusMetric({ label, value, helper, tone }: { label: string; value: number; helper: string; tone: "default" | "warning" | "danger" | "success" }) {
  return (
    <div
      className={cn(
        "rounded-[24px] border px-4 py-4 shadow-[0_18px_38px_-32px_rgba(15,23,42,0.18)]",
        tone === "default" && "border-slate-200/90 bg-white/85 dark:border-slate-700/40 dark:bg-slate-800/55",
        tone === "warning" && "border-amber-200/80 bg-amber-50/85 dark:border-amber-500/25 dark:bg-amber-500/10",
        tone === "danger" && "border-rose-200/80 bg-rose-50/85 dark:border-rose-500/25 dark:bg-rose-500/10",
        tone === "success" && "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-500/25 dark:bg-emerald-500/10",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{helper}</p>
    </div>
  );
}

function DashboardMetricCard({ card }: { card: DashboardCard }) {
  const Icon = card.icon;
  const animatedValue = useAnimatedNumber(card.value);

  return (
    <Link href={card.href} className="group block h-full">
      <Card className="h-full overflow-hidden rounded-[28px] p-0 hover-glow">
        <CardContent className="relative flex h-full flex-col justify-between gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{animatedValue}</p>
            </div>
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-[18px] border text-slate-700 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.22)]",
                card.emphasis === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-300"
                  : "border-slate-200 bg-white text-slate-700 dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-300",
                card.emphasis === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-300",
              )}
            >
              <Icon className="size-5" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {card.trend ? <TrendPill {...card.trend} /> : <Badge variant="secondary">Acompanhar</Badge>}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{card.helper}</p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700 transition group-hover:text-slate-950 dark:text-slate-50">
              Abrir visão
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </div>
          </div>
          <div className="absolute inset-x-5 top-0 h-1 rounded-full bg-[linear-gradient(90deg,rgba(15,23,42,0.85),rgba(99,102,241,0.5),transparent)]" />
        </CardContent>
      </Card>
    </Link>
  );
}

function ActionPanel({ label, value, helper, href, tone }: { label: string; value: string; helper: string; href: string; tone: "danger" | "warning" | "neutral" }) {
  return (
    <Link
      href={href}
      className={cn(
        "group rounded-[24px] border p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-30px_rgba(15,23,42,0.16)]",
        tone === "danger" && "border-rose-200 bg-rose-50/90 dark:border-rose-500/30 dark:bg-rose-900/20",
        tone === "warning" && "border-amber-200 bg-amber-50/90 dark:border-amber-500/30 dark:bg-amber-900/20",
        tone === "neutral" && "border-slate-200 bg-white/90 dark:border-slate-700/50 dark:bg-slate-800/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{value}</p>
        </div>
        <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{helper}</p>
    </Link>
  );
}

export function DashboardOverview() {
  const { clients, stats, loading, errorMessage, staleData, listRefreshing, refreshClients } = useClients();
  const [period, setPeriod] = useState<DashboardPeriod>(7);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PERIOD_STORAGE_KEY);
      if (!saved) return;
      const parsed = Number(saved);
      if (parsed === 7 || parsed === 15 || parsed === 30) {
        setPeriod(parsed as DashboardPeriod);
      }
    } catch {
      // ignora storage inválido
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PERIOD_STORAGE_KEY, String(period));
  }, [period]);

  const insights = useMemo(() => buildDashboardInsights(clients, stats, period), [clients, period, stats]);

  if (loading) return <DashboardSkeleton />;

  const cards: DashboardCard[] = [
    { key: "total", label: "Carteira total", value: stats.total, helper: "Base completa acompanhada pela equipe.", href: "/clientes", icon: PhoneCall },
    {
      key: "waiting",
      label: "Aguardando contato",
      value: stats.waiting,
      helper: `${insights.overdue} com ação vencida agora.`,
      href: "/clientes?view=waiting",
      icon: Clock3,
      emphasis: "warning",
    },
    {
      key: "os",
      label: "O.S. abertas",
      value: stats.os,
      helper: `${insights.workloadOpen} casos ainda pendentes na carteira.`,
      href: "/clientes?view=os",
      icon: FileText,
    },
    {
      key: "solved",
      label: "Resolvidos",
      value: stats.solved,
      helper: `${insights.solved.current} fechados no período selecionado.`,
      href: "/clientes?view=resolved",
      icon: CheckCircle2,
      emphasis: "success",
      trend: insights.solved,
    },
    {
      key: "noReturn",
      label: "Sem retorno",
      value: stats.noReturn,
      helper: "Casos que pedem nova abordagem de contato.",
      href: "/clientes?view=no-return",
      icon: AlertTriangle,
      emphasis: "warning",
    },
    {
      key: "critical",
      label: "Críticos",
      value: stats.critical,
      helper: `${insights.criticalNow} pressionando a operação agora.`,
      href: "/clientes?view=critical",
      icon: Sparkles,
      emphasis: "warning",
    },
  ];

  const maxTouched = insights.productivity.reduce((acc, item) => Math.max(acc, item.touched), 0);
  const attentionShare = [insights.overdue, insights.dueSoon, insights.criticalNow, stats.noReturn];
  const suggestedActions = [
    {
      label: "Revisar vencidos",
      value: `${insights.overdue}`,
      helper: insights.overdue === 0 ? "Nenhuma ação vencida no momento." : "Casos que já passaram do prazo precisam de tratativa imediata.",
      href: "/clientes?view=stale",
      tone: insights.overdue > 0 ? ("danger" as const) : ("neutral" as const),
    },
    {
      label: "Próximas 48h",
      value: `${insights.dueSoon}`,
      helper: "Antecipe follow-ups e redistribua quem está prestes a vencer.",
      href: "/clientes",
      tone: insights.dueSoon > 0 ? ("warning" as const) : ("neutral" as const),
    },
    {
      label: "Sem dono",
      value: `${insights.unassigned}`,
      helper: "Carteira sem responsável tende a criar ruído operacional e atraso de retorno.",
      href: "/clientes?view=unassigned",
      tone: insights.unassigned > 0 ? ("warning" as const) : ("neutral" as const),
    },
  ];

  const focusMetrics = [
    {
      label: "Vencidas",
      value: insights.overdue,
      helper: insights.overdue > 0 ? "Atacar primeiro" : "Sem risco imediato",
      tone: insights.overdue > 0 ? ("danger" as const) : ("success" as const),
    },
    {
      label: "Próximas 48h",
      value: insights.dueSoon,
      helper: "Casos prestes a vencer",
      tone: insights.dueSoon > 0 ? ("warning" as const) : ("default" as const),
    },
    {
      label: "Sem retorno",
      value: stats.noReturn,
      helper: "Nova estratégia de contato",
      tone: stats.noReturn > 0 ? ("warning" as const) : ("default" as const),
    },
    {
      label: "Sem dono",
      value: insights.unassigned,
      helper: "Precisa redistribuição",
      tone: insights.unassigned > 0 ? ("warning" as const) : ("default" as const),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="surface-card animate-enter overflow-hidden rounded-[30px] p-4 sm:p-6 lg:p-7">
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="section-heading">Leitura do período</p>
              <h1 className="mt-3 text-[1.55rem] font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50 sm:text-[1.8rem]">Pulso da operação e prioridades do dia</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Menos ruído visual, mais clareza sobre vencidos, gargalos, clientes quentes e ritmo de fechamento.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:min-w-[320px] sm:flex-row sm:items-center xl:flex-col xl:items-stretch">
              <div className="surface-subtle flex flex-wrap gap-2 rounded-[24px] p-1.5">
                {periodOptions.map((option) => {
                  const active = period === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPeriod(option.value)}
                      className={cn(
                        "min-w-[92px] rounded-[18px] px-4 py-2.5 text-sm font-medium transition-all",
                        active ? "chip-active" : "chip-neutral hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="surface-subtle flex items-center gap-3 rounded-[24px] px-4 py-3">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse-soft" />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Operação</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Carteira ativa e monitorada</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {focusMetrics.map((item) => (
              <FocusMetric key={item.label} {...item} />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr] xl:items-stretch">
            <div className="space-y-4">
              <div className="surface-dark rounded-[30px] p-5 text-white sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <Badge className="border-white/10 bg-white/10 text-white">Prioridade do dia</Badge>
                    <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                      {insights.overdue > 0
                        ? `${insights.overdue} vencidos e ${insights.dueSoon} próximos do prazo`
                        : "Operação sem vencidos críticos agora"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {insights.overdue > 0
                        ? "Atue primeiro no que venceu, no que está prestes a vencer e nos casos sem resposta consistente."
                        : "A carteira está respirando melhor. Aproveite para fechar pendências abertas e antecipar follow-ups."}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/8 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Radar do período</p>
                    <div className="mt-3 flex items-end gap-4">
                      <MiniSparkBars values={attentionShare} />
                      <div>
                        <p className="text-3xl font-semibold text-white">{insights.throughputRate}%</p>
                        <p className="mt-1 text-xs text-slate-300">ritmo de fechamento</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {suggestedActions.map((action) => (
                    <ActionPanel key={action.label} {...action} />
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="surface-inset rounded-[24px] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Atualizados</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{insights.updated.current}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Clientes movimentados no período.</p>
                </div>
                <div className="surface-inset rounded-[24px] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Fechamento</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{insights.throughputRate}%</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Relação entre resolvidos e atualizados.</p>
                </div>
                <div className="surface-inset rounded-[24px] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Carga aberta</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{insights.workloadOpen}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Casos ainda ativos na operação.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="surface-card rounded-[28px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Pulso da carteira</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">Prioridade do dia</p>
                  </div>
                  <Badge variant="outline">Agora</Badge>
                </div>
                <div className="mt-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-600 dark:text-slate-300">Vencidas</span>
                      <span className="font-medium text-slate-950 dark:text-slate-50">{insights.overdue}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,#ef4444,#fb7185)]" style={{ width: `${Math.min((insights.overdue / Math.max(stats.total, 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-600 dark:text-slate-300">Sem retorno</span>
                      <span className="font-medium text-slate-950 dark:text-slate-50">{stats.noReturn}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,#fbbf24)]" style={{ width: `${Math.min((stats.noReturn / Math.max(stats.total, 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-600 dark:text-slate-300">Críticos</span>
                      <span className="font-medium text-slate-950 dark:text-slate-50">{insights.criticalNow}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a,#334155)] dark:bg-[linear-gradient(90deg,#4f46e5,#6366f1)]" style={{ width: `${Math.min((insights.criticalNow / Math.max(stats.total, 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="surface-card rounded-[28px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Clientes quentes</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">Mais pressão operacional</p>
                  </div>
                  <Badge variant="outline">Top 3</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {insights.criticalClients.slice(0, 3).map((client) => (
                    <Link key={client.id} href="/clientes?view=critical" className="group flex items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50/85 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-slate-700/50 dark:bg-slate-800/60">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-950 dark:text-slate-50">{client.name}</p>
                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{formatPhone(client.phone)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{client.totalServices}x</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{client.nextActionAt ? formatDateLabel(client.nextActionAt) : "Sem agenda"}</p>
                      </div>
                    </Link>
                  ))}
                  {insights.criticalClients.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-400">Sem clientes críticos no momento.</div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {cards.map((card) => (
              <DashboardMetricCard key={card.key} card={card} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader className="p-5 pb-4 sm:p-6 sm:pb-4">
            <CardTitle>Pulso da operação</CardTitle>
            <CardDescription>Resumo do período com foco em ritmo de atualização, taxa de fechamento e equilíbrio do volume aberto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-3 rounded-[26px] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700/50 dark:bg-slate-800/40">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-950 dark:text-slate-50">Distribuição por status</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Composição atual da carteira para entender rapidamente onde está o volume.</p>
                </div>
                <Badge variant="outline">Base atual</Badge>
              </div>
              <div className="space-y-3">
                {insights.statusBreakdown.map((item) => (
                  <StatusBar key={item.label} label={item.label} value={item.value} total={item.total} />
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="surface-inset rounded-[24px] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Atualizados</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{insights.updated.current}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Movimentados nos últimos {period} dias.</p>
              </div>
              <div className="surface-inset rounded-[24px] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Fechamento</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{insights.throughputRate}%</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Proporção entre atualizados e resolvidos.</p>
              </div>
              <div className="surface-inset rounded-[24px] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Carga aberta</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{insights.workloadOpen}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Casos ainda ativos na operação.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-5 pb-4 sm:p-6 sm:pb-4">
            <CardTitle>SLA e gargalos</CardTitle>
            <CardDescription>O que merece atenção agora e onde a operação tende a travar primeiro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {insights.sla.map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-[24px] border p-4 shadow-[0_18px_38px_-32px_rgba(15,23,42,0.18)]",
                    item.tone === "danger" && "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-900/20 dark:text-rose-300",
                    item.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-300",
                    item.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-300",
                  )}
                >
                  <p className="text-xs uppercase tracking-[0.18em] opacity-75">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-[26px] border border-slate-200 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950 dark:text-slate-50">Gargalos atuais</p>
                <Badge variant="outline">Top 3</Badge>
              </div>
              <div className="space-y-3">
                {insights.bottlenecks.map((item) => (
                  <div key={item.label} className="surface-inset rounded-[24px] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-950 dark:text-slate-50">{item.label}</p>
                      <span className="text-sm font-semibold text-slate-950 dark:text-slate-50">{item.value}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.helper}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <Card>
          <CardHeader className="p-5 pb-4 sm:p-6 sm:pb-4">
            <CardTitle>Produtividade por responsável</CardTitle>
            <CardDescription>Ranking baseado em clientes tocados no período, resolvidos e carga crítica atual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
            {insights.productivity.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-400">Ainda não há movimentações suficientes no período para montar o ranking.</div>
            ) : (
              insights.productivity.map((item, index) => (
                <div key={item.name} className="surface-subtle rounded-[26px] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <p className="truncate font-medium text-slate-950 dark:text-slate-50">{item.name}</p>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.solved} resolvidos · {item.critical} críticos em carteira</p>
                    </div>
                    <Badge variant="outline">{item.touched} tocados</Badge>
                  </div>
                  <div className="mt-4">
                    <ProductivityBar label="Clientes movimentados" value={item.touched} total={maxTouched} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-5 pb-4 sm:p-6 sm:pb-4">
            <CardTitle>Radar de recorrência e histórico recente</CardTitle>
            <CardDescription>Clientes que mais retornam e os últimos movimentos relevantes da carteira.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 pt-0 sm:p-6 sm:pt-0 lg:grid-cols-2">
            <div className="space-y-3 rounded-[26px] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700/50 dark:bg-slate-800/40">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950 dark:text-slate-50">Top recorrência</p>
                <Badge variant="outline">{insights.recurring.length}</Badge>
              </div>
              {insights.recurring.map((client) => (
                <Link key={client.id} href="/clientes?sort=services" className="surface-subtle hover-lift flex items-center justify-between gap-3 rounded-[22px] px-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-950 dark:text-slate-50">{client.name}</p>
                    <p className="mt-1 truncate text-slate-500 dark:text-slate-400">{formatPhone(client.phone)}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-slate-950 dark:text-slate-50">{client.totalServices}x</span>
                </Link>
              ))}
            </div>

            <div className="space-y-3 rounded-[26px] border border-slate-200 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950 dark:text-slate-50">Atualizações recentes</p>
                <Badge variant="outline">{insights.recentClients.length}</Badge>
              </div>
              {insights.recentClients.map((client) => (
                <Link key={client.id} href="/clientes" className="group rounded-[22px] border border-slate-200 bg-slate-50/85 px-4 py-3 transition-all hover:-translate-y-0.5 hover:bg-white dark:border-slate-700/50 dark:bg-slate-800/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-950 dark:text-slate-50">{client.name}</p>
                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{client.assignee}</p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{client.nextActionAt ? `Próxima ação ${formatDateLabel(client.nextActionAt)}` : `Atualizado ${formatDateLabel(client.updatedAt)}`}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
