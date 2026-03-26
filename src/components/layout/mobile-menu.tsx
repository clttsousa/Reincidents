"use client";

import { Bell, LogOut, Menu, Plus, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { NavigationItem } from "@/lib/navigation";
import { getNavigationIcon } from "@/lib/navigation";
import { roleLabels } from "@/lib/auth/permissions";
import type { UserRole } from "@/types/auth";
import { cn } from "@/lib/utils";
import { useOverlayBehavior } from "@/hooks/use-overlay-behavior";

interface MobileMenuProps {
  items: NavigationItem[];
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

export function MobileMenu({ items, user }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const menuRef = useOverlayBehavior({ open, onClose: () => setOpen(false) });

  const initials = useMemo(
    () =>
      (user.name ?? user.email ?? "US")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "US",
    [user.email, user.name],
  );

  const handleQuickCreate = () => {
    setOpen(false);

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
    setOpen(false);
    router.push("/login");
    router.refresh();
    setSigningOut(false);
  };

  return (
    <>
      <Button variant="outline" size="icon" className="border-white/70 bg-white/85 shadow-none" onClick={() => setOpen(true)} aria-label="Abrir menu">
        <Menu className="size-4" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu principal">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            type="button"
          />

          <div ref={menuRef} tabIndex={-1} className="animate-enter absolute left-0 top-0 h-full w-[90%] max-w-sm overflow-y-auto bg-[linear-gradient(180deg,rgba(15,23,42,0.99),rgba(15,23,42,0.95))] p-4 pb-6 text-white shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <BrandLogo theme="dark" showTagline={false} />
              <div className="flex items-center gap-2">
                <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80" aria-hidden="true">
                  <Bell className="size-4" />
                </span>
                <Button variant="outline" size="icon" className="border-white/10 bg-white/5 text-white" onClick={() => setOpen(false)} aria-label="Fechar menu lateral">
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="mt-5 rounded-[28px] border border-white/10 bg-white/6 p-4 shadow-[0_24px_40px_-34px_rgba(0,0,0,0.55)]">
              <div className="flex items-start gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-950 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.5)]">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{user.name ?? "Usuário"}</p>
                  <p className="mt-1 truncate text-sm text-slate-400">{user.email ?? roleLabels[user.role]}</p>
                  <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-300">{roleLabels[user.role]}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button className="h-11 justify-center" onClick={handleQuickCreate}>
                  <Plus className="size-4" />
                  Cliente
                </Button>
                <Button variant="outline" className="h-11 justify-center border-white/10 bg-white/5 text-white" onClick={handleSignOut} disabled={signingOut}>
                  <LogOut className="size-4" />
                  {signingOut ? "Saindo..." : "Sair"}
                </Button>
              </div>
            </div>

            <nav className="mt-6 space-y-2">
              {items.map((item) => {
                const Icon = getNavigationIcon(item.icon);
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-[22px] px-4 py-3.5 text-sm font-medium transition-all",
                      active ? "bg-white text-slate-950 shadow-[0_22px_40px_-30px_rgba(148,163,184,0.75)]" : "text-slate-300 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <span className={cn("flex size-10 items-center justify-center rounded-2xl", active ? "bg-slate-100" : "bg-white/6")}>
                      <Icon className="size-4" />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {active ? <span className="size-2 rounded-full bg-emerald-500" /> : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
