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
      {items.map((item, index) => {
        const Icon = getNavigationIcon(item.icon);
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{ animationDelay: `${index * 0.05}s` }}
            className={cn(
              "animate-slide-right group flex items-center gap-3 rounded-[22px] px-4 py-3.5 text-sm font-medium transition-all duration-200",
              active
                ? [
                    "bg-white text-slate-950 shadow-[0_24px_42px_-30px_rgba(148,163,184,0.72)]",
                    "dark:bg-indigo-600/90 dark:text-white dark:shadow-[0_24px_42px_-30px_rgba(99,102,241,0.5)]",
                  ]
                : [
                    "text-slate-300/90 hover:bg-white/10 hover:text-white",
                    "dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-slate-100",
                  ],
            )}
          >
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-2xl border transition-all duration-200",
                active
                  ? [
                      "border-slate-200 bg-slate-100 text-slate-900 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.18)]",
                      "dark:border-white/20 dark:bg-white/15 dark:text-white",
                    ]
                  : [
                      "border-white/10 bg-white/5 text-slate-300 group-hover:border-white/20 group-hover:bg-white/10",
                      "dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-400 dark:group-hover:border-slate-600 dark:group-hover:text-slate-200",
                    ],
              )}
            >
              <Icon className="size-4" />
            </span>

            <span className="flex-1 truncate">{item.label}</span>

            {active && (
              <span className="size-2 shrink-0 rounded-full bg-emerald-500 animate-pulse-soft dark:bg-emerald-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
