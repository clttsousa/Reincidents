"use client";

import { LogOut, Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationPanel } from "@/components/ui/notification-panel";
import { roleLabels } from "@/lib/auth/permissions";
import { getNavigationForRole, pageDescriptionByPath, pageTitleByPath } from "@/lib/navigation";
import type { UserRole } from "@/types/auth";

interface AppHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: UserRole;
  };
}

function buildCreateUrl(searchParams: ReturnType<typeof useSearchParams>) {
  const params = new URLSearchParams(searchParams.toString());
  params.set("create", "1");
  return `/clientes?${params.toString()}`;
}

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const title = pageTitleByPath[pathname] ?? "Painel";
  const description =
    pageDescriptionByPath[pathname] ?? "Gerencie a operação com mais contexto, clareza e velocidade.";
  const items = getNavigationForRole(user.role);
  const [signingOut, setSigningOut] = useState(false);

  const initials = useMemo(
    () =>
      (user.name ?? "US")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "US",
    [user.name],
  );

  const handleQuickCreate = () => {
    if (pathname === "/clientes") {
      window.dispatchEvent(new CustomEvent("recorrenciaos:new-client"));
      return;
    }
    router.push(buildCreateUrl(searchParams));
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
    setSigningOut(false);
  };

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-6 lg:px-8">
      <div
        className={[
          "surface-soft animate-enter mx-auto flex min-h-[78px] w-full max-w-[1360px] items-center gap-3 rounded-[24px] px-4 py-3 sm:px-5",
          "dark:bg-[rgba(14,20,32,0.92)] dark:border-slate-700/40",
        ].join(" ")}
      >
        {/* Mobile menu trigger */}
        <div className="lg:hidden">
          <MobileMenu items={items} user={user} />
        </div>

        {/* Title area */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 sm:text-xs">
              {roleLabels[user.role]}
            </p>
            <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-400 sm:hidden">
              {initials}
            </span>
          </div>

          <div className="mt-1 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-[1.4rem]">
                {title}
              </h2>
              <p className="mt-1 hidden max-w-3xl truncate text-sm text-slate-500 dark:text-slate-400 md:block">
                {description}
              </p>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <div className="flex h-10 items-center rounded-2xl border border-slate-200/90 bg-white/80 px-3 text-sm text-slate-500 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.2)] dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-400">
                <span className="mr-2 size-2 rounded-full bg-emerald-500 animate-pulse-soft" />
                Operação ativa
              </div>
            </div>
          </div>
        </div>

        {/* Mobile actions */}
          <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle size="sm" />
          <NotificationPanel />
          <Button
            variant="outline"
            size="icon"
            className="border-slate-200/90 bg-white/85 shadow-none dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-300"
            onClick={handleQuickCreate}
            aria-label="Novo cliente"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          <NotificationPanel />

          <Button onClick={handleQuickCreate}>
            <Plus className="size-4" />
            Novo cliente
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={signingOut}
            className="dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700/80 dark:hover:text-slate-100"
          >
            <LogOut className="size-4" />
            {signingOut ? "Saindo..." : "Sair"}
          </Button>
        </div>

        <Avatar className="hidden border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-800 sm:flex">
          <AvatarFallback className="dark:bg-slate-800 dark:text-slate-200">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
