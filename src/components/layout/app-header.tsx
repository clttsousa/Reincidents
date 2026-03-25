"use client";

import { LogOut, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { roleLabels } from "@/lib/auth/permissions";
import { getNavigationForRole, pageTitleByPath } from "@/lib/navigation";
import type { UserRole } from "@/types/auth";

interface AppHeaderProps {
  user: {
    name?: string | null;
    role: UserRole;
  };
}

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const title = pageTitleByPath[pathname] ?? "Painel";
  const items = getNavigationForRole(user.role);
  const [signingOut, setSigningOut] = useState(false);

  const initials =
    (user.name ?? "US")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "US";

  const handleQuickCreate = () => {
    window.dispatchEvent(new CustomEvent("infraos:new-client"));
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
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="surface-soft flex min-h-[72px] items-center gap-3 rounded-[24px] px-4 py-3 sm:px-5">
        <div className="lg:hidden">
          <MobileMenu items={items} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{roleLabels[user.role]}</p>
          <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Button onClick={handleQuickCreate} className="shadow-none">
            <Plus className="size-4" />
            Novo cliente
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut} disabled={signingOut}>
            <LogOut className="size-4" />
            {signingOut ? "Saindo..." : "Sair"}
          </Button>
        </div>

        <Avatar className="hidden sm:flex">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
