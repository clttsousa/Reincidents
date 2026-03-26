"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Clock3,
  Copy,
  Download,
  MessageCircle,
  Pencil,
  PhoneCall,
  Plus,
  Rows3,
  Search,
  ShieldAlert,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import { ClientFormSheet } from "@/components/clientes/client-form-sheet";
import { ClientTimelineSheet } from "@/components/clientes/client-timeline-sheet";
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
  hasOpenOs,
  isCriticalClient,
  isStaleClient,
  sanitizePhone,
  statusOptions,
  statusStyles,
} from "@/lib/client-helpers";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { ClientRecord, ClientStatus } from "@/types/mock";

const FILTERS_STORAGE_KEY = "recorrenciaos-client-filters-v43";

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

function MetricCard({ label, value, helper, className }: { label: string; value: string; helper?: string; className?: string }) {
  return (
    <div className={cn("rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.16)]", className)}>
      <p className="text-xs text-slate-500 sm:text-sm">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={cn("h-[92px] animate-pulse rounded-[22px] border border-slate-200 bg-white/70", index === 0 && "col-span-2 xl:col-span-1")} />
        ))}
      </div>
      <div className="rounded-[28px] border border-slate-200 bg-white p-6">
        <div className="h-11 animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-[92px] animate-pulse rounded-[22px] bg-slate-100/80" />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onClear, onCreate }: { onClear: () => void; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-white text-slate-500">
        <Search className="size-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-950">Nenhum cliente encontrado</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Se a base estiver vazia, crie o primeiro cliente. Se você estiver usando filtros, limpe-os para voltar a exibir a carteira completa.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" onClick={onClear}>
          Limpar filtros
        </Button>
        <Button onClick={onCreate}>
          <Plus className="size-4" />
          Novo cliente
        </Button>
      </div>
    </div>
  );
}

