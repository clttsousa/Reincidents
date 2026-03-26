import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[132px] w-full rounded-[22px] border border-slate-200/90 bg-white/95 px-4 py-3 text-sm text-slate-900 shadow-[0_12px_30px_-26px_rgba(15,23,42,0.22)] outline-none placeholder:text-slate-400 focus-visible:-translate-y-px focus-visible:border-slate-300 focus-visible:ring-4 focus-visible:ring-ring/70 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
