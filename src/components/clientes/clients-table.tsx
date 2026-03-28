"use client";

import {
  CheckCircle2,
  Copy,
  LayoutGrid,
  List,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClientFormSheet } from "@/components/clientes/client-form-sheet";
import { ClientTimelineSheet } from "@/components/clientes/client-timeline-sheet";
import { ClientStatusConfirmDialog, type PendingStatusChange } from "@/components/clientes/client-status-confirm-dialog";
import { ClientsListStateBanner } from "@/components/clientes/clients-list-state-banner";
import { ClientsLoadingState, ClientsMetricsGrid } from "@/components/clientes/clients-metrics-grid";
import { useClients } from "@/components/providers/clients-provider";
import { useToast } from "@/components/providers/toast-provider";
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
  statusOptions,
  statusStyles,
} from "@/lib/client-helpers";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { ClientRecord, ClientStatus, ClientFormValues } from "@/types/mock";

const FILTERS_STORAGE_KEY = "recorrenciaos-client-filters-v58";

const quickFilters: Array<{ label: string; value: "Todos" | ClientStatus }> = [
  { label: "Todos", value: "Todos" },
  { label: "Aguardando contato", value: "Aguardando contato" },
  { label: "O.S. aberta", value: "O.S. aberta" },
  { label: "Resolvidos", value: "Resolvido" },
  { label: "Sem retorno", value: "Sem retorno" },
];

type SortOption = "updated-desc" | "name-asc" | "services-desc" | "next-action-asc" | "critical-first";

type PersistedFilters = {
  search: string;
  activeFilter: (typeof quickFilters)[number]["value"];
  assigneeFilter: string;
  criticalOnly: boolean;
  staleOnly: boolean;
  osFilter: "Todos" | "Com O.S." | "Sem O.S.";
  resolvedFilter: "Todos" | "Resolvidos" | "Pendentes";
  sortBy: SortOption;
  density: "comfortable" | "compact";
};

const defaultFilters: PersistedFilters = {
  search: "",
  activeFilter: "Todos",
  assigneeFilter: "Todos",
  criticalOnly: false,
  staleOnly: false,
  osFilter: "Todos",
  resolvedFilter: "Todos",
  sortBy: "updated-desc",
  density: "comfortable",
};

const sortOptions: Array<{ label: string; value: SortOption }> = [
  { label: "Mais recentes", value: "updated-desc" },
  { label: "Nome A-Z", value: "name-asc" },
  { label: "Maior recorrência", value: "services-desc" },
  { label: "Próxima ação", value: "next-action-asc" },
  { label: "Críticos primeiro", value: "critical-first" },
];

