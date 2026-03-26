import type { LucideIcon } from "lucide-react";
import { Gauge, Settings, TableProperties, Workflow } from "lucide-react";

import type { UserRole } from "@/types/auth";

export type NavigationIconName = "gauge" | "table-properties" | "workflow" | "settings";

export interface NavigationItem {
  href: string;
  label: string;
  icon: NavigationIconName;
  roles?: UserRole[];
}

export const navigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "gauge" },
  { href: "/clientes", label: "Clientes", icon: "table-properties" },
  { href: "/fila", label: "Fila", icon: "workflow" },
  { href: "/configuracoes", label: "Configurações", icon: "settings", roles: ["ADMIN"] },
];

const navigationIconMap: Record<NavigationIconName, LucideIcon> = {
  gauge: Gauge,
  "table-properties": TableProperties,
  workflow: Workflow,
  settings: Settings,
};

export function getNavigationForRole(role: UserRole) {
  return navigationItems.filter((item) => !item.roles || item.roles.includes(role));
}

export function getNavigationIcon(icon: NavigationIconName): LucideIcon {
  return navigationIconMap[icon];
}

export const pageTitleByPath: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clientes": "Clientes recorrentes",
  "/fila": "Fila operacional",
  "/configuracoes": "Configurações",
};

export const pageDescriptionByPath: Record<string, string> = {
  "/dashboard": "Acompanhe ritmo da operação, gargalos, reincidência e prioridades do dia em um painel mais visual.",
  "/clientes": "Organize a carteira, filtre rápido, ajuste status e mantenha cada caso com contexto e próxima ação claros.",
  "/fila": "Enxergue a operação por estágio, priorize urgências e entre nos canais rápidos com menos cliques.",
  "/configuracoes": "Gerencie acessos, cargos e governança da equipe em uma área administrativa mais clara e segura.",
};
