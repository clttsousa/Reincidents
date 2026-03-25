"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Copy,
  ExternalLink,
  MessageCircle,
  Pencil,
  PhoneCall,
  Plus,
  Search,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";

import { ClientFormSheet } from "@/components/clientes/client-form-sheet";
import { useClients } from "@/components/providers/clients-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildWhatsappLink,
  formatDateLabel,
  formatPhone,
  getOsLabel,
  getResolvedLabel,
  isCriticalClient,
  isStaleClient,
  sanitizePhone,
  statusOptions,
  statusStyles,
} from "@/lib/client-helpers";
import { assigneeOptions } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { ClientRecord, ClientStatus } from "@/types/mock";

const quickFilters: Array<{ label: string; value: "Todos" | ClientStatus }> = [
  { label: "Todos", value: "Todos" },
  { label: "Aguardando contato", value: "Aguardando contato" },
  { label: "O.S. aberta", value: "O.S. aberta" },
  { label: "Resolvidos", value: "Resolvido" },
  { label: "Sem retorno", value: "Sem retorno" },
];

function MetricCard({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("rounded-[22px] border border-slate-200 bg-white p-4", className)}>
      <p className="text-xs text-slate-500 sm:text-sm">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-white text-slate-500">
        <Search className="size-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-950">Nenhum cliente encontrado</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">Ajuste os filtros ou limpe a busca para voltar a exibir a base completa.</p>
      <Button variant="outline" className="mt-5" onClick={onClear}>
        Limpar filtros
      </Button>
    </div>
  );
}

