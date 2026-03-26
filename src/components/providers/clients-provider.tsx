"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { buildStats, normalizeClientPayload } from "@/lib/client-helpers";
import { createClient } from "@/lib/supabase/client";
import type { AssigneeOption, ClientFormValues, ClientRecord, ClientStats, ClientStatus, ClientTimelineEntry } from "@/types/mock";
import { useToast } from "@/components/providers/toast-provider";
import { buildTimelineEntries, fetchClients, fetchProfiles, sortClients } from "@/lib/services/client-service";

interface ClientsContextValue {
  clients: ClientRecord[];
  stats: ClientStats;
  topRecurring: ClientRecord[];
  staleClients: ClientRecord[];
  assignees: AssigneeOption[];
  loading: boolean;
  formSubmitting: boolean;
  updatingClientId: string | null;
  addClient: (values: ClientFormValues) => Promise<boolean>;
  updateClient: (clientId: string, values: ClientFormValues) => Promise<boolean>;
  updateClientStatus: (clientId: string, status: ClientStatus) => Promise<boolean>;
  fetchClientTimeline: (clientId: string) => Promise<ClientTimelineEntry[]>;
  addClientNote: (clientId: string, note: string) => Promise<boolean>;
  registerContactAttempt: (clientId: string, payload: { description: string; nextActionAt?: string }) => Promise<boolean>;
}

const STORAGE_KEY = "recorrenciaos-clients-v40";
const supabaseEnabled = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

const ClientsContext = createContext<ClientsContextValue | null>(null);

export function ClientsProvider({ children }: { children: ReactNode }) {
  const { pushToast } = useToast();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [updatingClientId, setUpdatingClientId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        if (supabaseEnabled) {
          const supabase = createClient();
          const [{ data: authData }, profiles] = await Promise.all([supabase.auth.getUser(), fetchProfiles(supabase)]);
          const rows = await fetchClients(supabase, profiles);

          if (!active) return;
          setCurrentUserId(authData.user?.id ?? null);
          setAssignees(profiles);
          setClients(rows);
        } else {
          const cached = window.localStorage.getItem(STORAGE_KEY);
          if (cached && active) {
            const parsed = JSON.parse(cached) as ClientRecord[];
            if (Array.isArray(parsed)) setClients(parsed);
          }
        }
      } catch {
        const cached = window.localStorage.getItem(STORAGE_KEY);
        if (cached && active) {
          const parsed = JSON.parse(cached) as ClientRecord[];
          if (Array.isArray(parsed)) setClients(parsed);
        }
      } finally {
        if (active) {
          setLoading(false);
          setHydrated(true);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }, [clients, hydrated]);

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
    const ordered = sortClients(clients);

    return {
      clients: ordered,
      stats: buildStats(ordered),
      topRecurring: [...ordered].slice(0, 5),
      staleClients: ordered.filter((client) => {
        const diff = Date.now() - new Date(client.updatedAt).getTime();
        return diff / 86400000 >= 3;
      }),
      assignees,
      loading,
      formSubmitting,
      updatingClientId,
      async addClient(values) {
        const payload = normalizeClientPayload(values, assignees);
        const now = new Date().toISOString();
        const optimisticRecord: ClientRecord = {
          id: `temp-${String(Date.now())}`,
          ...payload,
          responsibleUserId: payload.responsibleUserId || null,
          updatedAt: now,
          lastContactAt: payload.lastContactAt || "",
          nextActionAt: payload.nextActionAt || "",
        };

        setFormSubmitting(true);
        setClients((current) => sortClients([optimisticRecord, ...current]));

        if (!supabaseEnabled) {
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
          setClients((current) => current.filter((client) => client.id !== optimisticRecord.id));
          pushToast({ tone: "error", title: "Não foi possível cadastrar", description: error.message });
          setFormSubmitting(false);
          return false;
        }

        const inserted = mapRowToRecord(data as ClientRow, assignees);
        setClients((current) => sortClients([inserted, ...current.filter((client) => client.id !== optimisticRecord.id)]));
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

        const optimisticClient: ClientRecord = {
          ...currentClient,
          ...payload,
          responsibleUserId: payload.responsibleUserId || null,
          updatedAt: new Date().toISOString(),
          lastContactAt: payload.lastContactAt || currentClient.lastContactAt,
          nextActionAt: payload.nextActionAt || currentClient.nextActionAt,
        };

        setFormSubmitting(true);
        setClients((current) => sortClients(current.map((client) => (client.id === clientId ? optimisticClient : client))));

        if (!supabaseEnabled) {
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
          setClients((current) => sortClients(current.map((client) => (client.id === clientId ? currentClient : client))));
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

        pushToast({ tone: "success", title: "Cliente atualizado", description: `${payload.name} foi atualizado com sucesso.` });
        setFormSubmitting(false);
        return true;
      },
      async updateClientStatus(clientId, status) {
        const currentClient = ordered.find((client) => client.id === clientId);
        if (!currentClient) return false;

        const resolved = status === "Resolvido";
        const osOpen = status === "O.S. aberta";
        const optimistic = {
          ...currentClient,
          status,
          resolved,
          osOpen,
          osNumber: currentClient.osNumber,
          updatedAt: new Date().toISOString(),
        };

        setUpdatingClientId(clientId);
        setClients((current) => sortClients(current.map((client) => (client.id === clientId ? optimistic : client))));

        if (!supabaseEnabled) {
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
          setClients((current) => sortClients(current.map((client) => (client.id === clientId ? currentClient : client))));
          pushToast({ tone: "error", title: "Falha ao alterar status", description: error.message });
          setUpdatingClientId(null);
          return false;
        }

        await insertHistory(clientId, "status_changed", {
          fromStatus: currentClient.status,
          toStatus: status,
          description: "Status alterado diretamente pela tabela.",
        });
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
        setClients((current) => sortClients(current.map((item) => (item.id === clientId ? { ...item, notes: trimmed, updatedAt: new Date().toISOString() } : item))));

        if (!supabaseEnabled) {
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
          setClients((current) => sortClients(current.map((item) => (item.id === clientId ? client : item))));
          pushToast({ tone: "error", title: "Falha ao adicionar nota", description: error.message });
          setUpdatingClientId(null);
          return false;
        }

        await insertNote(clientId, trimmed);
        await insertHistory(clientId, "note_added", { description: trimmed });
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
        setClients((current) => sortClients(current.map((item) => (item.id === clientId ? { ...item, lastContactAt, nextActionAt, updatedAt: lastContactAt } : item))));

        if (!supabaseEnabled) {
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
          setClients((current) => sortClients(current.map((item) => (item.id === clientId ? client : item))));
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
        pushToast({ tone: "success", title: "Contato registrado", description: `Tentativa registrada para ${client.name}.` });
        setUpdatingClientId(null);
        return true;
      },
    };
  }, [assignees, clients, currentUserId, formSubmitting, loading, pushToast, updatingClientId]);

  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
}

export function useClients() {
  const context = useContext(ClientsContext);

  if (!context) {
    throw new Error("useClients must be used within ClientsProvider");
  }

  return context;
}
