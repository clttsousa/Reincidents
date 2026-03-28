import type { AssigneeOption, ClientRecord, ClientStats, ClientStatus, ClientTimelineEntry } from "@/types/mock";
import { buildStats, getAssigneeLabel, sanitizePhone } from "@/lib/client-helpers";
import { createClient } from "@/lib/supabase/client";

export type ClientRow = {
  id: string;
  name: string;
  phone: string;
  total_services: number;
  description: string;
  status: ClientStatus;
  responsible_user_id: string | null;
  responsible_name: string | null;
  os_open: boolean;
  os_number: string | null;
  resolved: boolean;
  notes: string | null;
  updated_at: string;
  last_contact_at: string | null;
  next_action_at: string | null;
};

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AssigneeOption["role"];
  is_active: boolean;
};

export type HistoryRow = {
  id: string;
  actor_id: string | null;
  action: string;
  status_from: string | null;
  status_to: string | null;
  description: string | null;
  created_at: string;
};

export type NoteRow = {
  id: string;
  author_id: string | null;
  note: string;
  created_at: string;
};

type ActorRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export type ServerListSort = "updated-desc" | "name-asc" | "services-desc" | "next-action-asc" | "critical-first";

export interface ClientListQuery {
  search: string;
  activeFilter: "Todos" | ClientStatus;
  assigneeFilter: string;
  criticalOnly: boolean;
  staleOnly: boolean;
  osFilter: "Todos" | "Com O.S." | "Sem O.S.";
  resolvedFilter: "Todos" | "Resolvidos" | "Pendentes";
  sortBy: ServerListSort;
  page: number;
  pageSize: number;
}

export interface ClientPageResponse {
  items: ClientRecord[];
  total: number;
}

export function sortClients(clients: ClientRecord[]) {
  return [...clients].sort((a, b) => {
    if (b.totalServices !== a.totalServices) return b.totalServices - a.totalServices;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function mapProfileToAssignee(profile: ProfileRow): AssigneeOption {
  return {
    id: profile.id,
    name: profile.full_name ?? profile.email ?? "Usuário",
    email: profile.email ?? "",
    role: profile.role,
    isActive: profile.is_active,
  };
}

export function mapRowToRecord(row: ClientRow, assignees: AssigneeOption[]): ClientRecord {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    totalServices: row.total_services,
    description: row.description ?? "",
    status: row.status,
    responsibleUserId: row.responsible_user_id,
    assignee: getAssigneeLabel(assignees, row.responsible_user_id, row.responsible_name ?? "Equipe"),
    responsibleEmail: assignees.find((option) => option.id === row.responsible_user_id)?.email ?? "",
    osOpen: row.os_open,
    osNumber: row.os_number ?? "",
    resolved: row.resolved,
    notes: row.notes ?? "",
    updatedAt: row.updated_at,
    lastContactAt: row.last_contact_at ?? "",
    nextActionAt: row.next_action_at ?? "",
  };
}

export function inferHistoryTitle(row: HistoryRow) {
  switch (row.action) {
    case "created":
      return "Cliente cadastrado";
    case "updated":
      return "Cadastro atualizado";
    case "status_changed":
      return row.status_to ? `Status alterado para ${row.status_to}` : "Status alterado";
    case "responsible_changed":
      return "Responsável alterado";
    case "note_added":
      return "Observação adicionada";
    case "contact_attempt":
      return "Tentativa de contato registrada";
    default:
      return row.action;
  }
}

function escapeLikeValue(value: string) {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

function applyClientListFilters(
  query: any,
  input: ClientListQuery,
) {
  let nextQuery = query;

  if (input.search.trim()) {
    const rawTerm = input.search.trim();
    const textTerm = escapeLikeValue(rawTerm);
    const digits = sanitizePhone(rawTerm);
    const clauses = [
      `name.ilike.%${textTerm}%`,
      `description.ilike.%${textTerm}%`,
      `responsible_name.ilike.%${textTerm}%`,
      `os_number.ilike.%${textTerm}%`,
    ];

    if (digits.length >= 3) {
      clauses.push(`phone.ilike.%${digits}%`);
    }

    nextQuery = nextQuery.or(clauses.join(","));
  }

  if (input.activeFilter !== "Todos") {
    nextQuery = nextQuery.eq("status", input.activeFilter);
  }

  if (input.assigneeFilter !== "Todos") {
    nextQuery = nextQuery.eq("responsible_name", input.assigneeFilter);
  }

  if (input.osFilter === "Com O.S.") {
    nextQuery = nextQuery.eq("os_open", true);
  }

  if (input.osFilter === "Sem O.S.") {
    nextQuery = nextQuery.eq("os_open", false);
  }

  if (input.resolvedFilter === "Resolvidos") {
    nextQuery = nextQuery.eq("resolved", true);
  }

  if (input.resolvedFilter === "Pendentes") {
    nextQuery = nextQuery.eq("resolved", false);
  }

  if (input.staleOnly) {
    const staleThreshold = new Date(Date.now() - 3 * 86400000).toISOString();
    nextQuery = nextQuery.lte("updated_at", staleThreshold);
  }

  if (input.criticalOnly) {
    const overdueNow = new Date().toISOString();
    const staleOpenOsThreshold = new Date(Date.now() - 2 * 86400000).toISOString();
    nextQuery = nextQuery.or(
      [
        "total_services.gte.8",
        'status.eq."Sem retorno"',
        `next_action_at.lt.${overdueNow}`,
        `and(os_open.eq.true,updated_at.lte.${staleOpenOsThreshold})`,
      ].join(","),
    );
  }

  return nextQuery;
}

function applyClientListSorting(
  query: any,
  sortBy: ServerListSort,
) {
  if (sortBy === "name-asc") {
    return query.order("name", { ascending: true }).order("updated_at", { ascending: false });
  }

  if (sortBy === "services-desc") {
    return query.order("total_services", { ascending: false }).order("updated_at", { ascending: false });
  }

  if (sortBy === "next-action-asc") {
    return query.order("next_action_at", { ascending: true, nullsFirst: false }).order("updated_at", { ascending: false });
  }

  if (sortBy === "critical-first") {
    return query.order("total_services", { ascending: false }).order("updated_at", { ascending: false });
  }

  return query.order("updated_at", { ascending: false }).order("total_services", { ascending: false });
}

export async function fetchProfiles(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as ProfileRow[]).map(mapProfileToAssignee);
}

export async function fetchClients(supabase: ReturnType<typeof createClient>, assignees: AssigneeOption[]) {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, phone, total_services, description, status, responsible_user_id, responsible_name, os_open, os_number, resolved, notes, updated_at, last_contact_at, next_action_at")
    .order("total_services", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as ClientRow[]).map((row) => mapRowToRecord(row, assignees));
}

export async function fetchClientPage(
  supabase: ReturnType<typeof createClient>,
  assignees: AssigneeOption[],
  input: ClientListQuery,
): Promise<ClientPageResponse> {
  const from = Math.max((input.page - 1) * input.pageSize, 0);
  const to = from + input.pageSize - 1;

  let query = supabase
    .from("clients")
    .select(
      "id, name, phone, total_services, description, status, responsible_user_id, responsible_name, os_open, os_number, resolved, notes, updated_at, last_contact_at, next_action_at",
      { count: "exact" },
    );

  query = applyClientListFilters(query, input);
  query = applyClientListSorting(query, input.sortBy);
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    items: ((data ?? []) as ClientRow[]).map((row) => mapRowToRecord(row, assignees)),
    total: count ?? 0,
  };
}

export async function fetchClientStats(supabase: ReturnType<typeof createClient>): Promise<ClientStats> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, total_services, status, next_action_at, updated_at, os_open, resolved");

  if (error) throw error;

  const lightweightRecords = ((data ?? []) as Pick<ClientRow, "id" | "total_services" | "status" | "next_action_at" | "updated_at" | "os_open" | "resolved">[]).map(
    (row) =>
      ({
        id: row.id,
        name: "",
        phone: "",
        totalServices: row.total_services,
        description: "",
        status: row.status,
        responsibleUserId: null,
        assignee: "",
        osOpen: row.os_open,
        osNumber: "",
        resolved: row.resolved,
        notes: "",
        updatedAt: row.updated_at,
        lastContactAt: "",
        nextActionAt: row.next_action_at ?? "",
      }) satisfies ClientRecord,
  );

  return buildStats(lightweightRecords);
}

