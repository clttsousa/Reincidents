import type { UserRole } from "@/types/auth";

export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  SUPERVISOR: "Supervisor",
  ATTENDANT: "Atendente",
};

export function hasRole(role: UserRole | undefined, allowedRoles: UserRole[]) {
  if (!role) return false;
  return allowedRoles.includes(role);
}
