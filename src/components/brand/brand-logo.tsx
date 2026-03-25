import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BrandLogoProps = HTMLAttributes<HTMLDivElement> & {
  compact?: boolean;
  theme?: "light" | "dark";
  showTagline?: boolean;
};

const themes = {
  light: {
    text: "text-slate-950",
    muted: "text-slate-500",
  },
  dark: {
    text: "text-white",
    muted: "text-slate-400",
  },
};

export function BrandLogo({ compact = false, theme = "light", showTagline = true, className, ...props }: BrandLogoProps) {
  const palette = themes[theme];

  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/70 bg-white shadow-[0_14px_30px_-24px_rgba(15,23,42,0.35)]">
        <svg viewBox="0 0 44 44" className="size-8" aria-hidden="true" fill="none">
          <rect x="10.5" y="8" width="22" height="28" rx="6" fill="#0F172A" />
          <rect x="17" y="4.5" width="9.8" height="5.5" rx="2.4" fill="#0F172A" />
          <path d="M16 18.5h11.5M16 23h8.5M16 27.5h6" stroke="#E2E8F0" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M8.8 24.4a13.6 13.6 0 0 0 23.7 6.3" stroke="#22C55E" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M30.9 32.7h-6.1v-6.1" stroke="#22C55E" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="31.8" cy="28.8" r="6.2" fill="#22C55E" />
          <path d="m29.1 28.8 1.9 1.9 3.5-4.1" stroke="#F8FAFC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      {compact ? null : (
        <div className="min-w-0">
          <p className={cn("truncate text-lg font-semibold tracking-tight", palette.text)}>
            Recorrência<span className="text-emerald-500">OS</span>
          </p>
          {showTagline ? <p className={cn("truncate text-sm", palette.muted)}>Gestão de clientes recorrentes</p> : null}
        </div>
      )}
    </div>
  );
}
