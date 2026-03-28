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
    <aside className="fixed inset-y-0 left-0 hidden w-[282px] px-4 py-4 lg:flex lg:flex-col">
      <div
        className={[
          "animate-enter flex h-full flex-col rounded-[30px] px-5 py-5",
          /* Light: dark navy sidebar */
          "bg-[linear-gradient(180deg,#0f172a_0%,#111827_60%,#0f172a_100%)]",
          "border border-white/5 shadow-[0_32px_80px_-40px_rgba(0,0,0,0.6)]",
          /* Dark: even deeper */
          "dark:bg-[linear-gradient(180deg,#060a12_0%,#080d18_60%,#060a12_100%)]",
          "dark:border-white/4 dark:shadow-[0_32px_80px_-40px_rgba(0,0,0,0.8)]",
          "text-white",
        ].join(" ")}
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          className="rounded-2xl p-1 transition-opacity hover:opacity-90 active:opacity-80"
        >
          <BrandLogo theme="dark" showTagline={false} />
        </Link>

        {/* User card */}
        <div className="mt-5 rounded-[24px] border border-white/8 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-white">
                {user.name ?? "Usuário"}
              </p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                {roleLabels[user.role]}
              </p>
            </div>
            <Badge className="shrink-0 border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
              Ativo
            </Badge>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/6 bg-white/4 px-3 py-2.5 text-[13px] text-slate-300">
            <Sparkles className="size-3.5 shrink-0 text-emerald-400" />
            <span>Operação em tempo real</span>
          </div>
        </div>

        {/* Nav */}
        <div className="mt-5 flex-1 overflow-y-auto custom-scrollbar">
          <SidebarNav items={items} />
        </div>

        {/* Footer */}
        <div className="mt-4 rounded-[20px] border border-white/6 bg-white/3 px-4 py-3">
          <p className="text-[11px] text-slate-500">RecorrênciaOS v6.1.0</p>
          <p className="mt-0.5 text-[11px] text-slate-600">Premium · Operação contínua</p>
        </div>
      </div>
    </aside>
  );
}
