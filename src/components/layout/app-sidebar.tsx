import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Badge } from "@/components/ui/badge";
import { getNavigationForRole } from "@/lib/navigation";
import { roleLabels } from "@/lib/auth/permissions";
import type { UserRole } from "@/types/auth";

interface AppSidebarProps {
  user: {
    name?: string | null;
    role: UserRole;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const items = getNavigationForRole(user.role);

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[276px] px-5 py-5 lg:flex lg:flex-col">
      <div className="surface-dark flex h-full flex-col rounded-[28px] px-5 py-5 text-white">
        <Link href="/dashboard" className="rounded-2xl p-1">
          <BrandLogo theme="dark" showTagline={false} />
        </Link>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{user.name ?? "Usuário"}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{roleLabels[user.role]}</p>
            </div>
            <Badge className="bg-white/10 text-white">Ativo</Badge>
          </div>
        </div>

        <div className="mt-6 flex-1">
          <SidebarNav items={items} />
        </div>
      </div>
    </aside>
  );
}
