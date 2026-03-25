"use client";

import { AlertTriangle, CheckCircle2, Clock3, FileText, PhoneCall } from "lucide-react";

import { useClients } from "@/components/providers/clients-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateLabel, formatPhone, isCriticalClient, statusStyles } from "@/lib/client-helpers";
import { cn } from "@/lib/utils";

const cards = [
  { key: "total" as const, label: "Total", icon: PhoneCall },
  { key: "waiting" as const, label: "Aguardando contato", icon: Clock3 },
  { key: "os" as const, label: "O.S. abertas", icon: FileText },
  { key: "solved" as const, label: "Resolvidos", icon: CheckCircle2 },
  { key: "noReturn" as const, label: "Sem retorno", icon: AlertTriangle },
];

export function DashboardOverview() {
  const { clients, stats, topRecurring, staleClients } = useClients();

  const criticalClients = clients.filter(isCriticalClient).slice(0, 4);
  const recentClients = [...clients]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={card.key} className={cn(index === 0 ? "col-span-2 xl:col-span-1" : "col-span-1")}>
              <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
                <div className="min-w-0">
                  <p className="text-xs leading-5 text-slate-500 sm:text-sm">{card.label}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{stats[card.key]}</p>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle>Clientes mais recorrentes</CardTitle>
            <CardDescription>Casos com maior volume de atendimentos.</CardDescription>
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
            <CardTitle>Alertas</CardTitle>
            <CardDescription>O que precisa de atenção primeiro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-medium text-amber-950">{staleClients.length} clientes sem atualização há 3 dias ou mais</p>
              <p className="mt-1 text-sm text-amber-900/80">Priorize esses casos na fila.</p>
            </div>

            <div className="space-y-3">
              {staleClients.slice(0, 4).map((client) => (
                <div key={client.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-950">{client.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{client.assignee} · {client.status}</p>
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
            <CardDescription>Clientes que pedem atenção extra.</CardDescription>
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
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