function buildDefaultFilters(): PersistedFilters {
  return {
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
}

function sortClients(clients: ClientRecord[], sortBy: SortOption) {
  return [...clients].sort((a, b) => {
    if (sortBy === "name-asc") {
      return a.name.localeCompare(b.name, "pt-BR");
    }

    if (sortBy === "services-desc") {
      return b.totalServices - a.totalServices || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }

    if (sortBy === "next-action-asc") {
      const aValue = a.nextActionAt ? new Date(a.nextActionAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bValue = b.nextActionAt ? new Date(b.nextActionAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aValue - bValue || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }

    if (sortBy === "critical-first") {
      const aCritical = isCriticalClient(a) ? 1 : 0;
      const bCritical = isCriticalClient(b) ? 1 : 0;
      return bCritical - aCritical || b.totalServices - a.totalServices || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

const viewPresets: Array<{
  label: string;
  action: (setters: {
    setActiveFilter: (value: (typeof quickFilters)[number]["value"]) => void;
    setAssigneeFilter: (value: string) => void;
    setCriticalOnly: (value: boolean) => void;
    setStaleOnly: (value: boolean) => void;
    setOsFilter: (value: PersistedFilters["osFilter"]) => void;
    setResolvedFilter: (value: PersistedFilters["resolvedFilter"]) => void;
    setSortBy: (value: SortOption) => void;
  }) => void;
}> = [
  {
    label: "Críticos",
    action: ({ setActiveFilter, setAssigneeFilter, setCriticalOnly, setStaleOnly, setOsFilter, setResolvedFilter, setSortBy }) => {
      setActiveFilter("Todos");
      setAssigneeFilter("Todos");
      setCriticalOnly(true);
      setStaleOnly(false);
      setOsFilter("Todos");
      setResolvedFilter("Pendentes");
      setSortBy("critical-first");
    },
  },
  {
    label: "Atrasados",
    action: ({ setActiveFilter, setAssigneeFilter, setCriticalOnly, setStaleOnly, setOsFilter, setResolvedFilter, setSortBy }) => {
      setActiveFilter("Todos");
      setAssigneeFilter("Todos");
      setCriticalOnly(false);
      setStaleOnly(true);
      setOsFilter("Todos");
      setResolvedFilter("Pendentes");
      setSortBy("updated-desc");
    },
  },
  {
    label: "Sem responsável",
    action: ({ setActiveFilter, setAssigneeFilter, setCriticalOnly, setStaleOnly, setOsFilter, setResolvedFilter, setSortBy }) => {
      setActiveFilter("Todos");
      setAssigneeFilter("Sem responsável");
      setCriticalOnly(false);
      setStaleOnly(false);
      setOsFilter("Todos");
      setResolvedFilter("Pendentes");
      setSortBy("updated-desc");
    },
  },
  {
    label: "Resolvidos",
    action: ({ setActiveFilter, setAssigneeFilter, setCriticalOnly, setStaleOnly, setOsFilter, setResolvedFilter, setSortBy }) => {
      setActiveFilter("Resolvido");
      setAssigneeFilter("Todos");
      setCriticalOnly(false);
      setStaleOnly(false);
      setOsFilter("Todos");
      setResolvedFilter("Resolvidos");
      setSortBy("updated-desc");
    },
  },
];

export function ClientsTable() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clients, stats, staleClients, assignees, loading, formSubmitting, updatingClientId, addClient, updateClient, updateClientStatus } = useClients();

  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof quickFilters)[number]["value"]>("Todos");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("Todos");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [staleOnly, setStaleOnly] = useState(false);
  const [osFilter, setOsFilter] = useState<"Todos" | "Com O.S." | "Sem O.S.">( "Todos" );
  const [resolvedFilter, setResolvedFilter] = useState<"Todos" | "Resolvidos" | "Pendentes">("Todos");
  const [sortBy, setSortBy] = useState<SortOption>("updated-desc");
  const [density, setDensity] = useState<PersistedFilters["density"]>("comfortable");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ clientId: string; nextStatus: ClientStatus } | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const search = useDebouncedValue(searchInput, 180);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FILTERS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<PersistedFilters>;
      setSearchInput(parsed.search ?? "");
      setActiveFilter(parsed.activeFilter ?? "Todos");
      setAssigneeFilter(parsed.assigneeFilter ?? "Todos");
      setCriticalOnly(Boolean(parsed.criticalOnly));
      setStaleOnly(Boolean(parsed.staleOnly));
      setOsFilter(parsed.osFilter ?? "Todos");
      setResolvedFilter(parsed.resolvedFilter ?? "Todos");
      setSortBy(parsed.sortBy ?? "updated-desc");
      setDensity(parsed.density ?? "comfortable");
    } catch {
      // Ignora estado inválido salvo no navegador.
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
  }, [activeFilter, assigneeFilter, criticalOnly, density, osFilter, resolvedFilter, searchInput, sortBy, staleOnly]);

  useEffect(() => {
    const openCreate = () => {
      setSheetMode("create");
      setSelectedClientId(null);
      setSheetOpen(true);
    };

    window.addEventListener("recorrenciaos:new-client", openCreate as EventListener);
    return () => window.removeEventListener("recorrenciaos:new-client", openCreate as EventListener);
  }, []);

  useEffect(() => {
    if (searchParams.get("create") !== "1") return;

    setSheetMode("create");
    setSelectedClientId(null);
    setSheetOpen(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("create");
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!copiedClientId) return;
    const timeout = window.setTimeout(() => setCopiedClientId(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [copiedClientId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);

      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if ((event.key === "n" || event.key === "N") && !typing) {
        event.preventDefault();
        openCreateSheet();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const view = searchParams.get("view");
    const assignee = searchParams.get("assignee");

    if (!view && !assignee) return;

    setActiveFilter(
      view === "waiting"
        ? "Aguardando contato"
        : view === "os"
          ? "O.S. aberta"
          : view === "resolved"
            ? "Resolvido"
            : view === "no-return"
              ? "Sem retorno"
              : "Todos",
    );
    setCriticalOnly(view === "critical");
    setStaleOnly(view === "stale");
    setAssigneeFilter(view === "unassigned" ? "Sem responsável" : assignee ?? "Todos");
    setOsFilter(view === "os" ? "Com O.S." : "Todos");
    setResolvedFilter(view === "resolved" ? "Resolvidos" : view === "critical" || view === "waiting" || view === "no-return" || view === "unassigned" ? "Pendentes" : "Todos");
    setSortBy(view === "critical" ? "critical-first" : "updated-desc");
  }, [searchParams]);

  const activeAssignees = useMemo(() => assignees.filter((assignee) => assignee.isActive), [assignees]);
  const selectedClient = useMemo(() => clients.find((client) => client.id === selectedClientId) ?? null, [clients, selectedClientId]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = clients.filter((client) => {
      const matchesStatus = activeFilter === "Todos" ? true : client.status === activeFilter;
      const matchesAssignee = assigneeFilter === "Todos" ? true : assigneeFilter === "Sem responsável" ? !client.responsibleUserId : client.responsibleUserId === assigneeFilter;
      const matchesCritical = criticalOnly ? isCriticalClient(client) : true;
      const matchesStale = staleOnly ? isStaleClient(client) : true;
      const matchesOs = osFilter === "Todos" ? true : osFilter === "Com O.S." ? hasOpenOs(client) : !hasOpenOs(client);
      const matchesResolved = resolvedFilter === "Todos" ? true : resolvedFilter === "Resolvidos" ? client.resolved : !client.resolved;
      const matchesSearch =
        term.length === 0 ||
        client.name.toLowerCase().includes(term) ||
        sanitizePhone(client.phone).includes(term.replace(/\D/g, "")) ||
        client.description.toLowerCase().includes(term) ||
        client.assignee.toLowerCase().includes(term) ||
        client.osNumber.toLowerCase().includes(term);

      return matchesStatus && matchesAssignee && matchesCritical && matchesStale && matchesOs && matchesResolved && matchesSearch;
    });

    return sortClients(result, sortBy);
  }, [activeFilter, assigneeFilter, clients, criticalOnly, osFilter, resolvedFilter, search, sortBy, staleOnly]);

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
    setSelectedClientId(null);
    setSheetOpen(true);
  };

  const openEditSheet = (client: ClientRecord) => {
    setSheetMode("edit");
    setSelectedClientId(client.id);
    setSheetOpen(true);
  };

  const openTimeline = (client: ClientRecord) => {
    setSelectedClientId(client.id);
    setTimelineOpen(true);
  };

  const handleSave = async (values: Parameters<typeof addClient>[0]) => {
    if (sheetMode === "create") {
      return addClient(values);
    }

    if (selectedClient) {
      return updateClient(selectedClient.id, values);
    }

    return false;
  };

  const clearFilters = () => {
    const defaults = buildDefaultFilters();
    setSearchInput(defaults.search);
    setActiveFilter(defaults.activeFilter);
    setAssigneeFilter(defaults.assigneeFilter);
    setCriticalOnly(defaults.criticalOnly);
    setStaleOnly(defaults.staleOnly);
    setOsFilter(defaults.osFilter);
    setResolvedFilter(defaults.resolvedFilter);
    setSortBy(defaults.sortBy);
    setDensity(defaults.density);
  };

  const applyPreset = (label: string) => {
    const preset = viewPresets.find((item) => item.label === label);
    if (!preset) return;

    preset.action({
      setActiveFilter,
      setAssigneeFilter,
      setCriticalOnly,
      setStaleOnly,
      setOsFilter,
      setResolvedFilter,
      setSortBy,
    });
  };

  const exportCsv = () => {
    const header = ["Cliente", "Telefone", "Status", "Responsável", "Atendimentos", "Próxima ação", "O.S.", "Resolvido"];
    const rows = filteredClients.map((client) => [
      client.name,
      formatPhone(client.phone),
      client.status,
      client.assignee,
      String(client.totalServices),
      client.nextActionAt ? formatDateLabel(client.nextActionAt) : "Sem agenda",
      getOsLabel(client),
      getResolvedLabel(client),
    ]);

    const escapeCell = (value: string) => `"${String(value).replaceAll('"', '""')}"`;
    const csv = [header, ...rows].map((row) => row.map(escapeCell).join(';')).join('\n');
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `recorrenciaos-clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    await updateClientStatus(pendingStatusChange.clientId, pendingStatusChange.nextStatus);
    setPendingStatusChange(null);
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <MetricCard label="Total" value={String(stats.total)} helper="Carteira recorrente" className="col-span-2 xl:col-span-1" />
          <MetricCard label="Aguardando contato" value={String(stats.waiting)} helper="Precisa de retorno" />
          <MetricCard label="O.S. abertas" value={String(stats.os)} helper="Em andamento" />
          <MetricCard label="Resolvidos" value={String(stats.solved)} helper="Concluídos" />
          <MetricCard label="Sem retorno" value={String(stats.noReturn)} helper="Sem resposta" />
        </div>

        {staleClients.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <p className="font-medium text-amber-950">{staleClients.length} clientes sem atualização há 3 dias ou mais</p>
                <p className="mt-1 text-sm text-amber-900/80">Ative o filtro para priorizar esses casos mais antigos.</p>
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
              <div className="relative w-full lg:w-[360px] lg:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  ref={searchInputRef}
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="pl-9"
                  placeholder="Buscar por cliente, telefone, responsável ou O.S."
                />
              </div>
              <div className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600">
                {filteredClients.length} exibidos
              </div>
            </div>
            <div className="hidden flex-wrap items-center gap-2 sm:flex">
              <Button variant="outline" onClick={exportCsv}>
                <Download className="size-4" />
                Exportar CSV
              </Button>
              <Button variant="outline" onClick={() => setDensity((current) => (current === "comfortable" ? "compact" : "comfortable"))}>
                <Rows3 className="size-4" />
                {density === "comfortable" ? "Modo compacto" : "Modo confortável"}
              </Button>
              <Button onClick={openCreateSheet}>
                <Plus className="size-4" />
                Novo cliente
              </Button>
            </div>
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

          <div className="mt-4 flex flex-wrap gap-2">
            {viewPresets.map((preset) => (
              <Button key={preset.label} type="button" variant="outline" size="sm" className="rounded-full" onClick={() => applyPreset(preset.label)}>
                {preset.label}
              </Button>
            ))}
            <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-slate-600">
              Atalhos: / buscar · N novo cliente
            </Badge>
          </div>

          <div className="mt-4 grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_170px_150px_150px_150px_160px_auto]">
            <select
              value={assigneeFilter}
              onChange={(event) => setAssigneeFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="Todos">Todos os responsáveis</option>
              <option value="Sem responsável">Sem responsável</option>
              {activeAssignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </option>
              ))}
            </select>

            <select value={osFilter} onChange={(event) => setOsFilter(event.target.value as PersistedFilters["osFilter"])} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <option value="Todos">Todas as O.S.</option>
              <option value="Com O.S.">Com O.S.</option>
              <option value="Sem O.S.">Sem O.S.</option>
            </select>

            <select value={resolvedFilter} onChange={(event) => setResolvedFilter(event.target.value as PersistedFilters["resolvedFilter"])} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <option value="Todos">Todos os casos</option>
              <option value="Resolvidos">Resolvidos</option>
              <option value="Pendentes">Pendentes</option>
            </select>

            <button
              type="button"
              onClick={() => setCriticalOnly((current) => !current)}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition",
                criticalOnly ? "border-amber-300 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-600",
              )}
            >
              <Sparkles className="size-4" />
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
              <Clock3 className="size-4" />
              Sem atualização
            </button>

            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <option value="updated-desc">Mais recentes</option>
              <option value="critical-first">Críticos primeiro</option>
              <option value="services-desc">Mais recorrentes</option>
              <option value="next-action-asc">Próxima ação</option>
              <option value="name-asc">Nome A-Z</option>
            </select>

            <Button variant="ghost" className="justify-center text-slate-500" onClick={clearFilters}>
              <X className="size-4" />
              Limpar
            </Button>
          </div>

          {(activeFilter !== "Todos" || assigneeFilter !== "Todos" || criticalOnly || staleOnly || osFilter !== "Todos" || resolvedFilter !== "Todos") ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeFilter !== "Todos" ? <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">Status: {activeFilter}</Badge> : null}
              {assigneeFilter !== "Todos" ? (
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                  Responsável: {assigneeFilter === "Sem responsável" ? "Sem responsável" : activeAssignees.find((assignee) => assignee.id === assigneeFilter)?.name ?? "Equipe"}
                </Badge>
              ) : null}
              {criticalOnly ? <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">Somente críticos</Badge> : null}
              {staleOnly ? <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">Sem atualização</Badge> : null}
              {osFilter !== "Todos" ? <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{osFilter}</Badge> : null}
              {resolvedFilter !== "Todos" ? <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{resolvedFilter}</Badge> : null}
              <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{density === "compact" ? "Compacto" : "Confortável"}</Badge>
            </div>
          ) : null}

          <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white">
            <div className="hidden grid-cols-[minmax(240px,1.2fr)_180px_90px_170px_160px_140px_120px_220px] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-sm font-medium text-slate-500 lg:grid">
              <span>Cliente</span>
              <span>Telefone</span>
              <span>Atend.</span>
              <span>Status</span>
              <span>Responsável</span>
              <span>Próxima ação</span>
              <span>O.S.</span>
              <span>Ações</span>
            </div>

            <div className="space-y-0 divide-y divide-slate-200">
              {filteredClients.length === 0 ? (
                <div className="p-4">
                  <EmptyState onClear={clearFilters} onCreate={openCreateSheet} />
                </div>
              ) : (
                filteredClients.map((client) => {
                  const isCritical = isCriticalClient(client);
                  const isStale = isStaleClient(client);
                  const rowBusy = updatingClientId === client.id;

                  return (
                    <div key={client.id} className={cn("relative px-4 transition duration-200 hover:bg-slate-50/70 lg:px-6", density === "compact" ? "py-3" : "py-5", isCritical && "bg-amber-50/25")}>
                      <div className="hidden grid-cols-[minmax(240px,1.2fr)_180px_90px_170px_160px_140px_120px_220px] items-start gap-4 lg:grid">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <button type="button" className="truncate text-left font-semibold text-slate-950 transition hover:text-slate-700" onClick={() => openTimeline(client)}>
                              {client.name}
                            </button>
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
                            <a href={buildWhatsappLink(client.phone)} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full px-3")}>
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
                            disabled={rowBusy}
                            onChange={(event) => setPendingStatusChange({ clientId: client.id, nextStatus: event.target.value as ClientStatus })}
                            className={cn(
                              "h-10 w-full appearance-none rounded-full border px-4 text-sm font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-ring/50 disabled:opacity-60",
                              statusStyles[client.status],
                            )}
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          {rowBusy ? <p className="mt-2 text-xs font-medium text-slate-400">Salvando status...</p> : <p className="mt-2 text-xs text-slate-400">Alteração com confirmação</p>}
                        </div>

                        <div>
                          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            <UserRound className="size-4 text-slate-400" />
                            <span className="truncate">{client.assignee}</span>
                          </div>
                        </div>

                        <div>
                          <div className={cn("rounded-xl border px-3 py-2 text-sm", client.nextActionAt ? "border-slate-200 bg-slate-50 text-slate-700" : "border-dashed border-slate-200 bg-white text-slate-400")}>
                            {client.nextActionAt ? formatDateLabel(client.nextActionAt) : "Sem agenda"}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Badge variant="outline" className="w-fit rounded-full border-slate-200 bg-white text-slate-700">
                            {getOsLabel(client)}
                          </Badge>
                          <p className="text-xs text-slate-400">Resolvido: {getResolvedLabel(client)}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" className="rounded-full px-3" onClick={() => openTimeline(client)}>
                            <Clock3 className="size-3.5" />
                            Histórico
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-full px-3" onClick={() => openEditSheet(client)}>
                            <Pencil className="size-3.5" />
                            Editar
                          </Button>
                          <a href={`tel:${client.phone}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full px-3")}>
                            <PhoneCall className="size-3.5" />
                            Ligar
                          </a>
                        </div>
                      </div>

                      <div className="space-y-4 lg:hidden">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <button type="button" className="text-left font-semibold text-slate-950 transition hover:text-slate-700" onClick={() => openTimeline(client)}>
                                {client.name}
                              </button>
                              {isCritical ? <Badge className="bg-amber-100 text-amber-900">Crítico</Badge> : null}
                              {isStale ? <Badge className="bg-rose-100 text-rose-900">Atrasado</Badge> : null}
                            </div>
                            <p className="mt-1 text-sm text-slate-500">{formatPhone(client.phone)}</p>
                            <p className="mt-2 text-xs text-slate-400">Atualizado {formatDateLabel(client.updatedAt)}</p>
                          </div>
                          <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                            {client.totalServices}x
                          </Badge>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Responsável</p>
                            <p className="mt-1 text-sm font-medium text-slate-900">{client.assignee}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Próxima ação</p>
                            <p className="mt-1 text-sm font-medium text-slate-900">{client.nextActionAt ? formatDateLabel(client.nextActionAt) : "Sem agenda"}</p>
                          </div>
                        </div>

                        <div>
                          <select
                            aria-label={`Alterar status de ${client.name}`}
                            value={client.status}
                            disabled={rowBusy}
                            onChange={(event) => setPendingStatusChange({ clientId: client.id, nextStatus: event.target.value as ClientStatus })}
                            className={cn(
                              "h-11 w-full appearance-none rounded-2xl border px-4 text-sm font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-ring/50 disabled:opacity-60",
                              statusStyles[client.status],
                            )}
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          {rowBusy ? <p className="mt-2 text-xs font-medium text-slate-400">Salvando...</p> : <p className="mt-2 text-xs text-slate-400">Alteração com confirmação</p>}
                        </div>

                        {client.description ? <p className="text-sm leading-6 text-slate-500">{client.description}</p> : null}

                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">O.S.: {getOsLabel(client)}</div>
                          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">Resolvido: {getResolvedLabel(client)}</div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button variant="outline" className="justify-center" onClick={() => handleCopyPhone(client)}>
                            <Copy className="size-4" />
                            {copiedClientId === client.id ? "Copiado" : "Copiar telefone"}
                          </Button>
                          <a href={buildWhatsappLink(client.phone)} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }), "justify-center")}>
                            <MessageCircle className="size-4" />
                            WhatsApp
                          </a>
                          <Button variant="outline" className="justify-center" onClick={() => openTimeline(client)}>
                            <Clock3 className="size-4" />
                            Histórico
                          </Button>
                          <Button variant="outline" className="justify-center" onClick={() => openEditSheet(client)}>
                            <Pencil className="size-4" />
                            Editar
                          </Button>
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

      <ClientFormSheet
        open={sheetOpen}
        mode={sheetMode}
        client={selectedClient}
        assignees={activeAssignees}
        submitting={formSubmitting}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleSave}
      />
      <ClientTimelineSheet open={timelineOpen} client={selectedClient} onClose={() => setTimelineOpen(false)} />

      {pendingStatusChange ? (
        <div className="fixed inset-0 z-[65] flex items-end justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-white/80 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Confirmar alteração de status</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  O status será atualizado imediatamente e também vai entrar na timeline do cliente.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Novo status: <span className="font-semibold text-slate-900">{pendingStatusChange.nextStatus}</span>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setPendingStatusChange(null)} disabled={updatingClientId !== null}>
                Cancelar
              </Button>
              <Button onClick={() => void confirmStatusChange()} disabled={updatingClientId !== null}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
