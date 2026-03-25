import * as React from "react";

import { cn } from "@/lib/utils";

function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative flex size-11 shrink-0 overflow-hidden rounded-full border border-white/80 bg-white shadow-[0_12px_30px_-22px_rgba(15,23,42,0.6)]",
        className,
      )}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-slate-100 text-sm font-semibold text-slate-800",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback };
