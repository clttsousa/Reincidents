"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { buildStats, isCriticalClient, isStaleClient, normalizeClientPayload } from "@/lib/client-helpers";
import { createClient } from "@/lib/supabase/client";
import type { AssigneeOption, ClientFormValues, ClientRecord, ClientStats, ClientStatus, ClientTimelineEntry } from "@/types/mock";
import { useToast } from "@/components/providers/toast-provider";
import {
  buildTimelineEntries,
  fetchClientPage,
  fetchClientStats,
  fetchClients,
  fetchProfiles,
  mapRowToRecord,
  sortClients,
  type ClientListQuery,
  type ClientRow,
} from "@/lib/services/client-service";

interface ClientsContextValue {
  clients: ClientRecord[];
  stats: ClientStats;
  topRecurring: ClientRecord[];
  staleClients: ClientRecord[];
  assignees: AssigneeOption[];
  loading: boolean;
  listRefreshing: boolean;
  formSubmitting: boolean;
  updatingClientId: string | null;
  errorMessage: string | null;
  staleData: boolean;
  totalClients: number;
  totalPages: number;
  page: number;
  pageSize: number;
  isQueryMode: boolean;
  applyListQuery: (payload: Partial<ClientListQuery>) => void;
  setPage: (page: number) => void;
  refreshClients: () => Promise<void>;
  addClient: (values: ClientFormValues) => Promise<boolean>;
  updateClient: (clientId: string, values: ClientFormValues) => Promise<boolean>;
  updateClientStatus: (clientId: string, status: ClientStatus) => Promise<boolean>;
  fetchClientTimeline: (clientId: string) => Promise<ClientTimelineEntry[]>;
  addClientNote: (clientId: string, note: string) => Promise<boolean>;
  registerContactAttempt: (clientId: string, payload: { description: string; nextActionAt?: string }) => Promise<boolean>;
}

interface ClientsProviderProps {
  children: ReactNode;
  mode?: "full" | "query";
  pageSize?: number;
}

const STORAGE_KEY = "recorrenciaos-clients-v58";
const supabaseEnabled = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const allowClientCache = process.env.NODE_ENV !== "production";

const defaultListQuery = (pageSize: number): ClientListQuery => ({
  search: "",
  activeFilter: "Todos",
  assigneeFilter: "Todos",
  criticalOnly: false,
  staleOnly: false,
  osFilter: "Todos",
  resolvedFilter: "Todos",
  sortBy: "updated-desc",
  page: 1,
  pageSize,
});

const ClientsContext = createContext<ClientsContextValue | null>(null);

