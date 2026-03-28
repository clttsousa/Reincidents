"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Clock3, MessageCircle, PhoneCall, Search, ShieldAlert, Sparkles } from "lucide-react";

import { ClientsProvider, useClients } from "@/components/providers/clients-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildWhatsappLink, formatDateLabel, formatPhone, hasOpenOs, isCriticalClient, statusOptions } from "@/lib/client-helpers";
import { cn } from "@/lib/utils";

const descriptions: Record<(typeof statusOptions)[number], string> = {
  "Aguardando contato": "Clientes que precisam de retorno inicial ou follow-up próximo.",
  "O.S. aberta": "Casos em andamento com ordem de serviço ativa na operação.",
  Resolvido: "Ocorrências concluídas, úteis para revisão rápida e fechamento.",
  "Sem retorno": "Casos sem resposta do cliente e que exigem nova estratégia de contato.",
};

type SortOption = "priority" | "recent" | "services";

function FilaPageContent() {
  const { clients } = useClients();
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("Todos");
  const [sortBy, setSortBy] = useState<SortOption>("priority");

  const assignees = useMemo(() => {
    return Array.from(new Set(clients.map((client) => client.assignee).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [clients]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...clients]
      .filter((client) => {
        const matchesSearch = !term || client.name.toLowerCase().includes(term) || client.assignee.toLowerCase().includes(term) || client.description.toLowerCase().includes(term);
        const matchesAssignee = assigneeFilter === "Todos" ? true : client.assignee === assigneeFilter;
        return matchesSearch && matchesAssignee;
      })
      .sort((a, b) => {
        if (sortBy === "services") return b.totalServices - a.totalServices;
        if (sortBy === "recent") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        const aScore = Number(isCriticalClient(a)) * 100 + Number(hasOpenOs(a)) * 10 + a.totalServices;
        const bScore = Number(isCriticalClient(b)) * 100 + Number(hasOpenOs(b)) * 10 + b.totalServices;
        return bScore - aScore || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [assigneeFilter, clients, search, sortBy]);

  const columns = useMemo(
    () =>
      statusOptions.map((status) => ({
        title: status,
        items: filteredClients.filter((client) => client.status === status),
        description: descriptions[status],
      })),
    [filteredClients],
  );

  const queueStats = useMemo(() => {
    const critical = filteredClients.filter((client) => isCriticalClient(client)).length;
    const openOs = filteredClients.filter((client) => hasOpenOs(client)).length;
    const overdue = filteredClients.filter((client) => !client.resolved && client.nextActionAt && new Date(client.nextActionAt).getTime() < Date.now()).length;
    return { critical, openOs, overdue };
  }, [filteredClients]);

  return (
    <div className="space-y-6 animate-enter">
      <section className="surface-card section-shell overflow-hidden">
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr] xl:items-stretch">
          <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.95),rgba(37,99,235,0.88))] p-5 text-white shadow-[0_28px_68px_-48px_rgba(15,23,42,0.75)]">
            <Badge className="border-white/10 bg-white/10 text-white">Kanban operacional</Badge>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-[2rem]">Fila premium com mais leitura de prioridade e menos ruído</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">A fila agora destaca pressão operacional, SLA e clientes mais sensíveis em uma leitura mais forte, principalmente para quem trabalha em acompanhamento contínuo.</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Críticos</p>
                <p className="mt-2 text-2xl font-semibold text-white">{queueStats.critical}</p>
                <p className="mt-1 text-xs text-slate-300">sob pressão</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Com O.S.</p>
                <p className="mt-2 text-2xl font-semibold text-white">{queueStats.openOs}</p>
                <p className="mt-1 text-xs text-slate-300">em operação</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Vencidos</p>
                <p className="mt-2 text-2xl font-semibold text-white">{queueStats.overdue}</p>
                <p className="mt-1 text-xs text-slate-300">fora do prazo</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[28px] border border-slate-200 bg-white/94 p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.18)]">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Visão ativa</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{filteredClients.length}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">clientes com os filtros atuais.</p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white/94 p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.18)]">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Estratégia</p>
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">Prioridade visual</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Os cards mais sensíveis aparecem primeiro na ordenação por prioridade.</p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white/94 p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.18)]">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Fluxo</p>
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">Leitura por estágio</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Use a fila para enxergar acúmulo, SLA e carga por status.</p>
            </div>
          </div>
        </div>
      </section>

      {(search || assigneeFilter !== "Todos") ? (
        <div className="flex items-start gap-3 rounded-[26px] border border-sky-200 bg-[linear-gradient(180deg,rgba(239,246,255,0.95),rgba(224,242,254,0.84))] px-4 py-4 text-sm text-sky-950 dark:border-sky-500/30 dark:bg-[linear-gradient(180deg,rgba(8,47,73,0.8),rgba(7,37,58,0.7))] dark:text-sky-200 shadow-[0_18px_30px_-28px_rgba(14,116,144,0.28)]">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-sky-700 dark:text-sky-300">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="font-medium">Fila em modo filtrado</p>
            <p className="mt-1 leading-6 text-sky-900/80">A visualização atual está reduzindo ruído para destacar apenas os clientes que fazem sentido neste recorte.</p>
          </div>
        </div>
      ) : null}

      <section className="surface-card rounded-[28px] p-4 sm:p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar por cliente, descrição ou responsável" />
          </div>
          <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-ring/70">
            <option value="Todos">Todos os responsáveis</option>
            {assignees.map((assignee) => (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            ))}
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-ring/70">
            <option value="priority">Prioridade</option>
            <option value="recent">Atualizados recentemente</option>
            <option value="services">Mais recorrentes</option>
          </select>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => {
          const criticalItems = column.items.filter((client) => isCriticalClient(client)).length;
          const overdueItems = column.items.filter((client) => !client.resolved && client.nextActionAt && new Date(client.nextActionAt).getTime() < Date.now()).length;

          return (
            <div key={column.title} className="surface-card flex min-h-[420px] flex-col rounded-[30px] p-4">
              <div className="mb-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{column.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400 dark:text-slate-500">{column.description}</p>
                  </div>
                  <Badge variant="outline">{column.items.length}</Badge>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-[18px] border border-white bg-white/94 px-3 py-2 text-xs text-slate-500 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.18)]">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{criticalItems}</span> críticos neste estágio
                  </div>
                  <div className="rounded-[18px] border border-white bg-white/94 px-3 py-2 text-xs text-slate-500 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.18)]">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{overdueItems}</span> vencidos neste estágio
                  </div>
                </div>
              </div>

              <div className="grid-fade-mask space-y-3">
                {column.items.length === 0 ? (
                  <div className="flex min-h-[190px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    <ShieldAlert className="mb-3 size-5 text-slate-400 dark:text-slate-500" />
                    Nenhum cliente neste estágio com o filtro atual.
                  </div>
                ) : (
                  column.items.map((item) => {
                    const critical = isCriticalClient(item);
                    const overdue = !item.resolved && item.nextActionAt && new Date(item.nextActionAt).getTime() < Date.now();

                    return (
                      <div key={item.id} className="surface-muted hover-lift rounded-[26px] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-medium text-slate-950 dark:text-slate-50">{item.name}</p>
                              {critical ? <Badge className="bg-amber-100 text-amber-900">Crítico</Badge> : null}
                              {overdue ? <Badge className="bg-rose-100 text-rose-900">Vencido</Badge> : null}
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{formatPhone(item.phone)}</p>
                          </div>
                          <Badge variant="secondary">{item.totalServices}x</Badge>
                        </div>

                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400 dark:text-slate-500">{item.description || "Sem descrição operacional."}</p>

                        <div className="mt-3 grid gap-2 rounded-[20px] border border-white bg-white p-3 text-xs text-slate-500 shadow-[0_14px_28px_-26px_rgba(15,23,42,0.18)]">
                          <div className="flex items-center justify-between gap-3">
                            <span>Responsável</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{item.assignee}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>Próxima ação</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{item.nextActionAt ? formatDateLabel(item.nextActionAt) : "Sem agenda"}</span>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <a href={`tel:${item.phone}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "justify-center")}>
                            <PhoneCall className="size-4" />
                            Ligar
                          </a>
                          <a href={buildWhatsappLink(item.phone)} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "justify-center")}>
                            <MessageCircle className="size-4" />
                            WhatsApp
                          </a>
                        </div>

                        <div className="mt-2 grid gap-2">
                          <Link href={`/clientes?view=${column.title === "Aguardando contato" ? "waiting" : column.title === "O.S. aberta" ? "os" : column.title === "Resolvido" ? "resolved" : "no-return"}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "justify-between rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800/40")}>
                            Abrir na carteira
                            <ArrowRight className="size-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FilaPage() {
  return (
    <ClientsProvider>
      <FilaPageContent />
    </ClientsProvider>
  );
}
