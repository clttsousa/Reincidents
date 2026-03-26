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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateLabel, formatPhone, hasOpenOs, statusStyles } from "@/lib/client-helpers";
import { buildDashboardInsights, type DashboardPeriod } from "@/lib/services/dashboard-service";
import { cn } from "@/lib/utils";

const PERIOD_STORAGE_KEY = "recorrenciaos-dashboard-period-v46";

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
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "skeleton-shimmer h-[120px] rounded-[28px] border border-slate-200 bg-white/75",
              index === 0 ? "col-span-2 xl:col-span-1" : "col-span-1",
            )}
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="skeleton-shimmer h-[380px] rounded-[28px] border border-slate-200 bg-white/75" />
        <div className="skeleton-shimmer h-[380px] rounded-[28px] border border-slate-200 bg-white/75" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="skeleton-shimmer h-[320px] rounded-[28px] border border-slate-200 bg-white/75" />
        <div className="skeleton-shimmer h-[320px] rounded-[28px] border border-slate-200 bg-white/75" />
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
        direction === "up" && "bg-emerald-50 text-emerald-700",
        direction === "down" && "bg-rose-50 text-rose-700",
        direction === "neutral" && "bg-slate-100 text-slate-600",
      )}
    >
      <Icon className="size-3.5" />
      {delta === 0 ? "Estável" : `${delta > 0 ? "+" : ""}${delta} · ${percentage > 0 ? "+" : ""}${percentage}%`}
    </span>
  );
}

function StatusBar({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{value} · {percentage}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a,#334155)] transition-all duration-300" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function ProductivityBar({ label, value, total }: { label: string; value: number; total: number }) {
  const width = total ? Math.max(Math.round((value / total) * 100), value > 0 ? 8 : 0) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a,#334155)] transition-all duration-300" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function DashboardMetricCard({ card }: { card: DashboardCard }) {
  const Icon = card.icon;
  const animatedValue = useAnimatedNumber(card.value);

  return (
    <Link href={card.href} className="group block h-full">
      <Card className="h-full overflow-hidden rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-0 hover-glow">
        <CardContent className="relative flex h-full flex-col justify-between gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{animatedValue}</p>
            </div>
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-[18px] border text-slate-700 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.22)]",
                card.emphasis === "warning" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-700",
                card.emphasis === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
              )}
            >
              <Icon className="size-5" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {card.trend ? <TrendPill {...card.trend} /> : <Badge variant="secondary">Acompanhar</Badge>}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">{card.helper}</p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700 transition group-hover:text-slate-950">
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

