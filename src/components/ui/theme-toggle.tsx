"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "skeleton-shimmer rounded-2xl",
          size === "md" ? "size-11" : "size-9",
          className,
        )}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      className={cn(
        "relative inline-flex items-center justify-center rounded-2xl border transition-all duration-200",
        "hover:-translate-y-0.5 active:scale-95",
        size === "md" ? "size-11" : "h-9 w-9",
        isDark
          ? "border-slate-700/60 bg-slate-800/80 text-slate-300 shadow-[0_12px_28px_-22px_rgba(0,0,0,0.5)] hover:border-slate-600 hover:bg-slate-700/80 hover:text-slate-100"
          : "border-slate-200/90 bg-white/90 text-slate-600 shadow-[0_12px_28px_-22px_rgba(15,23,42,0.18)] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950",
        className,
      )}
    >
      <span className="relative size-4 overflow-hidden">
        <Sun
          className={cn(
            "absolute inset-0 size-4 transition-all duration-300",
            isDark ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 size-4 transition-all duration-300",
            isDark ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100",
          )}
        />
      </span>
    </button>
  );
}
