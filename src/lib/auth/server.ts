import { redirect } from "next/navigation";

import { hasRole } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";

export interface AppSessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role: UserRole;
}

function normalizeRole(role: string | null | undefined): UserRole {
  if (role === "ADMIN" || role === "SUPERVISOR" || role === "ATTENDANT") {
    return role;
  }

  return "ATTENDANT";
}

export async function getSessionOrRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && profile.is_active === false) {
    redirect("/login?blocked=1");
  }

  try {
    await supabase.rpc("touch_profile_last_login");
  } catch {
    // Melhor esforço: não bloquear a navegação se a função ainda não existir.
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? "Usuário",
      role: normalizeRole(profile?.role),
    } satisfies AppSessionUser,
  };
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await getSessionOrRedirect();

  if (!hasRole(session.user.role, allowedRoles)) {
    redirect("/dashboard");
  }

  return session;
}
