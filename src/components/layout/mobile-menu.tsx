"use client";

import { Menu, RadioTower, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { NavigationItem } from "@/lib/navigation";
import { getNavigationIcon } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileMenu({ items }: { items: NavigationItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <Button variant="outline" size="icon" className="border-white/70 bg-white/80 shadow-none" onClick={() => setOpen(true)}>
        <Menu className="size-4" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm lg:hidden">
          <div className="absolute left-0 top-0 h-full w-[88%] max-w-sm bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.92))] p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-slate-950">
                  <RadioTower className="size-5" />
                </div>
                <div>
                  <p className="font-semibold tracking-tight">InfraOS</p>
                  <p className="text-sm text-slate-400">Recorrência</p>
                </div>
              </div>
              <Button variant="outline" size="icon" className="border-white/10 bg-white/5 text-white" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <nav className="mt-8 space-y-2">
              {items.map((item) => {
                const Icon = getNavigationIcon(item.icon);
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                      active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <span className={cn("flex size-8 items-center justify-center rounded-xl", active ? "bg-slate-100" : "bg-white/6")}>
                      <Icon className="size-4" />
                    </span>
                    {item.label}
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
