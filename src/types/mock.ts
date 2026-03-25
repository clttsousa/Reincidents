export type ClientStatus = "Aguardando contato" | "O.S. aberta" | "Resolvido" | "Sem retorno";

export interface ClientRecord {
  id: string;
  name: string;
  phone: string;
  totalServices: number;
  description: string;
  status: ClientStatus;
  assignee: string;
  osOpen: boolean;
  osNumber: string;
  resolved: boolean;
  notes: string;
  updatedAt: string;
}

export interface ClientFormValues {
  name: string;
  phone: string;
  totalServices: number;
  description: string;
  status: ClientStatus;
  assignee: string;
  osOpen: boolean;
  osNumber: string;
  resolved: boolean;
  notes: string;
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
