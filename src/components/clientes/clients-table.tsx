"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  Filter,
  LayoutGrid,
  List,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ClientFormSheet } from "@/components/clientes/client-form-sheet";
import { ClientTimelineSheet } from "@/components/clientes/client-timeline-sheet";
import { useClients } from "@/components/providers/clients-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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

const FILTERS_STORAGE_KEY = "recorrenciaos-client-filters-v50";

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

function MetricCard({ label, value, helper, accent = "blue" }: { label: string; value: string; helper?: string; accent?: string }) {
  const accentClasses: Record<string, string> = {
    blue: "stat-accent-blue",
    emerald: "stat-accent-emerald",
    amber: "stat-accent-amber",
    rose: "stat-accent-rose",
    violet: "stat-accent-violet",
  };

  return (
    <Card className="surface-card overflow-hidden rounded-[24px] border-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
          <div className={cn("size-2 rounded-full", accentClasses[accent])} />
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{value}</p>
        {helper ? <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6 animate-enter">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-32 rounded-[24px]" />
        ))}
      </div>
      <div className="skeleton-shimmer h-[500px] rounded-[30px]" />
    </div>
  );
}

export function ClientsTable() {
  const { clients, stats, loading, updateClientStatus, updateClient, addClient, updatingClientId, assignees } = useClients();
  const { pushToast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchInput, 300);
  const [activeFilter, setActiveFilter] = useState<PersistedFilters["activeFilter"]>("Todos");
  const [assigneeFilter, setAssigneeFilter] = useState("Todos");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [staleOnly, setStaleOnly] = useState(false);
  const [osFilter, setOsFilter] = useState<PersistedFilters["osFilter"]>("Todos");
  const [resolvedFilter, setResolvedFilter] = useState<PersistedFilters["resolvedFilter"]>("Todos");
  const [sortBy, setSortBy] = useState<SortOption>("updated-desc");
  const [density, setDensity] = useState<PersistedFilters["density"]>("comfortable");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ clientId: string; nextStatus: ClientStatus } | null>(null);

  const filteredClients = useMemo(() => {
    let result = [...clients];

    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(term) || c.phone.includes(term) || c.description?.toLowerCase().includes(term));
    }

    if (activeFilter !== "Todos") {
      result = result.filter((c) => c.status === activeFilter);
    }

    if (assigneeFilter !== "Todos") {
      result = result.filter((c) => c.assignee === assigneeFilter);
    }

    if (criticalOnly) {
      result = result.filter((c) => isCriticalClient(c));
    }

    if (staleOnly) {
      result = result.filter((c) => isStaleClient(c));
    }

    if (osFilter === "Com O.S.") result = result.filter((c) => c.osOpen);
    if (osFilter === "Sem O.S.") result = result.filter((c) => !c.osOpen);

    if (resolvedFilter === "Resolvidos") result = result.filter((c) => c.resolved);
    if (resolvedFilter === "Pendentes") result = result.filter((c) => !c.resolved);

    result.sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "services-desc") return b.totalServices - a.totalServices;
      if (sortBy === "next-action-asc") {
        const aTime = a.nextActionAt ? new Date(a.nextActionAt).getTime() : Infinity;
        const bTime = b.nextActionAt ? new Date(b.nextActionAt).getTime() : Infinity;
        return aTime - bTime;
      }
      if (sortBy === "critical-first") {
        const aCrit = isCriticalClient(a) ? 1 : 0;
        const bCrit = isCriticalClient(b) ? 1 : 0;
        return bCrit - aCrit;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  }, [clients, debouncedSearch, activeFilter, assigneeFilter, criticalOnly, staleOnly, osFilter, resolvedFilter, sortBy]);

  const handleCopyPhone = (client: ClientRecord) => {
    navigator.clipboard.writeText(client.phone);
    setCopiedClientId(client.id);
    setTimeout(() => setCopiedClientId(null), 2000);
    pushToast({ tone: "success", title: "Copiado!", description: "Telefone copiado para a área de transferência." });
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

  const openTimeline = (client: ClientRecord) => {
    setSelectedClient(client);
    setTimelineOpen(true);
  };

  const handleSave = async (values: ClientFormValues): Promise<boolean> => {
    setFormSubmitting(true);
    try {
      let success = false;
      if (sheetMode === "create") {
        success = await addClient(values);
        if (success) pushToast({ tone: "success", title: "Cliente criado", description: "O novo cliente foi adicionado à carteira." });
      } else if (selectedClient) {
        success = await updateClient(selectedClient.id, values);
        if (success) pushToast({ tone: "success", title: "Cliente atualizado", description: "As alterações foram salvas com sucesso." });
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
    pushToast({ tone: "success", title: "Status atualizado", description: `O cliente agora está como ${pendingStatusChange.nextStatus}.` });
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6 animate-enter">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <MetricCard label="Total" value={String(stats.total)} helper="Carteira completa" accent="blue" />
        <MetricCard label="Aguardando" value={String(stats.waiting)} helper="Precisa de contato" accent="amber" />
        <MetricCard label="O.S. Aberta" value={String(stats.os)} helper="Em andamento" accent="violet" />
        <MetricCard label="Resolvidos" value={String(stats.solved)} helper="Ciclo concluído" accent="emerald" />
        <MetricCard label="Sem Retorno" value={String(stats.noReturn)} helper="Aguardando resposta" accent="rose" />
      </div>

      {/* Main Content Area */}
      <div className="surface-card rounded-[32px] border-none p-1 shadow-premium">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          {/* Filters Sidebar (Desktop) */}
          <div className="w-full border-b border-slate-100 p-6 lg:w-72 lg:border-b-0 lg:border-r dark:border-slate-800/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Filtros</h3>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setSearchInput("")}>
                Limpar
              </Button>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 h-10 rounded-xl border-slate-200/60 bg-slate-50/50 focus:bg-white dark:bg-slate-800/40 dark:border-slate-700/40"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickFilters.map((f) => (
                    <button
                      key={f.label}
                      onClick={() => setActiveFilter(f.value)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                        activeFilter === f.value
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">Responsável</p>
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200/60 bg-slate-50/50 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-slate-800/40 dark:border-slate-700/40"
                >
                  <option value="Todos">Todos os responsáveis</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn(
                    "size-5 rounded border transition-all flex items-center justify-center",
                    criticalOnly ? "bg-amber-500 border-amber-500" : "border-slate-300 dark:border-slate-600"
                  )}>
                    {criticalOnly && <CheckCircle2 className="size-3.5 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={criticalOnly} onChange={(e) => setCriticalOnly(e.target.checked)} />
                  <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Apenas críticos</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn(
                    "size-5 rounded border transition-all flex items-center justify-center",
                    staleOnly ? "bg-rose-500 border-rose-500" : "border-slate-300 dark:border-slate-600"
                  )}>
                    {staleOnly && <CheckCircle2 className="size-3.5 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={staleOnly} onChange={(e) => setStaleOnly(e.target.checked)} />
                  <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Apenas atrasados</span>
                </label>
              </div>
            </div>
          </div>

          {/* Table Area */}
          <div className="flex-1 p-0 lg:p-2">
            <div className="bg-white dark:bg-slate-900/50 rounded-[28px] h-full flex flex-col">
              {/* Table Header Actions */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-lg px-2 py-1 font-bold text-indigo-600 dark:text-indigo-400">
                    {filteredClients.length}
                  </Badge>
                  <span className="text-sm font-medium text-slate-500">Clientes na visão</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-9 rounded-xl hidden sm:flex" onClick={openCreateSheet}>
                    <Plus className="size-4" />
                    Novo Cliente
                  </Button>
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => setDensity("comfortable")}
                      className={cn("p-1.5 rounded-lg transition-all", density === "comfortable" ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-400")}
                    >
                      <LayoutGrid className="size-4" />
                    </button>
                    <button
                      onClick={() => setDensity("compact")}
                      className={cn("p-1.5 rounded-lg transition-all", density === "compact" ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-400")}
                    >
                      <List className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Content */}
              <div className="flex-1 overflow-auto custom-scrollbar max-h-[700px]">
                {filteredClients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <div className="size-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <Search className="size-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nenhum resultado</h3>
                    <p className="text-sm text-slate-500 max-w-xs mt-1">Tente ajustar seus filtros ou busca para encontrar o que procura.</p>
                    <Button variant="outline" className="mt-6 rounded-xl" onClick={() => setSearchInput("")}>Limpar busca</Button>
                  </div>
                ) : (
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/50">Cliente</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/50">Status</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/50 hidden md:table-cell">Responsável</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/50 hidden lg:table-cell">Próxima Ação</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/50 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                      {filteredClients.map((client) => {
                        const isCrit = isCriticalClient(client);
                        const isStale = isStaleClient(client);

                        return (
                          <tr key={client.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
                                  {client.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => openTimeline(client)}
                                      className="font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
                                    >
                                      {client.name}
                                    </button>
                                    {isCrit && <span className="size-2 rounded-full bg-amber-500 animate-pulse" title="Crítico" />}
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{formatPhone(client.phone)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={client.status}
                                onChange={(e) => setPendingStatusChange({ clientId: client.id, nextStatus: e.target.value as ClientStatus })}
                                className={cn(
                                  "text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border-none outline-none cursor-pointer transition-all",
                                  statusStyles[client.status]
                                )}
                              >
                                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <UserRound className="size-3.5 opacity-50" />
                                {client.assignee}
                              </div>
                            </td>
                            <td className="px-6 py-4 hidden lg:table-cell">
                              <div className={cn(
                                "text-xs font-medium px-2.5 py-1 rounded-lg w-fit",
                                client.nextActionAt
                                  ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  : "bg-slate-50 text-slate-400 border border-dashed border-slate-200 dark:bg-transparent dark:border-slate-700"
                              )}>
                                {client.nextActionAt ? formatDateLabel(client.nextActionAt) : "Não agendado"}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                  onClick={() => handleCopyPhone(client)}
                                  title="Copiar telefone"
                                >
                                  <Copy className="size-4" />
                                </Button>
                                <a
                                  href={buildWhatsappLink(client.phone)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20")}
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="size-4" />
                                </a>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                  onClick={() => openEditSheet(client)}
                                  title="Editar"
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
            </div>
          </div>
        </div>
      </div>

      {/* Sheets & Modals */}
      <ClientFormSheet
        open={sheetOpen}
        mode={sheetMode}
        client={selectedClient}
        assignees={assignees}
        submitting={formSubmitting}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleSave}
      />
      <ClientTimelineSheet open={timelineOpen} client={selectedClient} onClose={() => setTimelineOpen(false)} />

      {/* Status Change Confirmation Modal */}
      {pendingStatusChange && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="surface-card w-full max-w-md rounded-[32px] p-8 animate-scale-in border-none shadow-2xl">
            <div className="size-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 mb-6">
              <AlertTriangle className="size-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Confirmar alteração?</h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400 leading-relaxed">
              Você está alterando o status para <span className="font-bold text-slate-900 dark:text-slate-100">{pendingStatusChange.nextStatus}</span>. Esta ação será registrada no histórico do cliente.
            </p>
            <div className="mt-8 flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-2xl" onClick={() => setPendingStatusChange(null)}>
                Cancelar
              </Button>
              <Button className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white" onClick={confirmStatusChange}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
