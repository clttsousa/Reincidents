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
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{stats[card.key]}</p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Clientes mais recorrentes</CardTitle>
            <CardDescription>Casos com maior volume de atendimentos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topRecurring.map((client) => (
              <div key={client.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{client.name}</p>
                      <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                        {client.totalServices}x
                      </Badge>
                      <Badge className={cn(statusStyles[client.status], "border")}>{client.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{client.description}</p>
                  </div>
                  <div className="space-y-1 text-sm text-slate-500 md:text-right">
                    <p>{formatPhone(client.phone)}</p>
                    <p>{client.assignee}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
            <CardDescription>O que precisa de atenção primeiro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-medium text-amber-950">{staleClients.length} clientes sem atualização há 3 dias ou mais</p>
              <p className="mt-1 text-sm text-amber-900/80">Priorize esses casos na fila.</p>
            </div>

            <div className="space-y-3">
              {staleClients.slice(0, 4).map((client) => (
                <div key={client.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950">{client.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{client.assignee} · {client.status}</p>
                    </div>
                    <p className="text-xs font-medium text-rose-500">{formatDateLabel(client.updatedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimas movimentações</CardTitle>
            <CardDescription>Clientes atualizados recentemente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentClients.map((client) => (
              <div key={client.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-950">{client.name}</p>
                  <Badge className={cn(statusStyles[client.status], "border")}>{client.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">{client.description}</p>
                <p className="mt-1 text-xs text-slate-400">Atualizado {formatDateLabel(client.updatedAt)} · {client.assignee}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Casos críticos</CardTitle>
            <CardDescription>Clientes que pedem atenção extra.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalClients.map((client) => (
              <div key={client.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{client.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{client.description}</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-900">Crítico</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
