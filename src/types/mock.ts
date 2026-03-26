export type ClientStatus = "Aguardando contato" | "O.S. aberta" | "Resolvido" | "Sem retorno";

export interface AssigneeOption {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPERVISOR" | "ATTENDANT";
  isActive: boolean;
}

export interface ClientRecord {
  id: string;
  name: string;
  phone: string;
  totalServices: number;
  description: string;
  status: ClientStatus;
  responsibleUserId: string | null;
  assignee: string;
  responsibleEmail?: string;
  osOpen: boolean;
  osNumber: string;
  resolved: boolean;
  notes: string;
  updatedAt: string;
  lastContactAt: string;
  nextActionAt: string;
}

export interface ClientFormValues {
  name: string;
  phone: string;
  totalServices: number;
  description: string;
  status: ClientStatus;
  responsibleUserId: string;
  osOpen: boolean;
  osNumber: string;
  resolved: boolean;
  notes: string;
  lastContactAt: string;
  nextActionAt: string;
}

export interface ClientStats {
  total: number;
  waiting: number;
  os: number;
  solved: number;
  noReturn: number;
  critical: number;
  stale: number;
}

export interface StatusColumnItem {
  name: string;
  phone: string;
  totalServices: number;
  note: string;
}

export interface StatusColumn {
  title: string;
  description: string;
  items: StatusColumnItem[];
}

export interface ClientTimelineEntry {
  id: string;
  type: "history" | "note";
  title: string;
  description: string;
  createdAt: string;
  actorName: string;
  badge?: string;
}