export function ClientsTable() {
  const { clients, stats, staleClients, addClient, updateClient, updateClientStatus } = useClients();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof quickFilters)[number]["value"]>("Todos");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("Todos");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [staleOnly, setStaleOnly] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);

  useEffect(() => {
    const openCreate = () => {
      setSheetMode("create");
      setSelectedClient(null);
      setSheetOpen(true);
    };

    window.addEventListener("recorrenciaos:new-client", openCreate as EventListener);
    return () => window.removeEventListener("recorrenciaos:new-client", openCreate as EventListener);
  }, []);

  useEffect(() => {
    if (!copiedClientId) return;

    const timeout = window.setTimeout(() => setCopiedClientId(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [copiedClientId]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesStatus = activeFilter === "Todos" ? true : client.status === activeFilter;
      const matchesAssignee = assigneeFilter === "Todos" ? true : client.assignee === assigneeFilter;
      const matchesCritical = criticalOnly ? isCriticalClient(client) : true;
      const matchesStale = staleOnly ? isStaleClient(client) : true;
      const matchesSearch =
        term.length === 0 ||
        client.name.toLowerCase().includes(term) ||
        sanitizePhone(client.phone).includes(term.replace(/\D/g, "")) ||
        client.description.toLowerCase().includes(term) ||
        client.assignee.toLowerCase().includes(term) ||
        client.osNumber.toLowerCase().includes(term);

      return matchesStatus && matchesAssignee && matchesCritical && matchesStale && matchesSearch;
    });
  }, [activeFilter, assigneeFilter, clients, criticalOnly, search, staleOnly]);

  const handleCopyPhone = async (client: ClientRecord) => {
    const text = formatPhone(client.phone);

    try {
      await navigator.clipboard.writeText(text);
      setCopiedClientId(client.id);
    } catch {
      setCopiedClientId(client.id);
    }
  };

  const openCreateSheet = () => {
    setSheetMode("create");
    setSelectedClient(null);
    setSheetOpen(true);
  };

  const openEditSheet = (client: ClientRecord) => {
    setSheetMode("edit");
    setSelectedClient(client);
    setSheetOpen(true);
  };

  const handleSave = (values: Parameters<typeof addClient>[0]) => {
    if (sheetMode === "create") {
      addClient(values);
      return;
    }

    if (selectedClient) {
      updateClient(selectedClient.id, values);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setActiveFilter("Todos");
    setAssigneeFilter("Todos");
    setCriticalOnly(false);
    setStaleOnly(false);
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <MetricCard label="Total" value={String(stats.total)} className="col-span-2 xl:col-span-1" />
          <MetricCard label="Aguardando contato" value={String(stats.waiting)} />
          <MetricCard label="O.S. abertas" value={String(stats.os)} />
          <MetricCard label="Resolvidos" value={String(stats.solved)} />
          <MetricCard label="Sem retorno" value={String(stats.noReturn)} />
        </div>

        {staleClients.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <p className="font-medium text-amber-950">{staleClients.length} clientes sem atualização há 3 dias ou mais</p>
                <p className="mt-1 text-sm text-amber-900/80">Ative o filtro para priorizar esses casos.</p>
              </div>
            </div>
            <Button variant="outline" className="border-amber-200 bg-white text-amber-900 hover:bg-amber-100" onClick={() => setStaleOnly((current) => !current)}>
              <AlertTriangle className="size-4" />
              {staleOnly ? "Remover filtro" : "Filtrar atrasados"}
            </Button>
          </div>
        ) : null}

        <div className="surface-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-5 md:p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
              <div className="relative w-full lg:w-[340px] lg:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                  placeholder="Buscar por cliente, telefone, responsável ou O.S."
                />
              </div>
              <div className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600">
                {filteredClients.length} exibidos
              </div>
            </div>
            <Button onClick={openCreateSheet} className="hidden sm:inline-flex">
              Novo cliente
            </Button>
          </div>

          <div className="-mx-1 mt-4 overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2 px-1">
              {quickFilters.map((filter) => {
                const isActive = activeFilter === filter.value;

                return (
                  <button
                    key={filter.label}
                    type="button"
                    onClick={() => setActiveFilter(filter.value)}
                    className={cn(
                      "inline-flex shrink-0 items-center rounded-full border px-4 py-2 text-sm font-medium transition-all",
                      isActive ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-3 sm:p-4 lg:grid-cols-[220px_170px_170px_auto]">
            <select
              value={assigneeFilter}
              onChange={(event) => setAssigneeFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="Todos">Todos os responsáveis</option>
              {assigneeOptions.map((assignee) => (
                <option key={assignee} value={assignee}>
                  {assignee}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setCriticalOnly((current) => !current)}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition",
                criticalOnly ? "border-amber-300 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-600",
              )}
            >
              <ShieldAlert className="size-4" />
              Críticos
            </button>

            <button
              type="button"
              onClick={() => setStaleOnly((current) => !current)}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition",
                staleOnly ? "border-rose-300 bg-rose-50 text-rose-900" : "border-slate-200 bg-white text-slate-600",
              )}
            >
              <AlertTriangle className="size-4" />
              Sem atualização
            </button>

            <Button variant="ghost" className="justify-center text-slate-500" onClick={clearFilters}>
              <X className="size-4" />
              Limpar
            </Button>
          </div>

          <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white">
            <div className="hidden grid-cols-[minmax(240px,1.3fr)_180px_110px_170px_150px_130px_120px_200px] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-sm font-medium text-slate-500 lg:grid">
              <span>Cliente</span>
              <span>Telefone</span>
              <span>Atend.</span>
              <span>Status</span>
              <span>Responsável</span>
              <span>O.S.</span>
              <span>Resolvido</span>
              <span>Ações</span>
            </div>

            <div className="space-y-0 divide-y divide-slate-200">
              {filteredClients.length === 0 ? (
                <div className="p-4">
                  <EmptyState onClear={clearFilters} />
                </div>
              ) : (
                filteredClients.map((client) => {
                  const isCritical = isCriticalClient(client);
                  const isStale = isStaleClient(client);

                  return (
                    <div key={client.id} className={cn("relative px-4 py-5 transition duration-200 hover:bg-slate-50/70 lg:px-6", isCritical && "bg-amber-50/25")}>
                      <div className="hidden grid-cols-[minmax(240px,1.3fr)_180px_110px_170px_150px_130px_120px_200px] items-start gap-4 lg:grid">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-950">{client.name}</p>
                            {isCritical ? <Badge className="bg-amber-100 text-amber-900">Crítico</Badge> : null}
                            {isStale ? <Badge className="bg-rose-100 text-rose-900">Atrasado</Badge> : null}
                          </div>
                          {client.description ? <p className="mt-1 line-clamp-2 text-sm text-slate-500">{client.description}</p> : null}
                          <p className="mt-2 text-xs text-slate-400">Atualizado {formatDateLabel(client.updatedAt)}</p>
                        </div>

                        <div className="space-y-2">
                          <p className="font-medium text-slate-900">{formatPhone(client.phone)}</p>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="rounded-full px-3" onClick={() => handleCopyPhone(client)}>
                              <Copy className="size-3.5" />
                              {copiedClientId === client.id ? "Copiado" : "Copiar"}
                            </Button>
                            <a
                              href={buildWhatsappLink(client.phone)}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full px-3")}
                            >
                              <MessageCircle className="size-3.5" />
                              WhatsApp
                            </a>
                          </div>
                        </div>

                        <div>
                          <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
                            {client.totalServices}x
                          </Badge>
                        </div>

                        <div>
                          <select
                            aria-label={`Alterar status de ${client.name}`}
                            value={client.status}
                            onChange={(event) => updateClientStatus(client.id, event.target.value as ClientStatus)}
                            className={cn(
                              "h-10 w-full appearance-none rounded-full border px-4 text-sm font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-ring/50",
                              statusStyles[client.status],
                            )}
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            <UserRound className="size-4 text-slate-400" />
                            {client.assignee}
                          </div>
                        </div>

                        <div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full px-3 py-1 text-sm",
                              client.osOpen ? "border-sky-200 bg-sky-50 text-sky-900" : "border-slate-200 bg-white text-slate-600",
                            )}
                          >
                            {getOsLabel(client)}
                          </Badge>
                          {client.osNumber ? <p className="mt-2 text-xs text-slate-400">{client.osNumber}</p> : null}
                        </div>

                        <div>
                          <Badge className={cn(client.resolved ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-600")}>
                            {getResolvedLabel(client)}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <a href={`tel:${sanitizePhone(client.phone)}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full px-3")}>
                            <PhoneCall className="size-3.5" />
                            Contato
                          </a>
                          <Button variant="outline" size="sm" className="rounded-full px-3" onClick={() => openEditSheet(client)}>
                            <Pencil className="size-3.5" />
                            Editar
                          </Button>
                          <a
                            href={buildWhatsappLink(client.phone)}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8 rounded-full text-slate-500")}
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        </div>
                      </div>

                      <div className="space-y-4 lg:hidden">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-950">{client.name}</p>
                              {isCritical ? <Badge className="bg-amber-100 text-amber-900">Crítico</Badge> : null}
                              {isStale ? <Badge className="bg-rose-100 text-rose-900">Atrasado</Badge> : null}
                            </div>
                            <p className="mt-1 text-sm text-slate-500">{formatPhone(client.phone)}</p>
                          </div>
                          <Badge variant="outline" className="shrink-0 rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
                            {client.totalServices}x
                          </Badge>
                        </div>

                        {client.description ? <p className="text-sm leading-6 text-slate-500">{client.description}</p> : null}

                        <div className="grid gap-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Status</p>
                              <select
                                aria-label={`Alterar status de ${client.name}`}
                                value={client.status}
                                onChange={(event) => updateClientStatus(client.id, event.target.value as ClientStatus)}
                                className={cn(
                                  "h-11 w-full appearance-none rounded-2xl border px-4 text-sm font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-ring/50",
                                  statusStyles[client.status],
                                )}
                              >
                                {statusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Responsável</p>
                              <div className="inline-flex h-11 w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                <UserRound className="size-4 text-slate-400" />
                                {client.assignee}
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">O.S.</p>
                              <p className="mt-2 font-medium text-slate-950">{getOsLabel(client)}</p>
                              {client.osNumber ? <p className="mt-1 text-xs text-slate-400">{client.osNumber}</p> : null}
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Resolvido</p>
                              <p className="mt-2 font-medium text-slate-950">{getResolvedLabel(client)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" className="h-10 justify-center rounded-2xl px-3" onClick={() => handleCopyPhone(client)}>
                            <Copy className="size-3.5" />
                            {copiedClientId === client.id ? "Copiado" : "Copiar"}
                          </Button>
                          <a
                            href={`tel:${sanitizePhone(client.phone)}`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 justify-center rounded-2xl px-3")}
                          >
                            <PhoneCall className="size-3.5" />
                            Ligar
                          </a>
                          <a
                            href={buildWhatsappLink(client.phone)}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 justify-center rounded-2xl px-3")}
                          >
                            <MessageCircle className="size-3.5" />
                            WhatsApp
                          </a>
                          <Button variant="outline" size="sm" className="h-10 justify-center rounded-2xl px-3" onClick={() => openEditSheet(client)}>
                            <Pencil className="size-3.5" />
                            Editar
                          </Button>
                        </div>

                        <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                          <p>Atualizado {formatDateLabel(client.updatedAt)}</p>
                          <a
                            href={buildWhatsappLink(client.phone)}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8 rounded-full text-slate-500")}
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/92 px-3 py-3 backdrop-blur sm:hidden">
        <Button onClick={openCreateSheet} className="h-11 w-full justify-center rounded-2xl">
          <Plus className="size-4" />
          Novo cliente
        </Button>
      </div>

      <ClientFormSheet open={sheetOpen} mode={sheetMode} client={selectedClient} onClose={() => setSheetOpen(false)} onSubmit={handleSave} />
    </>
  );
}
