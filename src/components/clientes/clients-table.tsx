"use client";

import {
  AlertTriangle,
  Plus,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ClientModal } from "@/components/clientes/client-modal";
import { ClientDrawer } from "@/components/clientes/client-drawer";
import { useClients } from "@/components/providers/clients-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatDateLabel,
  formatPhone,
  isCriticalClient,
  statusOptions,
} from "@/lib/client-helpers";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { ClientRecord, ClientStatus, ClientFormValues } from "@/types/mock";

const FILTERS_STORAGE_KEY = "recorrenciaos-client-filters-kanban";

type PersistedFilters = {
  search: string;
  statusFilter: ClientStatus | "Todos";
  assigneeFilter: string;
};

const defaultFilters: PersistedFilters = {
  search: "",
  statusFilter: "Todos",
  assigneeFilter: "Todos",
};

export function ClientsTable() {
  const { clients, stats, addClient, updateClient, updateClientStatus, formSubmitting, assignees } = useClients();

  const [searchInput, setSearchInput] = useState(defaultFilters.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "Todos">(defaultFilters.statusFilter);
  const [assigneeFilter, setAssigneeFilter] = useState(defaultFilters.assigneeFilter);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClient, setDrawerClient] = useState<ClientRecord | null>(null);

  // Persist filters
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(FILTERS_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<PersistedFilters>;
      setSearchInput(parsed.search ?? defaultFilters.search);
      setStatusFilter(parsed.statusFilter ?? defaultFilters.statusFilter);
      setAssigneeFilter(parsed.assigneeFilter ?? defaultFilters.assigneeFilter);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const payload: PersistedFilters = {
      search: searchInput,
      statusFilter,
      assigneeFilter,
    };
    window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(payload));
  }, [searchInput, statusFilter, assigneeFilter]);

  const filteredClients = useMemo(() => {
    let result = [...clients];

    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.phone.includes(term) ||
          c.description?.toLowerCase().includes(term) ||
          c.assignee.toLowerCase().includes(term),
      );
    }

    if (statusFilter !== "Todos") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (assigneeFilter !== "Todos") {
      result = result.filter((c) => c.assignee === assigneeFilter);
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [clients, debouncedSearch, statusFilter, assigneeFilter]);

  const columns = useMemo(
    () =>
      statusOptions.map((status) => ({
        status,
        items: filteredClients.filter((c) => c.status === status),
      })),
    [filteredClients],
  );

  const handleCreateClient = () => {
    setSelectedClient(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const handleEditClient = (client: ClientRecord) => {
    setSelectedClient(client);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleOpenDrawer = (client: ClientRecord) => {
    setDrawerClient(client);
    setDrawerOpen(true);
  };

  const handleModalSubmit = async (values: ClientFormValues) => {
    if (modalMode === "create") {
      await addClient(values);
    } else if (selectedClient) {
      await updateClient(selectedClient.id, values);
    }
  };

  const handleStatusChange = async (clientId: string, newStatus: ClientStatus) => {
    await updateClientStatus(clientId, newStatus);
  };

  const assigneeOptions = useMemo(() => {
    return Array.from(new Set(assignees.map((a) => (typeof a === "string" ? a : a.name)).filter(Boolean))).sort();
  }, [assignees]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="overflow-hidden rounded-[26px] border-none">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Total
              </p>
              <div className="flex size-9 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                <span className="size-2 rounded-full bg-blue-600" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
              {stats.total}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[26px] border-none">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Críticos
              </p>
              <div className="flex size-9 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                <span className="size-2 rounded-full bg-amber-600" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
              {stats.critical}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[26px] border-none">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Com O.S.
              </p>
              <div className="flex size-9 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-900/30">
                <span className="size-2 rounded-full bg-sky-600" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
              {stats.os}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[26px] border-none">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Resolvidos
              </p>
              <div className="flex size-9 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900/30">
                <span className="size-2 rounded-full bg-slate-600" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
              {stats.solved}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Action */}
      <div className="surface-card section-shell overflow-hidden rounded-[28px] p-4 sm:p-5">
        <div className="grid gap-3 xl:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="pl-9"
              placeholder="Buscar por cliente, descrição ou responsável"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ClientStatus | "Todos")}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-ring/70 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="Todos">Todos os status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-4 focus-visible:ring-ring/70 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="Todos">Todos os responsáveis</option>
            {assigneeOptions.map((assignee) => (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={handleCreateClient} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => (
          <div
            key={column.status}
            className="surface-card flex min-h-[420px] flex-col rounded-[30px] p-4"
          >
            {/* Column Header */}
            <div className="mb-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">
                    {column.status}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {column.items.length} cliente{column.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Badge variant="outline">{column.items.length}</Badge>
              </div>
            </div>

            {/* Cards */}
            <div className="grid-fade-mask space-y-3">
              {column.items.length === 0 ? (
                <div className="flex min-h-[190px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                  <AlertTriangle className="mb-3 size-5 text-slate-400 dark:text-slate-500" />
                  Nenhum cliente neste estágio com o filtro atual.
                </div>
              ) : (
                column.items.map((item) => {
                  const critical = isCriticalClient(item);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenDrawer(item)}
                      className="surface-muted hover-lift rounded-[26px] p-4 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-medium text-slate-950 dark:text-slate-50">
                              {item.name}
                            </p>
                            {critical && (
                              <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300">
                                Crítico
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {formatPhone(item.phone)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <span>{item.totalServices} atendimento{item.totalServices !== 1 ? "s" : ""}</span>
                        <span>{formatDateLabel(item.updatedAt)}</span>
                      </div>

                      {item.description && (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-2 dark:border-slate-700">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {item.assignee}
                        </span>
                        {item.osOpen && (
                          <Badge className="text-xs bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300">
                            O.S. Aberta
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <ClientModal
        open={modalOpen}
        mode={modalMode}
        client={selectedClient || undefined}
        assignees={assigneeOptions}
        submitting={formSubmitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      {/* Drawer */}
      <ClientDrawer
        open={drawerOpen}
        client={drawerClient}
        onClose={() => setDrawerOpen(false)}
        onEdit={(client: ClientRecord) => {
          handleEditClient(client);
          setDrawerOpen(false);
        }}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
