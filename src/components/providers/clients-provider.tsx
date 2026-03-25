"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { buildStats, normalizeClientPayload } from "@/lib/client-helpers";
import { createClient } from "@/lib/supabase/client";
import type { ClientFormValues, ClientRecord, ClientStats, ClientStatus } from "@/types/mock";

interface ClientsContextValue {
  clients: ClientRecord[];
  stats: ClientStats;
  topRecurring: ClientRecord[];
  staleClients: ClientRecord[];
  addClient: (values: ClientFormValues) => void;
  updateClient: (clientId: string, values: ClientFormValues) => void;
  updateClientStatus: (clientId: string, status: ClientStatus) => void;
}

type ClientRow = {
  id: string;
  name: string;
  phone: string;
  total_services: number;
  description: string;
  status: ClientStatus;
  responsible_name: string | null;
  os_open: boolean;
  os_number: string | null;
  resolved: boolean;
  notes: string | null;
  updated_at: string;
};

const STORAGE_KEY = "recorrenciaos-clients-v6";
const supabaseEnabled = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

const ClientsContext = createContext<ClientsContextValue | null>(null);

function hydrateClientRecord(value: Partial<ClientRecord> & Record<string, unknown>, fallbackIndex: number): ClientRecord {
  const status = (value.status as ClientStatus | undefined) ?? "Aguardando contato";
  const resolved = Boolean(value.resolved ?? status === "Resolvido");
  const osOpen = Boolean((value.osOpen ?? (status === "O.S. aberta")) || resolved);

  return {
    id: String(value.id ?? `legacy-${fallbackIndex}`),
    name: String(value.name ?? "Cliente sem nome"),
    phone: String(value.phone ?? ""),
    totalServices: Number(value.totalServices ?? 1),
    description: String(value.description ?? value.summary ?? "Relato pendente de preenchimento."),
    status,
    assignee: String(value.assignee ?? "Equipe"),
    osOpen,
    osNumber: String(value.osNumber ?? ""),
    resolved,
    notes: String(value.notes ?? ""),
    updatedAt: String(value.updatedAt ?? new Date().toISOString()),
  };
}

function mapRowToRecord(row: ClientRow): ClientRecord {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    totalServices: row.total_services,
    description: row.description,
    status: row.status,
    assignee: row.responsible_name ?? "Equipe",
    osOpen: row.os_open,
    osNumber: row.os_number ?? "",
    resolved: row.resolved,
    notes: row.notes ?? "",
    updatedAt: row.updated_at,
  };
}

function sortClients(clients: ClientRecord[]) {
  return [...clients].sort((a, b) => {
    if (b.totalServices !== a.totalServices) return b.totalServices - a.totalServices;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

async function fetchClientsFromSupabase() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, phone, total_services, description, status, responsible_name, os_open, os_number, resolved, notes, updated_at")
    .order("total_services", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapRowToRecord(row as ClientRow));
}

async function insertHistory(clientId: string, action: string, fromStatus?: ClientStatus, toStatus?: ClientStatus, description?: string) {
  if (!supabaseEnabled) return;

  const supabase = createClient();
  await supabase.from("client_history").insert({
    client_id: clientId,
    action,
    status_from: fromStatus ?? null,
    status_to: toStatus ?? null,
    description: description ?? null,
  });
}

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        if (supabaseEnabled) {
          const rows = await fetchClientsFromSupabase();
          if (active) {
            setClients(rows);
          }
        } else {
          const cached = window.localStorage.getItem(STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached) as ClientRecord[];
            if (Array.isArray(parsed) && active) {
              setClients(parsed.map((item, index) => hydrateClientRecord(item as Partial<ClientRecord> & Record<string, unknown>, index)));
            }
          }
        }
      } catch {
        const cached = window.localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as ClientRecord[];
          if (Array.isArray(parsed) && parsed.length > 0 && active) {
            setClients(parsed.map((item, index) => hydrateClientRecord(item as Partial<ClientRecord> & Record<string, unknown>, index)));
          }
        }
      } finally {
        if (active) setHydrated(true);
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
      addClient(values) {
        const payload = normalizeClientPayload(values);
        const optimisticRecord: ClientRecord = {
          id: `temp-${String(Date.now())}`,
          ...payload,
          updatedAt: new Date().toISOString(),
        };

        setClients((current) => sortClients([optimisticRecord, ...current]));

        if (!supabaseEnabled) return;

        void (async () => {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("clients")
            .insert({
              name: payload.name,
              phone: payload.phone,
              total_services: payload.totalServices,
              description: payload.description,
              status: payload.status,
              responsible_name: payload.assignee,
              os_open: payload.osOpen,
              os_number: payload.osNumber || null,
              resolved: payload.resolved,
              notes: payload.notes || null,
            })
            .select("id, name, phone, total_services, description, status, responsible_name, os_open, os_number, resolved, notes, updated_at")
            .single();

          if (error) {
            setClients((current) => current.filter((client) => client.id !== optimisticRecord.id));
            return;
          }

          const inserted = mapRowToRecord(data as ClientRow);
          setClients((current) => sortClients([inserted, ...current.filter((client) => client.id !== optimisticRecord.id)]));
          await insertHistory(inserted.id, "created", undefined, inserted.status, "Cliente cadastrado no painel.");
        })();
      },
      updateClient(clientId, values) {
        const payload = normalizeClientPayload(values);
        const currentClient = ordered.find((client) => client.id === clientId);

        setClients((current) =>
          sortClients(
            current.map((client) =>
              client.id === clientId
                ? {
                    ...client,
                    ...payload,
                    updatedAt: new Date().toISOString(),
                  }
                : client,
            ),
          ),
        );

        if (!supabaseEnabled) return;

        void (async () => {
          const supabase = createClient();
          const { error } = await supabase
            .from("clients")
            .update({
              name: payload.name,
              phone: payload.phone,
              total_services: payload.totalServices,
              description: payload.description,
              status: payload.status,
              responsible_name: payload.assignee,
              os_open: payload.osOpen,
              os_number: payload.osNumber || null,
              resolved: payload.resolved,
              notes: payload.notes || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", clientId);

          if (!error) {
            await insertHistory(clientId, "updated", currentClient?.status, payload.status, "Cadastro atualizado no formulário rápido.");
          }
        })();
      },
      updateClientStatus(clientId, status) {
        const currentClient = ordered.find((client) => client.id === clientId);
        const resolved = status === "Resolvido";
        const osOpen = status === "O.S. aberta" || status === "Resolvido";
        const osNumber = osOpen ? currentClient?.osNumber || `OS-${String(currentClient?.totalServices ?? 1).padStart(4, "0")}` : "";

        setClients((current) =>
          sortClients(
            current.map((client) => {
              if (client.id !== clientId) return client;

              return {
                ...client,
                status,
                resolved,
                osOpen,
                osNumber,
                updatedAt: new Date().toISOString(),
              };
            }),
          ),
        );

        if (!supabaseEnabled) return;

        void (async () => {
          const supabase = createClient();
          const { error } = await supabase
            .from("clients")
            .update({
              status,
              resolved,
              os_open: osOpen,
              os_number: osNumber || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", clientId);

          if (!error) {
            await insertHistory(clientId, "status_changed", currentClient?.status, status, "Status alterado diretamente pela tabela.");
          }
        })();
      },
    };
  }, [clients, hydrated]);

  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
}

export function useClients() {
  const context = useContext(ClientsContext);

  if (!context) {
    throw new Error("useClients must be used within ClientsProvider");
  }

  return context;
}