function readCachedClients() {
  try {
    const cached = window.localStorage.getItem(STORAGE_KEY);
    if (!cached) return [];
    const parsed = JSON.parse(cached) as ClientRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function applyLocalQuery(clients: ClientRecord[], input: ClientListQuery) {
  let result = [...clients];

  if (input.search.trim()) {
    const term = input.search.trim().toLowerCase();
    result = result.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.phone.includes(term.replace(/\D/g, "")) ||
        client.description.toLowerCase().includes(term) ||
        client.assignee.toLowerCase().includes(term) ||
        client.osNumber.toLowerCase().includes(term),
    );
  }

  if (input.activeFilter !== "Todos") result = result.filter((client) => client.status === input.activeFilter);
  if (input.assigneeFilter !== "Todos") result = result.filter((client) => client.assignee === input.assigneeFilter);
  if (input.criticalOnly) result = result.filter((client) => isCriticalClient(client));
  if (input.staleOnly) result = result.filter((client) => isStaleClient(client));
  if (input.osFilter === "Com O.S.") result = result.filter((client) => client.osOpen);
  if (input.osFilter === "Sem O.S.") result = result.filter((client) => !client.osOpen);
  if (input.resolvedFilter === "Resolvidos") result = result.filter((client) => client.resolved);
  if (input.resolvedFilter === "Pendentes") result = result.filter((client) => !client.resolved);

  result.sort((a, b) => {
    if (input.sortBy === "name-asc") return a.name.localeCompare(b.name, "pt-BR");
    if (input.sortBy === "services-desc") return b.totalServices - a.totalServices || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (input.sortBy === "next-action-asc") {
      const aTime = a.nextActionAt ? new Date(a.nextActionAt).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.nextActionAt ? new Date(b.nextActionAt).getTime() : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    }
    if (input.sortBy === "critical-first") {
      return Number(isCriticalClient(b)) - Number(isCriticalClient(a)) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const total = result.length;
  const from = Math.max((input.page - 1) * input.pageSize, 0);
  const to = from + input.pageSize;

  return {
    items: result.slice(from, to),
    total,
    stats: buildStats(clients),
  };
}

export function ClientsProvider({ children, mode = "full", pageSize = 20 }: ClientsProviderProps) {
  const { pushToast } = useToast();
  const isQueryMode = mode === "query";

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [updatingClientId, setUpdatingClientId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [staleData, setStaleData] = useState(false);
  const [stats, setStats] = useState<ClientStats>({ total: 0, waiting: 0, os: 0, solved: 0, noReturn: 0, critical: 0, stale: 0 });
  const [totalClients, setTotalClients] = useState(0);
  const [listQuery, setListQuery] = useState<ClientListQuery>(defaultListQuery(pageSize));
  const [bootstrapped, setBootstrapped] = useState(false);
  const previousQueryRef = useRef(JSON.stringify(defaultListQuery(pageSize)));

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalClients / listQuery.pageSize)), [totalClients, listQuery.pageSize]);

  const persistClients = useCallback((records: ClientRecord[]) => {
    if (!allowClientCache && supabaseEnabled) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, []);

  const loadFullMode = useCallback(async () => {
    const supabase = createClient();
    const [{ data: authData }, profiles] = await Promise.all([supabase.auth.getUser(), fetchProfiles(supabase)]);
    const rows = await fetchClients(supabase, profiles);

    setCurrentUserId(authData.user?.id ?? null);
    setAssignees(profiles);
    setClients(rows);
    setStats(buildStats(rows));
    setTotalClients(rows.length);
    persistClients(rows);
    setErrorMessage(null);
    setStaleData(false);
  }, [persistClients]);

  const loadQueryMode = useCallback(
    async (input: ClientListQuery, isInitialLoad = false) => {
      const supabase = createClient();
      const runWithLoading = isInitialLoad ? setLoading : setListRefreshing;
      runWithLoading(true);

      try {
        const [authResponse, resolvedProfiles, nextStats] = await Promise.all([
          currentUserId ? Promise.resolve({ user: { id: currentUserId } }) : supabase.auth.getUser().then((response) => response.data),
          assignees.length > 0 ? Promise.resolve(assignees) : fetchProfiles(supabase),
          fetchClientStats(supabase),
        ] as const);

        const page = await fetchClientPage(supabase, resolvedProfiles, input);

        setCurrentUserId(authResponse.user?.id ?? null);
        setAssignees(resolvedProfiles);
        setClients(page.items);
        setStats(nextStats);
        setTotalClients(page.total);
        setErrorMessage(null);
        setStaleData(false);
        persistClients(page.items);
      } catch (error) {
        const cachedClients = readCachedClients();
        if ((!supabaseEnabled || allowClientCache) && cachedClients.length > 0) {
          const fallback = applyLocalQuery(cachedClients, input);
          setClients(fallback.items);
          setStats(fallback.stats);
          setTotalClients(fallback.total);
          setStaleData(Boolean(supabaseEnabled));
          setErrorMessage(
            supabaseEnabled
              ? "Não foi possível atualizar a carteira agora. Exibindo a última visão em cache do navegador."
              : "Supabase não configurado. Usando dados locais para desenvolvimento.",
          );
        } else {
          setClients([]);
          setStats({ total: 0, waiting: 0, os: 0, solved: 0, noReturn: 0, critical: 0, stale: 0 });
          setTotalClients(0);
          setStaleData(false);
          setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar a carteira agora.");
        }
      } finally {
        runWithLoading(false);
      }
    },
    [allowClientCache, assignees, currentUserId, persistClients],
  );

  const refreshClients = useCallback(async () => {
    if (isQueryMode) {
      await loadQueryMode(listQuery, false);
      return;
    }

    setListRefreshing(true);
    try {
      if (supabaseEnabled) {
        await loadFullMode();
        return;
      }

      const cached = readCachedClients();
      setClients(sortClients(cached));
      setStats(buildStats(cached));
      setTotalClients(cached.length);
      setErrorMessage(null);
      setStaleData(false);
    } catch (error) {
      const cached = readCachedClients();
      if (cached.length > 0 && allowClientCache) {
        setClients(sortClients(cached));
        setStats(buildStats(cached));
        setTotalClients(cached.length);
        setStaleData(true);
        setErrorMessage("A atualização falhou. Exibindo a última carteira disponível neste navegador.");
      } else {
        setErrorMessage(error instanceof Error ? error.message : "Não foi possível atualizar a carteira agora.");
      }
    } finally {
      setListRefreshing(false);
    }
  }, [allowClientCache, isQueryMode, listQuery, loadFullMode, loadQueryMode]);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        if (isQueryMode) {
          await loadQueryMode(listQuery, true);
          return;
        }

        if (supabaseEnabled) {
          await loadFullMode();
          return;
        }

        const cached = readCachedClients();
        if (!active) return;
        setClients(sortClients(cached));
        setStats(buildStats(cached));
        setTotalClients(cached.length);
        setErrorMessage(null);
        setStaleData(false);
      } catch (error) {
        if (!active) return;
        const cached = readCachedClients();
        if (cached.length > 0 && allowClientCache) {
          setClients(sortClients(cached));
          setStats(buildStats(cached));
          setTotalClients(cached.length);
          setStaleData(Boolean(supabaseEnabled));
          setErrorMessage(
            supabaseEnabled
              ? "Falha ao sincronizar com o Supabase. Exibindo dados locais apenas para evitar perda de contexto na sessão."
              : "Supabase não configurado. Usando dados locais para desenvolvimento.",
          );
        } else {
          setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar a carteira agora.");
        }
      } finally {
        if (active) {
          setLoading(false);
          setBootstrapped(true);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [isQueryMode]);

  useEffect(() => {
    if (!isQueryMode || !bootstrapped) return;
    const serialized = JSON.stringify(listQuery);
    if (serialized === previousQueryRef.current) return;
    previousQueryRef.current = serialized;
    void loadQueryMode(listQuery, false);
  }, [bootstrapped, isQueryMode, listQuery, loadQueryMode]);

  useEffect(() => {
    if (isQueryMode) return;
    if (!allowClientCache && supabaseEnabled) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }, [allowClientCache, clients, isQueryMode]);

  async function insertHistory(clientId: string, action: string, input?: { fromStatus?: ClientStatus; toStatus?: ClientStatus; description?: string }) {
    if (!supabaseEnabled) return;

    const supabase = createClient();
    await supabase.from("client_history").insert({
      client_id: clientId,
      actor_id: currentUserId,
      action,
      status_from: input?.fromStatus ?? null,
      status_to: input?.toStatus ?? null,
      description: input?.description ?? null,
    });
  }

  async function insertNote(clientId: string, note: string) {
    if (!supabaseEnabled || !note.trim()) return;
    const supabase = createClient();
    await supabase.from("client_notes").insert({
      client_id: clientId,
      author_id: currentUserId,
      note: note.trim(),
    });
  }

  const value = useMemo<ClientsContextValue>(() => {
    const ordered = isQueryMode ? clients : sortClients(clients);

    return {
      clients: ordered,
      stats,
      topRecurring: [...ordered].sort((a, b) => b.totalServices - a.totalServices).slice(0, 5),
      staleClients: ordered.filter((client) => {
        const diff = Date.now() - new Date(client.updatedAt).getTime();
        return diff / 86400000 >= 3;
      }),
      assignees,
      loading,
      listRefreshing,
      formSubmitting,
      updatingClientId,
      errorMessage,
      staleData,
      totalClients,
      totalPages,
      page: listQuery.page,
      pageSize: listQuery.pageSize,
      isQueryMode,
      applyListQuery(payload) {
        setListQuery((current) => {
          const next = { ...current, ...payload };
          return { ...next, page: payload.page ?? (payload.search !== undefined || payload.activeFilter !== undefined || payload.assigneeFilter !== undefined || payload.criticalOnly !== undefined || payload.staleOnly !== undefined || payload.osFilter !== undefined || payload.resolvedFilter !== undefined || payload.sortBy !== undefined ? 1 : next.page) };
        });
      },
      setPage(nextPage) {
        setListQuery((current) => ({ ...current, page: Math.max(1, nextPage) }));
      },
      refreshClients,
      async addClient(values) {
        const payload = normalizeClientPayload(values, assignees);
        setFormSubmitting(true);

        if (!supabaseEnabled) {
          const now = new Date().toISOString();
          const localRecord: ClientRecord = {
            id: `local-${Date.now()}`,
            ...payload,
            responsibleUserId: payload.responsibleUserId || null,
            updatedAt: now,
            lastContactAt: payload.lastContactAt || "",
            nextActionAt: payload.nextActionAt || "",
          };
          const nextClients = sortClients([localRecord, ...clients]);
          setClients(isQueryMode ? applyLocalQuery(nextClients, { ...listQuery, page: 1 }).items : nextClients);
          setStats(buildStats(nextClients));
          setTotalClients(nextClients.length);
          persistClients(nextClients);
          pushToast({ tone: "success", title: "Cliente adicionado", description: "O cadastro foi salvo no modo local." });
          setFormSubmitting(false);
          return true;
        }

        const supabase = createClient();
        const { data, error } = await supabase
          .from("clients")
          .insert({
            name: payload.name,
            phone: payload.phone,
            total_services: payload.totalServices,
            description: payload.description,
            status: payload.status,
            responsible_user_id: payload.responsibleUserId || null,
            responsible_name: payload.assignee,
            os_open: payload.osOpen,
            os_number: payload.osNumber || null,
            resolved: payload.resolved,
            notes: payload.notes || null,
            created_by: currentUserId,
            updated_by: currentUserId,
            last_contact_at: payload.lastContactAt || null,
            next_action_at: payload.nextActionAt || null,
          })
          .select("id, name, phone, total_services, description, status, responsible_user_id, responsible_name, os_open, os_number, resolved, notes, updated_at, last_contact_at, next_action_at")
          .single();

        if (error) {
          pushToast({ tone: "error", title: "Não foi possível cadastrar", description: error.message });
          setFormSubmitting(false);
          return false;
        }

        const inserted = mapRowToRecord(data as ClientRow, assignees);
        if (isQueryMode) {
          setListQuery((current) => ({ ...current, page: 1 }));
        }
        void refreshClients();
        await insertHistory(inserted.id, "created", { toStatus: inserted.status, description: "Cliente cadastrado no painel." });
        if (payload.notes) {
          await insertNote(inserted.id, payload.notes);
          await insertHistory(inserted.id, "note_added", { description: "Observação inicial registrada no cadastro." });
        }
        pushToast({ tone: "success", title: "Cliente cadastrado", description: `${inserted.name} entrou na carteira recorrente.` });
        setFormSubmitting(false);
        return true;
      },
      async updateClient(clientId, values) {
        const payload = normalizeClientPayload(values, assignees);
        const currentClient = ordered.find((client) => client.id === clientId);
        if (!currentClient) return false;

        setFormSubmitting(true);

        if (!supabaseEnabled) {
          const optimisticClient: ClientRecord = {
            ...currentClient,
            ...payload,
            responsibleUserId: payload.responsibleUserId || null,
            updatedAt: new Date().toISOString(),
            lastContactAt: payload.lastContactAt || currentClient.lastContactAt,
            nextActionAt: payload.nextActionAt || currentClient.nextActionAt,
          };
          const nextClients = sortClients(clients.map((client) => (client.id === clientId ? optimisticClient : client)));
          setClients(nextClients);
          setStats(buildStats(nextClients));
          persistClients(nextClients);
          pushToast({ tone: "success", title: "Cadastro atualizado", description: "Alterações salvas no modo local." });
          setFormSubmitting(false);
          return true;
        }

        const supabase = createClient();
        const { error } = await supabase
          .from("clients")
          .update({
            name: payload.name,
            phone: payload.phone,
            total_services: payload.totalServices,
            description: payload.description,
            status: payload.status,
            responsible_user_id: payload.responsibleUserId || null,
            responsible_name: payload.assignee,
            os_open: payload.osOpen,
            os_number: payload.osNumber || null,
            resolved: payload.resolved,
            notes: payload.notes || null,
            updated_by: currentUserId,
            updated_at: new Date().toISOString(),
            last_contact_at: payload.lastContactAt || null,
            next_action_at: payload.nextActionAt || null,
          })
          .eq("id", clientId);

        if (error) {
          pushToast({ tone: "error", title: "Falha ao atualizar", description: error.message });
          setFormSubmitting(false);
          return false;
        }

        await insertHistory(clientId, "updated", {
          fromStatus: currentClient.status,
          toStatus: payload.status,
          description: "Cadastro atualizado no formulário rápido.",
        });

        if (currentClient.status !== payload.status) {
          await insertHistory(clientId, "status_changed", {
            fromStatus: currentClient.status,
            toStatus: payload.status,
            description: "Status alterado ao editar o cadastro.",
          });
        }

        if (currentClient.responsibleUserId !== payload.responsibleUserId) {
          await insertHistory(clientId, "responsible_changed", {
            description: `Responsável alterado para ${payload.assignee}.`,
          });
        }

        if (payload.notes && payload.notes !== currentClient.notes) {
          await insertNote(clientId, payload.notes);
          await insertHistory(clientId, "note_added", { description: "Nova observação registrada no cadastro." });
        }

        void refreshClients();

        pushToast({ tone: "success", title: "Cliente atualizado", description: `${payload.name} foi atualizado com sucesso.` });
        setFormSubmitting(false);
        return true;
      },
      async updateClientStatus(clientId, status) {
        const currentClient = ordered.find((client) => client.id === clientId);
        if (!currentClient) return false;

        const resolved = status === "Resolvido";
        const osOpen = status === "O.S. aberta";

        setUpdatingClientId(clientId);

        if (!supabaseEnabled) {
          const nextClients = sortClients(
            clients.map((client) =>
              client.id === clientId
                ? { ...client, status, resolved, osOpen, updatedAt: new Date().toISOString() }
                : client,
            ),
          );
          setClients(nextClients);
          setStats(buildStats(nextClients));
          persistClients(nextClients);
          pushToast({ tone: "success", title: "Status atualizado", description: `${currentClient.name} agora está em ${status}.` });
          setUpdatingClientId(null);
          return true;
        }

        const supabase = createClient();
        const { error } = await supabase
          .from("clients")
          .update({
            status,
            resolved,
            os_open: osOpen,
            os_number: currentClient.osNumber || null,
            updated_by: currentUserId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", clientId);

        if (error) {
          pushToast({ tone: "error", title: "Falha ao alterar status", description: error.message });
          setUpdatingClientId(null);
          return false;
        }

        await insertHistory(clientId, "status_changed", {
          fromStatus: currentClient.status,
          toStatus: status,
          description: "Status alterado diretamente pela tabela.",
        });
        void refreshClients();
        pushToast({ tone: "success", title: "Status atualizado", description: `${currentClient.name} agora está em ${status}.` });
        setUpdatingClientId(null);
        return true;
      },
      async fetchClientTimeline(clientId) {
        if (!supabaseEnabled) return [];

        const supabase = createClient();
        return buildTimelineEntries(supabase, clientId);
      },
      async addClientNote(clientId, note) {
        const client = ordered.find((item) => item.id === clientId);
        if (!client) return false;

        const trimmed = note.trim();
        if (!trimmed) {
          pushToast({ tone: "error", title: "Nota vazia", description: "Escreva uma observação antes de salvar." });
          return false;
        }

        setUpdatingClientId(clientId);

        if (!supabaseEnabled) {
          const nextClients = sortClients(clients.map((item) => (item.id === clientId ? { ...item, notes: trimmed, updatedAt: new Date().toISOString() } : item)));
          setClients(nextClients);
          setStats(buildStats(nextClients));
          persistClients(nextClients);
          pushToast({ tone: "success", title: "Nota registrada", description: `Observação adicionada em ${client.name}.` });
          setUpdatingClientId(null);
          return true;
        }

        const supabase = createClient();
        const { error } = await supabase
          .from("clients")
          .update({ notes: trimmed, updated_by: currentUserId, updated_at: new Date().toISOString() })
          .eq("id", clientId);

        if (error) {
          pushToast({ tone: "error", title: "Falha ao adicionar nota", description: error.message });
          setUpdatingClientId(null);
          return false;
        }

        await insertNote(clientId, trimmed);
        await insertHistory(clientId, "note_added", { description: trimmed });
        void refreshClients();
        pushToast({ tone: "success", title: "Nota registrada", description: `Observação adicionada em ${client.name}.` });
        setUpdatingClientId(null);
        return true;
      },
      async registerContactAttempt(clientId, payload) {
        const client = ordered.find((item) => item.id === clientId);
        if (!client) return false;

        const lastContactAt = new Date().toISOString();
        const nextActionAt = payload.nextActionAt ?? client.nextActionAt;
        const description = payload.description.trim();

        setUpdatingClientId(clientId);

        if (!supabaseEnabled) {
          const nextClients = sortClients(
            clients.map((item) => (item.id === clientId ? { ...item, lastContactAt, nextActionAt, updatedAt: lastContactAt, notes: description || item.notes } : item)),
          );
          setClients(nextClients);
          setStats(buildStats(nextClients));
          persistClients(nextClients);
          pushToast({ tone: "success", title: "Contato registrado", description: `Tentativa registrada para ${client.name}.` });
          setUpdatingClientId(null);
          return true;
        }

        const supabase = createClient();
        const { error } = await supabase
          .from("clients")
          .update({
            last_contact_at: lastContactAt,
            next_action_at: nextActionAt || null,
            updated_by: currentUserId,
            updated_at: lastContactAt,
            notes: description || client.notes || null,
          })
          .eq("id", clientId);

        if (error) {
          pushToast({ tone: "error", title: "Falha ao registrar contato", description: error.message });
          setUpdatingClientId(null);
          return false;
        }

        if (description) {
          await insertNote(clientId, description);
        }
        await insertHistory(clientId, "contact_attempt", {
          description: description || "Tentativa de contato registrada pela timeline do cliente.",
        });
        void refreshClients();
        pushToast({ tone: "success", title: "Contato registrado", description: `Tentativa registrada para ${client.name}.` });
        setUpdatingClientId(null);
        return true;
      },
    };
  }, [assignees, clients, currentUserId, errorMessage, formSubmitting, isQueryMode, listQuery, listRefreshing, loading, pushToast, refreshClients, staleData, stats, totalClients, totalPages, updatingClientId, persistClients]);

  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
}

export function useClients() {
  const context = useContext(ClientsContext);

  if (!context) {
    throw new Error("useClients must be used within ClientsProvider");
  }

  return context;
}
