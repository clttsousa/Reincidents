"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Clock3, MessageCircle, PhoneCall, Search } from "lucide-react";

import { ClientsProvider, useClients } from "@/components/providers/clients-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
        const matchesSearch =
          !term ||
          client.name.toLowerCase().includes(term) ||
          client.assignee.toLowerCase().includes(term) ||
          client.description.toLowerCase().includes(term);
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

  return (
    <div className="space-y-6">
      <section className="surface-card section-shell space-y-3">
        <Badge variant="secondary" className="w-fit bg-slate-100 text-slate-700">
          Visão operacional
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Fila por status</h1>
        <p className="text-sm text-slate-500 sm:text-base">
          Agora a fila também ajuda na ação: busque, filtre por responsável e entre nos canais mais rápidos para cada cliente.
        </p>
      </section>

      <section className="surface-card rounded-[24px] p-4 sm:p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar por cliente, descrição ou responsável" />
          </div>
          <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <option value="Todos">Todos os responsáveis</option>
            {assignees.map((assignee) => (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            ))}
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <option value="priority">Prioridade</option>
            <option value="recent">Atualizados recentemente</option>
            <option value="services">Mais recorrentes</option>
          </select>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => (
          <div key={column.title} className="flex min-h-[340px] flex-col rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)]">
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-950">{column.title}</h2>
                <Badge variant="outline">{column.items.length}</Badge>
              </div>
              <p className="text-sm text-slate-500">{column.description}</p>
            </div>

            <div className="space-y-3">
              {column.items.length === 0 ? (
                <div className="flex min-h-[160px] items-center justify-center rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500">
                  Nenhum cliente neste estágio com o filtro atual.
                </div>
              ) : (
                column.items.map((item) => (
                  <div key={item.id} className="hover-lift rounded-[24px] border border-slate-200/80 bg-slate-50/75 p-4 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.18)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium text-slate-950">{item.name}</p>
                          {isCriticalClient(item) ? <Badge className="bg-amber-100 text-amber-900">Crítico</Badge> : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{formatPhone(item.phone)}</p>
                      </div>
                      <Badge variant="secondary">{item.totalServices}x</Badge>
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{item.description || "Sem descrição operacional."}</p>

                    <div className="mt-3 grid gap-2 rounded-2xl bg-white p-3 text-xs text-slate-500">
                      <div className="flex items-center justify-between gap-3">
                        <span>Responsável</span>
                        <span className="font-medium text-slate-700">{item.assignee}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Próxima ação</span>
                        <span className="font-medium text-slate-700">{item.nextActionAt ? formatDateLabel(item.nextActionAt) : "Sem agenda"}</span>
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
                      <Link href={`/clientes?view=${column.title === "Aguardando contato" ? "waiting" : column.title === "O.S. aberta" ? "os" : column.title === "Resolvido" ? "resolved" : "no-return"}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "justify-between rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}>
                        Abrir na carteira
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
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
