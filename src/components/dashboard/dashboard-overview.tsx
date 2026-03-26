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

const PERIOD_STORAGE_KEY = "recorrenciaos-dashboard-period-v43";

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

function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-[104px] animate-pulse rounded-[24px] border border-slate-200 bg-white/70",
              index === 0 ? "col-span-2 xl:col-span-1" : "col-span-1",
            )}
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="h-[360px] animate-pulse rounded-[24px] border border-slate-200 bg-white/70" />
        <div className="h-[360px] animate-pulse rounded-[24px] border border-slate-200 bg-white/70" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-[300px] animate-pulse rounded-[24px] border border-slate-200 bg-white/70" />
        <div className="h-[300px] animate-pulse rounded-[24px] border border-slate-200 bg-white/70" />
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
        <span className="font-medium text-slate-900">
          {value} · {percentage}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${percentage}%` }} />
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
        <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${width}%` }} />
      </div>
    </div>
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
    { key: "total", label: "Total", value: stats.total, helper: "Carteira completa", href: "/clientes", icon: PhoneCall },
    {
      key: "waiting",
      label: "Aguardando contato",
      value: stats.waiting,
      helper: `${insights.overdue} com ação vencida`,
      href: "/clientes?view=waiting",
      icon: Clock3,
      emphasis: "warning",
    },
    {
      key: "os",
      label: "O.S. abertas",
      value: stats.os,
      helper: `${insights.workloadOpen} casos ainda pendentes`,
      href: "/clientes?view=os",
      icon: FileText,
    },
    {
      key: "solved",
      label: "Resolvidos",
      value: stats.solved,
      helper: `${insights.solved.current} no período`,
      href: "/clientes?view=resolved",
      icon: CheckCircle2,
      emphasis: "success",
      trend: insights.solved,
    },
    {
      key: "noReturn",
      label: "Sem retorno",
      value: stats.noReturn,
      helper: "Dependem de nova estratégia",
      href: "/clientes?view=no-return",
      icon: AlertTriangle,
      emphasis: "warning",
    },
    {
      key: "critical",
      label: "Críticos",
      value: stats.critical,
      helper: `${insights.criticalNow} pressionando a operação`,
      href: "/clientes?view=critical",
      icon: Sparkles,
      emphasis: "warning",
    },
    {
      key: "updated",
      label: "Atualizados",
      value: insights.updated.current,
      helper: `últimos ${period} dias`,
      href: "/clientes",
      icon: TrendingUp,
      trend: insights.updated,
    },
    {
      key: "unassigned",
      label: "Sem responsável",
      value: insights.unassigned,
      helper: `${insights.dueSoon} com ação nas próximas 48h`,
      href: "/clientes?view=unassigned",
      icon: Users,
    },
  ];

  const maxTouched = insights.productivity.reduce((acc, item) => Math.max(acc, item.touched), 0);

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="surface-card section-shell space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="secondary" className="w-fit bg-slate-100 text-slate-700">
              Gestão operacional
            </Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Dashboard gerencial</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Compare períodos, acompanhe gargalos da carteira e veja quem mais está absorvendo volume crítico sem sair da operação.
            </p>
          </div>
          <div className="inline-flex flex-wrap rounded-2xl border border-slate-200 bg-white p-1">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition",
                  option.value === period ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link key={card.key} href={card.href}>
              <Card
                className={cn(
                  "hover-lift h-full",
                  index === 0 ? "col-span-2 xl:col-span-1" : "col-span-1",
                  card.emphasis === "warning" && "border-amber-200/80",
                  card.emphasis === "success" && "border-emerald-200/80",
                )}
              >
                <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
                  <div className="min-w-0">
                    <p className="text-xs leading-5 text-slate-500 sm:text-sm">{card.label}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{card.value}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-slate-400">{card.helper}</p>
                      {card.trend ? <TrendPill {...card.trend} /> : null}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-2xl border text-slate-700",
                      card.emphasis === "warning" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-100",
                      card.emphasis === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle>Pulso da operação</CardTitle>
            <CardDescription>
              Resumo do período selecionado com foco em ritmo de atualização, taxa de fechamento e saúde do SLA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Atualizados</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{insights.updated.current}</p>
                <p className="mt-1 text-sm text-slate-500">Movimentados nos últimos {period} dias.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Fechamento</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{insights.throughputRate}%</p>
                <p className="mt-1 text-sm text-slate-500">Proporção entre atualizados e resolvidos.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Carga aberta</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{insights.workloadOpen}</p>
                <p className="mt-1 text-sm text-slate-500">Clientes ainda pendentes na carteira.</p>
              </div>
            </div>

            <div className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-slate-500" />
                <p className="font-medium text-slate-950">Distribuição por status</p>
              </div>
              <div className="space-y-3">
                {insights.statusBreakdown.map((item) => (
                  <StatusBar key={item.label} {...item} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle>SLA e gargalos</CardTitle>
            <CardDescription>O que merece prioridade agora e onde a operação tende a travar primeiro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {insights.sla.map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-2xl border p-4",
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

            <div className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950">Gargalos atuais</p>
                <Badge variant="outline">Top 3</Badge>
              </div>
              <div className="space-y-3">
                {insights.bottlenecks.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
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
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle>Produtividade por responsável</CardTitle>
            <CardDescription>Ranking baseado em clientes tocados no período, resolvidos e carga crítica atual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            {insights.productivity.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Ainda não há movimentações suficientes no período para montar o ranking.
              </div>
            ) : (
              insights.productivity.map((item) => (
                <div key={item.name} className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-950">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.solved} resolvidos · {item.critical} críticos em carteira
                      </p>
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
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle>Recorrência e pressão operacional</CardTitle>
            <CardDescription>Clientes que mais voltam ou que continuam puxando o volume crítico da operação.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950">Top recorrência</p>
                <Badge variant="outline">{insights.recurring.length}</Badge>
              </div>
              {insights.recurring.map((client) => (
                <Link key={client.id} href="/clientes?sort=services" className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-950">{client.name}</p>
                    <p className="mt-1 truncate text-slate-500">{formatPhone(client.phone)}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-slate-950">{client.totalServices}x</span>
                </Link>
              ))}
            </div>

            <div className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950">Clientes críticos agora</p>
                <Link href="/clientes?view=critical" className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-950">
                  Ver todos
                  <ArrowRight className="size-4" />
                </Link>
              </div>
              {insights.criticalClients.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Nenhum cliente crítico identificado no momento.
                </div>
              ) : (
                insights.criticalClients.map((client) => (
                  <div key={client.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
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
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle>Clientes movimentados mais recentemente</CardTitle>
            <CardDescription>Útil para revisão rápida do que acabou de acontecer na carteira.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
            {insights.recentClients.map((client) => (
              <div key={client.id} className="rounded-2xl border border-slate-200 bg-white p-4">
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
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle>Ações sugeridas</CardTitle>
            <CardDescription>Atalhos para limpar o que mais pesa agora sem navegar manualmente pelo sistema.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 pt-0 sm:p-6 sm:pt-0 md:grid-cols-2">
            <Link href="/clientes?view=critical" className="hover-lift rounded-[24px] border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">Atacar críticos</p>
              <p className="mt-1 text-sm text-slate-500">Abrir a carteira já filtrada pelos casos com maior pressão.</p>
            </Link>
            <Link href="/clientes?view=unassigned" className="hover-lift rounded-[24px] border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">Distribuir sem responsável</p>
              <p className="mt-1 text-sm text-slate-500">Tirar clientes órfãos da fila antes de vencerem.</p>
            </Link>
            <Link href="/fila" className="hover-lift rounded-[24px] border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">Abrir fila operacional</p>
              <p className="mt-1 text-sm text-slate-500">Ver status por coluna e agir por estágio.</p>
            </Link>
            <Link href="/clientes?view=waiting" className="hover-lift rounded-[24px] border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-950">Priorizar retornos</p>
              <p className="mt-1 text-sm text-slate-500">Entrar direto nos casos aguardando contato.</p>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
