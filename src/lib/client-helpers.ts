import type { AssigneeOption, ClientFormValues, ClientRecord, ClientStats, ClientStatus, ClientTimelineEntry } from "@/types/mock";

export const statusOptions: ClientStatus[] = ["Aguardando contato", "O.S. aberta", "Resolvido", "Sem retorno"];

export const statusStyles: Record<ClientStatus, string> = {
  "Aguardando contato": "border-amber-200/80 bg-amber-50 text-amber-900",
  "O.S. aberta": "border-sky-200/80 bg-sky-50 text-sky-900",
  Resolvido: "border-slate-900 bg-slate-900 text-white",
  "Sem retorno": "border-slate-200 bg-white text-slate-700",
};

export function sanitizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function formatPhone(phone: string) {
  const digits = sanitizePhone(phone);

  if (digits.length === 12 && digits.startsWith("55")) {
    return `(${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  return phone;
}

export function formatDateLabel(value: string) {
  if (!value) return "Sem data";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (targetDay.getTime() === today.getTime()) return `Hoje às ${time}`;
  if (targetDay.getTime() === yesterday.getTime()) return `Ontem às ${time}`;

  const diffDays = Math.floor((today.getTime() - targetDay.getTime()) / 86400000);
  if (diffDays > 1 && diffDays < 7) return `Há ${diffDays} dias`;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function toDateTimeLocalValue(value: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const tzOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value: string) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

export function daysSinceUpdate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

export function isCriticalClient(client: Pick<ClientRecord, "totalServices" | "status" | "resolved" | "nextActionAt">) {
  const overdueNextAction = Boolean(client.nextActionAt) && new Date(client.nextActionAt).getTime() < Date.now();
  return client.totalServices >= 11 || client.status === "Sem retorno" || overdueNextAction || !client.resolved;
}

export function isStaleClient(client: Pick<ClientRecord, "updatedAt">, threshold = 3) {
  return daysSinceUpdate(client.updatedAt) >= threshold;
}

export function getOsLabel(client: Pick<ClientRecord, "osOpen" | "resolved" | "osNumber">) {
  if (!client.osOpen && !client.osNumber) return "Não aberta";
  if (client.resolved) return "Concluída";
  return client.osNumber ? client.osNumber : "Aberta";
}

export function getResolvedLabel(client: Pick<ClientRecord, "resolved">) {
  return client.resolved ? "Sim" : "Não";
}

export function getAssigneeLabel(assignees: AssigneeOption[], responsibleUserId?: string | null, fallback = "Equipe") {
  if (!responsibleUserId) return fallback;
  return assignees.find((option) => option.id === responsibleUserId)?.name ?? fallback;
}

export function clientToFormValues(client?: ClientRecord): ClientFormValues {
  if (!client) {
    return {
      name: "",
      phone: "",
      totalServices: 1,
      description: "",
      status: "Aguardando contato",
      responsibleUserId: "",
      osOpen: false,
      osNumber: "",
      resolved: false,
      notes: "",
      lastContactAt: "",
      nextActionAt: "",
    };
  }

  return {
    name: client.name,
    phone: client.phone,
    totalServices: client.totalServices,
    description: client.description,
    status: client.status,
    responsibleUserId: client.responsibleUserId ?? "",
    osOpen: client.osOpen,
    osNumber: client.osNumber,
    resolved: client.resolved,
    notes: client.notes,
    lastContactAt: toDateTimeLocalValue(client.lastContactAt),
    nextActionAt: toDateTimeLocalValue(client.nextActionAt),
  };
}

export function normalizeClientPayload(values: ClientFormValues, assignees: AssigneeOption[]) {
  const phone = sanitizePhone(values.phone);
  const resolved = values.status === "Resolvido" ? true : values.resolved;
  const osOpen = values.status === "O.S. aberta" || resolved ? true : values.osOpen;
  const selectedAssignee = assignees.find((option) => option.id === values.responsibleUserId);

  return {
    name: values.name.trim(),
    phone,
    totalServices: values.totalServices,
    description: values.description.trim(),
    status: values.status,
    responsibleUserId: values.responsibleUserId || "",
    assignee: selectedAssignee?.name ?? "Equipe",
    responsibleEmail: selectedAssignee?.email ?? "",
    notes: values.notes.trim(),
    osNumber: osOpen ? values.osNumber.trim() : "",
    resolved,
    osOpen,
    lastContactAt: fromDateTimeLocalValue(values.lastContactAt),
    nextActionAt: fromDateTimeLocalValue(values.nextActionAt),
  };
}

export function validateClientForm(values: ClientFormValues) {
  const errors: Partial<Record<keyof ClientFormValues, string>> = {};
  const digits = sanitizePhone(values.phone);

  if (values.name.trim().length < 3) errors.name = "Informe o nome completo do cliente.";
  if (digits.length < 10 || digits.length > 13) errors.phone = "Informe um telefone válido com DDD.";
  if (!Number.isFinite(values.totalServices) || values.totalServices < 1) {
    errors.totalServices = "O total de atendimentos deve ser maior que zero.";
  }
  if (values.responsibleUserId.trim().length < 3) errors.responsibleUserId = "Selecione um responsável do sistema.";
  if ((values.osOpen || values.status === "O.S. aberta") && values.osNumber.trim().length < 3) {
    errors.osNumber = "Preencha o número da O.S. quando houver ordem aberta.";
  }
  if (values.notes.trim().length > 0 && values.notes.trim().length < 6) {
    errors.notes = "A observação deve ter pelo menos 6 caracteres ou ficar vazia.";
  }
  if (values.lastContactAt && values.nextActionAt) {
    const last = new Date(values.lastContactAt).getTime();
    const next = new Date(values.nextActionAt).getTime();
    if (!Number.isNaN(last) && !Number.isNaN(next) && next < last) {
      errors.nextActionAt = "A próxima ação não pode acontecer antes do último contato.";
    }
  }

  return errors;
}

export function buildStats(clients: ClientRecord[]): ClientStats {
  return {
    total: clients.length,
    waiting: clients.filter((client) => client.status === "Aguardando contato").length,
    os: clients.filter((client) => client.osOpen).length,
    solved: clients.filter((client) => client.resolved).length,
    noReturn: clients.filter((client) => client.status === "Sem retorno").length,
    critical: clients.filter(isCriticalClient).length,
    stale: clients.filter((client) => isStaleClient(client)).length,
  };
}

export function buildWhatsappLink(phone: string) {
  const digits = sanitizePhone(phone);
  return `https://wa.me/${digits}`;
}

export function timelineActionLabel(entry: ClientTimelineEntry) {
  return entry.badge ?? (entry.type === "note" ? "Nota" : "Movimentação");
}