export function ClientsTable() {
  const {
    clients,
    stats,
    loading,
    listRefreshing,
    errorMessage,
    staleData,
    totalClients,
    totalPages,
    page,
    updateClientStatus,
    updateClient,
    addClient,
    assignees,
    applyListQuery,
    setPage,
    refreshClients,
  } = useClients();
  const { pushToast } = useToast();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchInput, setSearchInput] = useState(defaultFilters.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [activeFilter, setActiveFilter] = useState<PersistedFilters["activeFilter"]>(defaultFilters.activeFilter);
  const [assigneeFilter, setAssigneeFilter] = useState(defaultFilters.assigneeFilter);
  const [criticalOnly, setCriticalOnly] = useState(defaultFilters.criticalOnly);
  const [staleOnly, setStaleOnly] = useState(defaultFilters.staleOnly);
  const [osFilter, setOsFilter] = useState<PersistedFilters["osFilter"]>(defaultFilters.osFilter);
  const [resolvedFilter, setResolvedFilter] = useState<PersistedFilters["resolvedFilter"]>(defaultFilters.resolvedFilter);
  const [sortBy, setSortBy] = useState<SortOption>(defaultFilters.sortBy);
  const [density, setDensity] = useState<PersistedFilters["density"]>(defaultFilters.density);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const workspaceOpen = sheetOpen || timelineOpen;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(FILTERS_STORAGE_KEY);
      const parsed = saved ? (JSON.parse(saved) as Partial<PersistedFilters>) : {};
      setSearchInput(parsed.search ?? defaultFilters.search);
      setActiveFilter(parsed.activeFilter ?? defaultFilters.activeFilter);
      setAssigneeFilter(parsed.assigneeFilter ?? defaultFilters.assigneeFilter);
      setCriticalOnly(parsed.criticalOnly ?? defaultFilters.criticalOnly);
      setStaleOnly(parsed.staleOnly ?? defaultFilters.staleOnly);
      setOsFilter(parsed.osFilter ?? defaultFilters.osFilter);
      setResolvedFilter(parsed.resolvedFilter ?? defaultFilters.resolvedFilter);
      setSortBy(parsed.sortBy ?? defaultFilters.sortBy);
      setDensity(parsed.density ?? defaultFilters.density);
    } catch {
      // ignora storage inválido
    }
  }, []);

  useEffect(() => {
    const payload: PersistedFilters = {
      search: searchInput,
      activeFilter,
      assigneeFilter,
      criticalOnly,
      staleOnly,
      osFilter,
      resolvedFilter,
      sortBy,
      density,
    };

    window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(payload));
  }, [searchInput, activeFilter, assigneeFilter, criticalOnly, staleOnly, osFilter, resolvedFilter, sortBy, density]);

  useEffect(() => {
    const onQuickCreate = () => {
      setSheetMode("create");
      setSelectedClient(null);
      setTimelineOpen(false);
      setSheetOpen(true);
    };

    window.addEventListener("recorrenciaos:new-client", onQuickCreate);
    return () => window.removeEventListener("recorrenciaos:new-client", onQuickCreate);
  }, []);

  useEffect(() => {
    const requestedView = searchParams.get("view");
    if (!requestedView) return;

    if (requestedView === "waiting") setActiveFilter("Aguardando contato");
    if (requestedView === "os") setActiveFilter("O.S. aberta");
    if (requestedView === "resolved") setActiveFilter("Resolvido");
    if (requestedView === "no-return") setActiveFilter("Sem retorno");
    if (requestedView === "critical") setCriticalOnly(true);
    if (requestedView === "stale") setStaleOnly(true);
    if (requestedView === "unassigned") setAssigneeFilter("Equipe");

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("view");
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (searchParams.get("create") !== "1") return;

    setSheetMode("create");
    setSelectedClient(null);
    setTimelineOpen(false);
    setSheetOpen(true);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("create");
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [pathname, router, searchParams]);

  useEffect(() => {
    applyListQuery({
      search: debouncedSearch,
      activeFilter,
      assigneeFilter,
      criticalOnly,
      staleOnly,
      osFilter,
      resolvedFilter,
      sortBy,
    });
  }, [activeFilter, applyListQuery, assigneeFilter, criticalOnly, debouncedSearch, osFilter, resolvedFilter, sortBy, staleOnly]);

  useEffect(() => {
    if (!workspaceOpen) return;
    requestAnimationFrame(() => workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [workspaceOpen, sheetMode, timelineOpen, selectedClient?.id]);

  const filteredClients = clients;

  const activeFilterCount = [
    debouncedSearch.length > 0,
    activeFilter !== "Todos",
    assigneeFilter !== "Todos",
    criticalOnly,
    staleOnly,
    osFilter !== "Todos",
    resolvedFilter !== "Todos",
  ].filter(Boolean).length;

  const summary = useMemo(
    () => ({
      visible: filteredClients.length,
      critical: filteredClients.filter((client) => isCriticalClient(client)).length,
      stale: filteredClients.filter((client) => isStaleClient(client)).length,
      noOwner: filteredClients.filter((client) => !client.responsibleUserId).length,
    }),
    [filteredClients],
  );

  const resetFilters = () => {
    setSearchInput(defaultFilters.search);
    setActiveFilter(defaultFilters.activeFilter);
    setAssigneeFilter(defaultFilters.assigneeFilter);
    setCriticalOnly(defaultFilters.criticalOnly);
    setStaleOnly(defaultFilters.staleOnly);
    setOsFilter(defaultFilters.osFilter);
    setResolvedFilter(defaultFilters.resolvedFilter);
    setSortBy(defaultFilters.sortBy);
    setDensity(defaultFilters.density);
    setPage(1);
    pushToast({ tone: "info", title: "Filtros limpos", description: "A visão voltou para a configuração padrão." });
  };

  const handleCopyPhone = (client: ClientRecord) => {
    navigator.clipboard.writeText(client.phone);
    setCopiedClientId(client.id);
    setTimeout(() => setCopiedClientId(null), 1800);
    pushToast({ tone: "success", title: "Copiado!", description: "Telefone copiado para a área de transferência." });
  };

  const openCreateSheet = () => {
    setTimelineOpen(false);
    setSheetMode("create");
    setSelectedClient(null);
    setSheetOpen(true);
  };

  const openEditSheet = (client: ClientRecord) => {
    setTimelineOpen(false);
    setSheetMode("edit");
    setSelectedClient(client);
    setSheetOpen(true);
  };

  const openTimeline = (client: ClientRecord) => {
    setSheetOpen(false);
    setSelectedClient(client);
    setTimelineOpen(true);
  };


  const requiresStatusConfirmation = (client: ClientRecord, nextStatus: ClientStatus) => {
    if (nextStatus !== "Resolvido") return null;
    if (client.osOpen) {
      return "Este cliente ainda possui O.S. aberta. Confirme que o atendimento pode ser encerrado antes de marcar como resolvido.";
    }
    if (client.totalServices >= 8) {
      return "Este cliente tem alta recorrência. Vale confirmar que o caso realmente foi encerrado para não perder contexto operacional.";
    }
    return null;
  };

  const handleStatusSelect = (client: ClientRecord, nextStatus: ClientStatus) => {
    if (client.status === nextStatus) return;
    const reason = requiresStatusConfirmation(client, nextStatus);

    if (reason) {
      setPendingStatusChange({
        clientId: client.id,
        clientName: client.name,
        currentStatus: client.status,
        nextStatus,
        reason,
      });
      return;
    }

    void updateClientStatus(client.id, nextStatus);
  };

  const handleSave = async (values: ClientFormValues): Promise<boolean> => {
    setFormSubmitting(true);
    try {
      let success = false;
      if (sheetMode === "create") {
        success = await addClient(values);
      } else if (selectedClient) {
        success = await updateClient(selectedClient.id, values);
      }
      return success;
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    await updateClientStatus(pendingStatusChange.clientId, pendingStatusChange.nextStatus);
    setPendingStatusChange(null);
  };

  if (loading) return <ClientsLoadingState />;

  const rowPaddingClass = density === "compact" ? "py-3" : "py-[18px]";
  const rowMetaGap = density === "compact" ? "mt-2" : "mt-2.5";

  return (
    <div className="space-y-6 animate-enter">
      {workspaceOpen ? (
        <div ref={workspaceRef} className="space-y-4 scroll-mt-28">
          <section className="surface-subtle flex flex-col gap-3 rounded-[24px] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-heading">Área ativa da carteira</p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Cadastro e leitura do cliente abrem direto na tela principal, sem bloquear o restante da página e sem depender de overlay.
              </p>
            </div>
            <Button
              variant="outline"
              className="h-11 rounded-2xl px-5"
              onClick={() => {
                setSheetOpen(false);
                setTimelineOpen(false);
              }}
            >
              Fechar painel
            </Button>
          </section>

          {sheetOpen ? (
            <ClientFormSheet
              open={sheetOpen}
              mode={sheetMode}
              client={selectedClient}
              assignees={assignees}
              submitting={formSubmitting}
              onClose={() => setSheetOpen(false)}
              onSubmit={handleSave}
            />
          ) : null}

          {timelineOpen ? <ClientTimelineSheet open={timelineOpen} client={selectedClient} onClose={() => setTimelineOpen(false)} /> : null}
        </div>
      ) : null}
      {errorMessage ? <ClientsListStateBanner message={errorMessage} staleData={staleData} refreshing={listRefreshing} onRetry={() => void refreshClients()} /> : null}

      <ClientsMetricsGrid total={stats.total} waiting={stats.waiting} os={stats.os} solved={stats.solved} noReturn={stats.noReturn} />

      <div className="surface-card rounded-[34px] border-none p-1 shadow-premium">
        <div className="grid gap-0 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="border-b border-slate-100/90 p-5 dark:border-slate-800/50 lg:border-b-0 lg:border-r lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Painel de filtros</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">Refine a carteira</h3>
              </div>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <SlidersHorizontal className="size-4" />
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar cliente, telefone, O.S. ou responsável"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-11 rounded-2xl pl-10"
                />
              </div>

              <div className="surface-inset rounded-[24px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Resumo da visão</p>
                  <Badge variant="outline">{summary.visible}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400">Críticos</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{summary.critical}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Atrasados</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{summary.stale}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Sem dono</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{summary.noOwner}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Filtros ativos</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{activeFilterCount}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Status</p>
                <div className="flex flex-wrap gap-2">
                  {quickFilters.map((filter) => (
                    <button
                      key={filter.label}
                      type="button"
                      onClick={() => setActiveFilter(filter.value)}
                      className={cn(
                        "rounded-full px-3.5 py-2 text-xs font-medium transition-all",
                        activeFilter === filter.value
                          ? "chip-active"
                          : "chip-neutral hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80",
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Responsável</p>
                  <select
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200/90 bg-white/95 px-4 text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/12 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
                  >
                    <option value="Todos">Todos os responsáveis</option>
                    {assignees.map((assignee) => (
                      <option key={assignee.id} value={assignee.name}>
                        {assignee.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Ordenação</p>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="h-11 w-full rounded-2xl border border-slate-200/90 bg-white/95 px-4 text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/12 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="space-y-2">
                    <p className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Filtro de O.S.</p>
                    <select
                      value={osFilter}
                      onChange={(e) => setOsFilter(e.target.value as PersistedFilters["osFilter"])}
                      className="h-11 w-full rounded-2xl border border-slate-200/90 bg-white/95 px-4 text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/12 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
                    >
                      <option value="Todos">Todos</option>
                      <option value="Com O.S.">Com O.S.</option>
                      <option value="Sem O.S.">Sem O.S.</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <p className="px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Filtro de resolução</p>
                    <select
                      value={resolvedFilter}
                      onChange={(e) => setResolvedFilter(e.target.value as PersistedFilters["resolvedFilter"])}
                      className="h-11 w-full rounded-2xl border border-slate-200/90 bg-white/95 px-4 text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/12 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100"
                    >
                      <option value="Todos">Todos</option>
                      <option value="Resolvidos">Resolvidos</option>
                      <option value="Pendentes">Pendentes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="surface-inset space-y-3 rounded-[24px] p-4">
                <label className="flex cursor-pointer items-center gap-3 group">
                  <div
                    className={cn(
                      "flex size-5 items-center justify-center rounded-md border transition-all",
                      criticalOnly ? "border-amber-500 bg-amber-500" : "border-slate-300 dark:border-slate-600",
                    )}
                  >
                    {criticalOnly && <CheckCircle2 className="size-3.5 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={criticalOnly} onChange={(e) => setCriticalOnly(e.target.checked)} />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Apenas críticos</p>
                    <p className="text-xs text-slate-400">Mostra clientes com pressão operacional.</p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3 group">
                  <div
                    className={cn(
                      "flex size-5 items-center justify-center rounded-md border transition-all",
                      staleOnly ? "border-rose-500 bg-rose-500" : "border-slate-300 dark:border-slate-600",
                    )}
                  >
                    {staleOnly && <CheckCircle2 className="size-3.5 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={staleOnly} onChange={(e) => setStaleOnly(e.target.checked)} />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Apenas atrasados</p>
                    <p className="text-xs text-slate-400">Foca em quem ficou sem atualização recente.</p>
                  </div>
                </label>
              </div>

              <Button variant="outline" className="w-full" onClick={resetFilters}>
                Limpar filtros
              </Button>
            </div>
          </aside>

          <section className="flex min-w-0 flex-col p-2 lg:p-3">
            <div className="surface-subtle rounded-[28px] px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-xl px-2.5 py-1 font-bold text-indigo-600 dark:text-indigo-400">
                      {filteredClients.length}
                    </Badge>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Clientes nesta página · {totalClients} no total</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Busca e paginação agora rodam no Supabase para manter a carteira estável mesmo com bases maiores.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {activeFilter !== "Todos" ? <Badge variant="outline">{activeFilter}</Badge> : null}
                  {criticalOnly ? <Badge variant="outline">Críticos</Badge> : null}
                  {staleOnly ? <Badge variant="outline">Atrasados</Badge> : null}
                  {assigneeFilter !== "Todos" ? <Badge variant="outline">{assigneeFilter}</Badge> : null}
                </div>
              </div>
            </div>

            <div className="surface-card mt-3 flex min-h-[620px] flex-1 flex-col overflow-hidden rounded-[30px]">
              <div className="flex flex-col gap-3 border-b border-slate-100/90 px-4 py-4 dark:border-slate-800/50 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-lg px-2 py-1 font-bold text-indigo-600 dark:text-indigo-400">
                      {activeFilterCount}
                    </Badge>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Filtros ativos {listRefreshing ? "· sincronizando" : ""}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {summary.critical} críticos · {summary.stale} atrasados · {summary.noOwner} sem dono na lista atual.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" className="h-10 rounded-2xl" onClick={openCreateSheet}>
                    <Plus className="size-4" />
                    Novo cliente
                  </Button>
                  <div className="flex items-center rounded-2xl border border-slate-200/90 bg-white/90 p-1 dark:border-slate-700/60 dark:bg-slate-800/70">
                    <button
                      type="button"
                      onClick={() => setDensity("comfortable")}
                      className={cn(
                        "rounded-xl p-2 transition-all",
                        density === "comfortable" ? "bg-slate-950 text-white dark:bg-indigo-500" : "text-slate-400",
                      )}
                      aria-label="Densidade confortável"
                    >
                      <LayoutGrid className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDensity("compact")}
                      className={cn(
                        "rounded-xl p-2 transition-all",
                        density === "compact" ? "bg-slate-950 text-white dark:bg-indigo-500" : "text-slate-400",
                      )}
                      aria-label="Densidade compacta"
                    >
                      <List className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar max-h-[760px]">
                {filteredClients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
                      <Search className="size-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nenhum resultado</h3>
                    <p className="mt-1 max-w-xs text-sm text-slate-500">Tente ajustar a busca ou remover alguns filtros para ampliar a visão.</p>
                    <Button variant="outline" className="mt-6 rounded-2xl" onClick={resetFilters}>
                      Limpar filtros
                    </Button>
                  </div>
                ) : (
                  <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left">
                    <thead className="sticky top-0 z-10 bg-white/95  dark:bg-slate-900/95">
                      <tr>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800/50">Cliente</th>
                        <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800/50">Status</th>
                        <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800/50">Responsável</th>
                        <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800/50">Próxima ação</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800/50 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((client) => {
                        const isCrit = isCriticalClient(client);
                        const isStale = isStaleClient(client);

                        return (
                          <tr key={client.id} className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/20">
                            <td className={cn("px-6 align-top", rowPaddingClass)}>
                              <div className="flex items-start gap-3">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                                  {client.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => openTimeline(client)}
                                      className="truncate text-left font-semibold text-slate-900 transition-colors hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                                    >
                                      {client.name}
                                    </button>
                                    {isCrit ? <span className="size-2 rounded-full bg-amber-500 animate-pulse-soft" title="Crítico" /> : null}
                                  </div>
                                  <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{formatPhone(client.phone)}</p>
                                  <div className={cn("flex flex-wrap items-center gap-2", rowMetaGap)}>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                      {client.totalServices}x recorrências
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                      O.S. {getOsLabel(client)}
                                    </span>
                                    {isStale ? (
                                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 dark:bg-rose-500/12 dark:text-rose-300">
                                        Atrasado
                                      </span>
                                    ) : null}
                                    {client.resolved ? (
                                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
                                        Resolvido {getResolvedLabel(client)}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className={cn("px-5 align-top", rowPaddingClass)}>
                              <select
                                value={client.status}
                                onChange={(e) => handleStatusSelect(client, e.target.value as ClientStatus)}
                                className={cn(
                                  "h-10 rounded-xl border-none px-3 text-[11px] font-bold uppercase tracking-[0.14em] outline-none cursor-pointer transition-all",
                                  statusStyles[client.status],
                                )}
                              >
                                {statusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                              <p className="mt-2 text-xs leading-5 text-slate-400 dark:text-slate-500">Atualizado {formatDateLabel(client.updatedAt)}</p>
                            </td>

                            <td className={cn("px-5 align-top", rowPaddingClass)}>
                              <div className="rounded-[20px] border border-slate-200/80 bg-slate-50/85 px-3.5 py-3 dark:border-slate-700/50 dark:bg-slate-800/45">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                  <UserRound className="size-3.5 opacity-60" />
                                  <span className="truncate">{client.assignee}</span>
                                </div>
                                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                                  {client.responsibleUserId ? "Responsável definido" : "Sem responsável vinculado"}
                                </p>
                              </div>
                            </td>

                            <td className={cn("px-5 align-top", rowPaddingClass)}>
                              <div
                                className={cn(
                                  "w-fit rounded-[18px] px-3 py-2 text-xs font-medium",
                                  client.nextActionAt
                                    ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    : "border border-dashed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-transparent",
                                )}
                              >
                                {client.nextActionAt ? formatDateLabel(client.nextActionAt) : "Não agendado"}
                              </div>
                              <p className="mt-2 text-xs leading-5 text-slate-400 dark:text-slate-500">
                                {client.description?.trim() ? client.description.slice(0, 80) : "Sem observações registradas."}
                              </p>
                            </td>

                            <td className={cn("px-6 align-top text-right", rowPaddingClass)}>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "size-9 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20",
                                    copiedClientId === client.id && "text-indigo-600",
                                  )}
                                  onClick={() => handleCopyPhone(client)}
                                  title="Copiar telefone"
                                >
                                  <Copy className="size-4" />
                                </Button>
                                <a
                                  href={buildWhatsappLink(client.phone)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cn(
                                    buttonVariants({ variant: "ghost", size: "icon" }),
                                    "size-9 rounded-xl text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20",
                                  )}
                                  title="Abrir no WhatsApp"
                                >
                                  <MessageCircle className="size-4" />
                                </a>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                                  onClick={() => openEditSheet(client)}
                                  title="Editar cliente"
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100/90 px-4 py-4 dark:border-slate-800/50 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Página <span className="font-semibold text-slate-900 dark:text-slate-100">{page}</span> de <span className="font-semibold text-slate-900 dark:text-slate-100">{totalPages}</span> · {totalClients} clientes encontrados
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-10 rounded-2xl" onClick={() => setPage(page - 1)} disabled={page <= 1 || listRefreshing}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" className="h-10 rounded-2xl" onClick={() => setPage(page + 1)} disabled={page >= totalPages || listRefreshing}>
                    Próxima
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

            <ClientStatusConfirmDialog pendingChange={pendingStatusChange} onCancel={() => setPendingStatusChange(null)} onConfirm={confirmStatusChange} />

    </div>
  );
}
