"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavigationItem } from "@/lib/navigation";
import { getNavigationIcon } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function SidebarNav({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5">
      {items.map((item) => {
        const Icon = getNavigationIcon(item.icon);
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
              active
                ? "bg-white text-slate-950 shadow-[0_16px_35px_-24px_rgba(148,163,184,0.55)]"
                : "text-slate-300/90 hover:bg-white/10 hover:text-white",
            )}
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-xl border text-inherit transition-all",
                active ? "border-slate-200 bg-slate-100 text-slate-900" : "border-white/10 bg-white/5 text-slate-300 group-hover:border-white/20",
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="flex-1">{item.label}</span>
            {active ? <span className="size-2 rounded-full bg-slate-950" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
