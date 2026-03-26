import Link from "next/link";
import { Sparkles } from "lucide-react";

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
    <aside className="fixed inset-y-0 left-0 hidden w-[282px] px-5 py-5 lg:flex lg:flex-col">
      <div className="surface-dark animate-enter flex h-full flex-col rounded-[30px] px-5 py-5 text-white">
        <Link href="/dashboard" className="rounded-2xl p-1 transition hover:opacity-95">
          <BrandLogo theme="dark" showTagline={false} />
        </Link>

        <div className="mt-6 rounded-[26px] border border-white/10 bg-white/6 p-4 shadow-[0_20px_40px_-36px_rgba(15,23,42,0.45)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-medium text-white">{user.name ?? "Usuário"}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{roleLabels[user.role]}</p>
            </div>
            <Badge className="bg-white/10 text-white">Ativo</Badge>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-3 py-3 text-sm text-slate-300">
            <Sparkles className="size-4 text-emerald-300" />
            Painel refinado para operação mais rápida.
          </div>
        </div>

        <div className="mt-6 flex-1">
          <SidebarNav items={items} />
        </div>
      </div>
    </aside>
  );
}
