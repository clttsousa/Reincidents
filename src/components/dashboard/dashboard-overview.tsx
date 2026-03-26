"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileText,
  PhoneCall,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { useClients } from "@/components/providers/clients-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateLabel, formatPhone, isCriticalClient, statusStyles } from "@/lib/client-helpers";
import { cn } from "@/lib/utils";

type DashboardCard = {
  key: string;
  label: string;
  value: number;
  helper: string;
  href: string;
  icon: typeof PhoneCall;
  emphasis?: "default" | "warning" | "success";
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

function daysBetweenNow(value: string) {
  return Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
}

export function DashboardOverview() {
  const { clients, stats, topRecurring, staleClients, loading } = useClients();

  if (loading) return <DashboardSkeleton />;

  const criticalClients = clients.filter(isCriticalClient).slice(0, 4);
  const recentClients = [...clients]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 86400000;
  const updatesToday = clients.filter((client) => daysBetweenNow(client.updatedAt) === 0).length;
  const solvedIn7Days = clients.filter((client) => client.resolved && new Date(client.updatedAt).getTime() >= sevenDaysAgo).length;
  const overdueActions = clients.filter((client) => client.nextActionAt && new Date(client.nextActionAt).getTime() < now).length;
  const unassignedClients = clients.filter((client) => !client.responsibleUserId).length;

  const cards: DashboardCard[] = [
    { key: "total", label: "Total", value: stats.total, helper: "Carteira completa", href: "/clientes", icon: PhoneCall },
    {
      key: "waiting",
      label: "Aguardando contato",
      value: stats.waiting,
      helper: "Prioridade de retorno",
      href: "/clientes?view=waiting",
      icon: Clock3,
      emphasis: "warning",
    },
    {
      key: "os",
      label: "O.S. abertas",
      value: stats.os,
      helper: "Casos em andamento",
      href: "/clientes?view=os",
      icon: FileText,
    },
    {
      key: "solved",
      label: "Resolvidos",
      value: stats.solved,
      helper: `${solvedIn7Days} nos últimos 7 dias`,
      href: "/clientes?view=resolved",
      icon: CheckCircle2,
      emphasis: "success",
    },
    {
      key: "noReturn",
      label: "Sem retorno",
      value: stats.noReturn,
      helper: "Dependem de nova tentativa",
      href: "/clientes?view=no-return",
      icon: AlertTriangle,
      emphasis: "warning",
    },
    {
      key: "critical",
      label: "Críticos",
      value: stats.critical,
      helper: "Recorrência alta ou agenda vencida",
      href: "/clientes?view=critical",
      icon: Sparkles,
      emphasis: "warning",
    },
    {
      key: "stale",
      label: "Sem atualização",
      value: stats.stale,
      helper: "3 dias ou mais sem movimento",
      href: "/clientes?view=stale",
      icon: CircleDashed,
    },
    {
      key: "unassigned",
      label: "Sem responsável",
      value: unassignedClients,
      helper: `${overdueActions} com próxima ação vencida`,
      href: "/clientes?view=unassigned",
      icon: Users,
    },
  ];

  const statusBreakdown = [
    { label: "Aguardando contato", value: stats.waiting, total: stats.total },
    { label: "O.S. aberta", value: stats.os, total: stats.total },
    { label: "Resolvido", value: stats.solved, total: stats.total },
    { label: "Sem retorno", value: stats.noReturn, total: stats.total },
  ];

  const workloadByAssignee = clients.reduce<Record<string, { name: string; total: number; critical: number }>>((acc, client) => {
    const key = client.responsibleUserId ?? "unassigned";
    const name = client.assignee || "Sem responsável";
    if (!acc[key]) {
      acc[key] = { name, total: 0, critical: 0 };
    }
    acc[key].total += 1;
    if (isCriticalClient(client)) acc[key].critical += 1;
    return acc;
  }, {});

  const workload = Object.values(workloadByAssignee)
    .sort((a, b) => b.total - a.total || b.critical - a.critical)
    .slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-5">
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
                    <p className="mt-1 text-xs text-slate-400">{card.helper}</p>
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
              Visão rápida do que mudou recentemente e de onde a carteira está concentrada neste momento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Atualizações hoje</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{updatesToday}</p>
                <p className="mt-1 text-sm text-slate-500">Clientes com qualquer movimentação no dia.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Resolvidos em 7 dias</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{solvedIn7Days}</p>
                <p className="mt-1 text-sm text-slate-500">Usado para acompanhar ritmo de fechamento.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Próximas ações vencidas</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{overdueActions}</p>
                <p className="mt-1 text-sm text-slate-500">Casos que já passaram do prazo previsto.</p>
              </div>
            </div>

            <div className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-slate-500" />
                <p className="font-medium text-slate-950">Distribuição por status</p>
              </div>
              <div className="space-y-3">
                {statusBreakdown.map((item) => {
                  const percentage = item.total ? Math.round((item.value / item.total) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-medium text-slate-900">{item.value} · {percentage}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle>Carga por responsável</CardTitle>
            <CardDescription>Quem está com mais casos atribuídos agora e quantos deles estão críticos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
            {workload.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center">
                <p className="font-medium text-slate-900">Ainda não há responsáveis distribuídos.</p>
                <p className="mt-1 text-sm text-slate-500">Ao atribuir clientes a usuários reais, o ranking aparece aqui.</p>
              </div>
            ) : (
              workload.map((entry, index) => (
                <div key={`${entry.name}-${index}`} className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950">{entry.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{entry.total} caso(s) atribuídos</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-950">{entry.total}</p>
                      <p className="text-xs text-slate-400">{entry.critical} crítico(s)</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-slate-900" style={{ width: `${Math.min(100, Math.max(12, entry.total * 12))}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle>Clientes mais recorrentes</CardTitle>
            <CardDescription>Casos com maior volume de atendimentos e maior potencial de desgaste para a operação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
            {topRecurring.map((client) => (
              <div key={client.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-950">{client.name}</p>
                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                      {client.totalServices}x
                    </Badge>
                    <Badge className={cn(statusStyles[client.status], "border text-[12px]")}>{client.status}</Badge>
                  </div>
                  {client.description ? <p className="text-sm leading-6 text-slate-500">{client.description}</p> : null}
                  <div className="grid gap-2 rounded-2xl bg-white p-3 text-sm text-slate-500 sm:grid-cols-2">
                    <p className="truncate">{formatPhone(client.phone)}</p>
                    <p className="truncate sm:text-right">{client.assignee}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle>Alertas operacionais</CardTitle>
            <CardDescription>O que precisa de atenção primeiro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-medium text-amber-950">{staleClients.length} clientes sem atualização há 3 dias ou mais</p>
              <p className="mt-1 text-sm text-amber-900/80">Priorize esses casos na fila operacional ou ajuste a próxima ação.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-slate-500" />
                <p className="font-medium text-slate-900">{criticalClients.length} casos críticos no momento</p>
              </div>
              <p className="mt-1 text-sm text-slate-500">Críticos combinam recorrência alta, pendência aberta ou próxima ação vencida.</p>
            </div>
            <div className="space-y-3">
              {staleClients.slice(0, 4).map((client) => (
                <div key={client.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-950">{client.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {client.assignee} · {client.status}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs font-medium text-rose-500">{formatDateLabel(client.updatedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle>Últimas movimentações</CardTitle>
            <CardDescription>Clientes atualizados recentemente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
            {recentClients.map((client) => (
              <div key={client.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-950">{client.name}</p>
                  <Badge className={cn(statusStyles[client.status], "border text-[12px]")}>{client.status}</Badge>
                </div>
                {client.description ? <p className="mt-1 text-sm leading-6 text-slate-500">{client.description}</p> : null}
                <p className="mt-1 text-xs text-slate-400">Atualizado {formatDateLabel(client.updatedAt)} · {client.assignee}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle>Casos críticos</CardTitle>
            <CardDescription>Clientes que pedem atenção extra da equipe.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
            {criticalClients.map((client) => (
              <div key={client.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950">{client.name}</p>
                    {client.description ? <p className="mt-1 text-sm leading-6 text-slate-500">{client.description}</p> : null}
                  </div>
                  <Badge className="shrink-0 bg-amber-100 text-amber-900">Crítico</Badge>
                </div>
                {client.nextActionAt ? <p className="mt-2 text-xs text-slate-400">Próxima ação {formatDateLabel(client.nextActionAt)}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
