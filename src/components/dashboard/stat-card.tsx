import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatAccent = "blue" | "emerald" | "amber" | "rose" | "violet";

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  icon: ReactNode;
  accent?: StatAccent;
  trendUp?: boolean;
  className?: string;
}

const accentMap: Record<StatAccent, string> = {
  blue: "stat-accent-blue",
  emerald: "stat-accent-emerald",
  amber: "stat-accent-amber",
  rose: "stat-accent-rose",
  violet: "stat-accent-violet",
};

export function StatCard({
  title,
  value,
  trend,
  icon,
  accent = "blue",
  trendUp,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "surface-card hover-lift group relative overflow-hidden rounded-[24px] p-5",
        "dark:border-slate-700/40",
        className,
      )}
    >
      {/* Subtle background accent */}
      <div
        className={cn(
          "absolute right-0 top-0 size-28 rounded-bl-[60px] opacity-40 transition-opacity duration-300 group-hover:opacity-60",
          accentMap[accent],
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            {value}
          </p>
          <p
            className={cn(
              "text-[13px] font-medium",
              trendUp === true && "text-emerald-600 dark:text-emerald-400",
              trendUp === false && "text-rose-600 dark:text-rose-400",
              trendUp === undefined && "text-slate-500 dark:text-slate-400",
            )}
          >
            {trend}
          </p>
        </div>

        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
            accentMap[accent],
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
