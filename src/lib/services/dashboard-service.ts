import { hasOpenOs, isCriticalClient } from "@/lib/client-helpers";
import type { ClientRecord, ClientStats } from "@/types/mock";

export type DashboardPeriod = 7 | 15 | 30;

export interface TrendMetric {
  current: number;
  previous: number;
  delta: number;
  direction: "up" | "down" | "neutral";
  percentage: number;
}

export interface DashboardInsights {
  updated: TrendMetric;
  solved: TrendMetric;
  overdue: number;
  dueSoon: number;
  unassigned: number;
  criticalNow: number;
  workloadOpen: number;
  throughputRate: number;
  statusBreakdown: Array<{ label: string; value: number; total: number }>;
  sla: Array<{ label: string; value: number; tone: "danger" | "warning" | "success" }>;
  bottlenecks: Array<{ label: string; value: number; helper: string }>;
  productivity: Array<{ name: string; touched: number; solved: number; critical: number }>;
  recurring: ClientRecord[];
  criticalClients: ClientRecord[];
  recentClients: ClientRecord[];
}

function inRange(value: string, start: number, end: number) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return !Number.isNaN(time) && time >= start && time < end;
}

function buildTrend(current: number, previous: number): TrendMetric {
  const delta = current - previous;
  const direction = delta === 0 ? "neutral" : delta > 0 ? "up" : "down";
  const base = previous === 0 ? 1 : previous;
  const percentage = Math.round((delta / base) * 100);

  return {
    current,
    previous,
    delta,
    direction,
    percentage,
  };
}

export function buildDashboardInsights(clients: ClientRecord[], stats: ClientStats, period: DashboardPeriod): DashboardInsights {
  const now = Date.now();
  const periodMs = period * 86400000;
  const periodStart = now - periodMs;
  const previousStart = periodStart - periodMs;
  const next48h = now + 2 * 86400000;

  const updatedCurrent = clients.filter((client) => inRange(client.updatedAt, periodStart, now)).length;
  const updatedPrevious = clients.filter((client) => inRange(client.updatedAt, previousStart, periodStart)).length;
  const solvedCurrent = clients.filter((client) => client.resolved && inRange(client.updatedAt, periodStart, now)).length;
  const solvedPrevious = clients.filter((client) => client.resolved && inRange(client.updatedAt, previousStart, periodStart)).length;

  const overdue = clients.filter((client) => client.nextActionAt && new Date(client.nextActionAt).getTime() < now && !client.resolved).length;
  const dueSoon = clients.filter((client) => {
    if (!client.nextActionAt || client.resolved) return false;
    const time = new Date(client.nextActionAt).getTime();
    return time >= now && time <= next48h;
  }).length;
  const unassigned = clients.filter((client) => !client.responsibleUserId).length;
  const criticalNow = clients.filter(isCriticalClient).length;
  const workloadOpen = clients.filter((client) => !client.resolved).length;
  const throughputRate = updatedCurrent === 0 ? 0 : Math.round((solvedCurrent / updatedCurrent) * 100);

  const statusBreakdown = [
    { label: "Aguardando contato", value: stats.waiting, total: stats.total },
    { label: "O.S. aberta", value: stats.os, total: stats.total },
    { label: "Resolvido", value: stats.solved, total: stats.total },
    { label: "Sem retorno", value: stats.noReturn, total: stats.total },
  ];

  const sla = [
    { label: "Vencidas", value: overdue, tone: "danger" as const },
    { label: "Próximas 48h", value: dueSoon, tone: "warning" as const },
    { label: "Em trilho", value: Math.max(workloadOpen - overdue - dueSoon, 0), tone: "success" as const },
  ];

  const bottlenecks = [
    { label: "Aguardando contato", value: stats.waiting, helper: "Retornos iniciais e follow-up pendente." },
    { label: "Sem retorno", value: stats.noReturn, helper: "Clientes que exigem nova abordagem." },
    { label: "O.S. aberta", value: stats.os, helper: "Casos já escalados para campo ou suporte." },
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const productivityMap = clients.reduce<Record<string, { name: string; touched: number; solved: number; critical: number }>>((acc, client) => {
    const key = client.responsibleUserId ?? `name:${client.assignee}`;
    if (!acc[key]) {
      acc[key] = {
        name: client.assignee || "Sem responsável",
        touched: 0,
        solved: 0,
        critical: 0,
      };
    }

    if (inRange(client.updatedAt, periodStart, now)) acc[key].touched += 1;
    if (client.resolved && inRange(client.updatedAt, periodStart, now)) acc[key].solved += 1;
    if (isCriticalClient(client)) acc[key].critical += 1;
    return acc;
  }, {});

  const productivity = Object.values(productivityMap)
    .sort((a, b) => b.touched - a.touched || b.solved - a.solved || a.critical - b.critical)
    .slice(0, 5);

  const recurring = [...clients].sort((a, b) => b.totalServices - a.totalServices || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
  const criticalClients = clients.filter(isCriticalClient).sort((a, b) => b.totalServices - a.totalServices || Number(hasOpenOs(b)) - Number(hasOpenOs(a))).slice(0, 5);
  const recentClients = [...clients].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  return {
    updated: buildTrend(updatedCurrent, updatedPrevious),
    solved: buildTrend(solvedCurrent, solvedPrevious),
    overdue,
    dueSoon,
    unassigned,
    criticalNow,
    workloadOpen,
    throughputRate,
    statusBreakdown,
    sla,
    bottlenecks,
    productivity,
    recurring,
    criticalClients,
    recentClients,
  };
}