export function DashboardOverview() {
  const { clients, stats, loading } = useClients();
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
      // Ignora valores inválidos no navegador.
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
    {
      key: "updated",
      label: "Atualizados",
      value: insights.updated.current,
      helper: `Movimentados nos últimos ${period} dias.`,
      href: "/clientes",
      icon: TrendingUp,
      trend: insights.updated,
    },
    {
      key: "unassigned",
      label: "Sem responsável",
      value: insights.unassigned,
      helper: `${insights.dueSoon} com ação nas próximas 48h.`,
      href: "/clientes?view=unassigned",
      icon: Users,
    },
  ];

  const maxTouched = insights.productivity.reduce((acc, item) => Math.max(acc, item.touched), 0);

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="surface-card section-shell animate-enter space-y-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-heading">Visão executiva</p>
            <h1 className="mt-3 page-title">Pulso da operação em uma leitura mais premium</h1>
            <p className="page-description">Veja ritmo de atualização, gargalos, saúde do SLA e clientes críticos com uma hierarquia visual melhor e menos ruído.</p>
          </div>
          <div className="flex flex-wrap gap-2 rounded-[24px] border border-slate-200/90 bg-white/90 p-1.5 shadow-[0_16px_30px_-26px_rgba(15,23,42,0.18)]">
            {periodOptions.map((option) => {
              const active = period === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className={cn(
                    "min-w-[94px] rounded-[18px] px-4 py-2.5 text-sm font-medium transition-all",
                    active ? "chip-active" : "chip-neutral hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {cards.map((card) => (
            <DashboardMetricCard key={card.key} card={card} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardHeader className="p-5 pb-4 sm:p-6 sm:pb-4">
            <CardTitle>Pulso da operação</CardTitle>
            <CardDescription>Resumo do período com foco em ritmo de atualização, taxa de fechamento e equilíbrio do volume aberto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5 pt-0 sm:p-6 sm:pt-0">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="surface-muted rounded-[24px] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Atualizados</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{insights.updated.current}</p>
                <p className="mt-1 text-sm text-slate-500">Movimentados nos últimos {period} dias.</p>
              </div>
              <div className="surface-muted rounded-[24px] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Fechamento</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{insights.throughputRate}%</p>
                <p className="mt-1 text-sm text-slate-500">Proporção entre atualizados e resolvidos.</p>
              </div>
              <div className="surface-muted rounded-[24px] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Carga aberta</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{insights.workloadOpen}</p>
                <p className="mt-1 text-sm text-slate-500">Casos ainda ativos na operação.</p>
              </div>
            </div>

            <div className="space-y-3 rounded-[26px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-950">Distribuição por status</p>
                  <p className="mt-1 text-sm text-slate-500">Composição atual da carteira para entender rapidamente onde está o volume.</p>
                </div>
                <Badge variant="outline">Base atual</Badge>
              </div>
              <div className="space-y-3">
                {insights.statusBreakdown.map((item) => (
                  <StatusBar key={item.label} label={item.label} value={item.value} total={item.total} />
                ))}
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
                    item.tone === "danger" && "border-rose-200 bg-rose-50 text-rose-900",
                    item.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-900",
                    item.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
                  )}
                >
                  <p className="text-xs uppercase tracking-[0.18em] opacity-75">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-[26px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950">Gargalos atuais</p>
                <Badge variant="outline">Top 3</Badge>
              </div>
              <div className="space-y-3">
                {insights.bottlenecks.map((item) => (
                  <div key={item.label} className="surface-muted rounded-[24px] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-950">{item.label}</p>
                      <span className="text-sm font-semibold text-slate-950">{item.value}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{item.helper}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-5 pb-4 sm:p-6 sm:pb-4">
            <CardTitle>Produtividade por responsável</CardTitle>
            <CardDescription>Ranking baseado em clientes tocados no período, resolvidos e carga crítica atual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
            {insights.productivity.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">Ainda não há movimentações suficientes no período para montar o ranking.</div>
            ) : (
              insights.productivity.map((item) => (
                <div key={item.name} className="surface-muted rounded-[26px] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-950">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.solved} resolvidos · {item.critical} críticos em carteira</p>
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
            <CardTitle>Recorrência e pressão operacional</CardTitle>
            <CardDescription>Clientes que mais voltam ou que continuam puxando o volume crítico da operação.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-3 rounded-[26px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950">Top recorrência</p>
                <Badge variant="outline">{insights.recurring.length}</Badge>
              </div>
              {insights.recurring.map((client) => (
                <Link key={client.id} href="/clientes?sort=services" className="surface-card hover-lift flex items-center justify-between gap-3 rounded-[22px] px-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-950">{client.name}</p>
                    <p className="mt-1 truncate text-slate-500">{formatPhone(client.phone)}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-slate-950">{client.totalServices}x</span>
                </Link>
              ))}
            </div>

            <div className="space-y-3 rounded-[26px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950">Clientes críticos agora</p>
                <Link href="/clientes?view=critical" className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-950">
                  Ver todos
                  <ArrowRight className="size-4" />
                </Link>
              </div>
              {insights.criticalClients.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">Nenhum cliente crítico identificado no momento.</div>
              ) : (
                insights.criticalClients.map((client) => (
                  <div key={client.id} className="surface-muted rounded-[24px] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-950">{client.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{client.assignee}</p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-900">{client.totalServices}x</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className={cn("border", statusStyles[client.status])}>{client.status}</Badge>
                      {hasOpenOs(client) ? <Badge variant="outline">O.S. ativa</Badge> : null}
                      {client.nextActionAt ? <Badge variant="outline">{formatDateLabel(client.nextActionAt)}</Badge> : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader className="p-5 pb-4 sm:p-6 sm:pb-4">
            <CardTitle>Clientes movimentados mais recentemente</CardTitle>
            <CardDescription>Útil para revisão rápida do que acabou de acontecer na carteira.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0 sm:p-6 sm:pt-0">
            {insights.recentClients.map((client) => (
              <div key={client.id} className="surface-muted rounded-[24px] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-950">{client.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{client.assignee}</p>
                  </div>
                  <Badge variant="outline">{formatDateLabel(client.updatedAt)}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-5 pb-4 sm:p-6 sm:pb-4">
            <CardTitle>Ações sugeridas</CardTitle>
            <CardDescription>Atalhos para limpar o que mais pesa agora sem navegar manualmente pelo sistema.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-5 pt-0 sm:p-6 sm:pt-0 md:grid-cols-2">
            <Link href="/clientes?view=critical" className="surface-muted hover-lift rounded-[24px] p-4">
              <p className="font-medium text-slate-950">Atacar críticos</p>
              <p className="mt-1 text-sm text-slate-500">Abrir a carteira já filtrada pelos casos com maior pressão.</p>
            </Link>
            <Link href="/clientes?view=unassigned" className="surface-muted hover-lift rounded-[24px] p-4">
              <p className="font-medium text-slate-950">Distribuir sem responsável</p>
              <p className="mt-1 text-sm text-slate-500">Tirar clientes órfãos da fila antes de vencerem.</p>
            </Link>
            <Link href="/fila" className="surface-muted hover-lift rounded-[24px] p-4">
              <p className="font-medium text-slate-950">Abrir fila operacional</p>
              <p className="mt-1 text-sm text-slate-500">Ver status por coluna e agir por estágio.</p>
            </Link>
            <Link href="/clientes?view=waiting" className="surface-muted hover-lift rounded-[24px] p-4">
              <p className="font-medium text-slate-950">Priorizar retornos</p>
              <p className="mt-1 text-sm text-slate-500">Entrar direto nos casos aguardando contato.</p>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