export async function buildTimelineEntries(supabase: ReturnType<typeof createClient>, clientId: string): Promise<ClientTimelineEntry[]> {
  const [{ data: historyRows, error: historyError }, { data: noteRows, error: notesError }] = await Promise.all([
    supabase
      .from("client_history")
      .select("id, actor_id, action, status_from, status_to, description, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("client_notes")
      .select("id, author_id, note, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
  ]);

  if (historyError) throw historyError;
  if (notesError) throw notesError;

  const actorIds = new Set<string>();
  ((historyRows ?? []) as HistoryRow[]).forEach((row) => row.actor_id && actorIds.add(row.actor_id));
  ((noteRows ?? []) as NoteRow[]).forEach((row) => row.author_id && actorIds.add(row.author_id));

  let names = new Map<string, string>();
  if (actorIds.size > 0) {
    const { data: actorRows } = await supabase.from("profiles").select("id, full_name, email").in("id", Array.from(actorIds));

    names = new Map(((actorRows ?? []) as ActorRow[]).map((row) => [row.id, row.full_name ?? row.email ?? "Equipe"]));
  }

  const historyEntries: ClientTimelineEntry[] = ((historyRows ?? []) as HistoryRow[]).map((row) => ({
    id: `history-${row.id}`,
    type: "history",
    title: inferHistoryTitle(row),
    description: row.description ?? "Sem detalhe adicional.",
    createdAt: row.created_at,
    actorName: row.actor_id ? names.get(row.actor_id) ?? "Equipe" : "Equipe",
    badge: row.action.replaceAll("_", " "),
  }));

  const noteEntries: ClientTimelineEntry[] = ((noteRows ?? []) as NoteRow[]).map((row) => ({
    id: `note-${row.id}`,
    type: "note",
    title: "Observação interna",
    description: row.note,
    createdAt: row.created_at,
    actorName: row.author_id ? names.get(row.author_id) ?? "Equipe" : "Equipe",
    badge: "nota",
  }));

  return [...historyEntries, ...noteEntries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
