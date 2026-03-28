import { useState, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";
import { statusStyles } from "@/lib/client-helpers";
import type { ClientStatus } from "@/types/mock";
import { cn } from "@/lib/utils";

interface CustomSelectProps {
  value: string;
  onChange: (value: string | ClientStatus) => void;
  options: string[] | ClientStatus[];
  placeholder?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Selecione uma opção",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = useState(0);

  useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, []);

  const isStatus = options.length > 0 && (options[0] === "Aguardando contato" || options[0] === "O.S. aberta" || options[0] === "Resolvido" || options[0] === "Sem retorno");
  const displayValue = value || placeholder;

  const getStatusBadgeClass = (status: string): string => {
    const style = statusStyles[status as ClientStatus];
    if (!style) return "bg-slate-100 text-slate-900 border-slate-200";
    return style;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      "Aguardando contato": "bg-amber-50 text-amber-900 border-amber-200",
      "O.S. aberta": "bg-sky-50 text-sky-900 border-sky-200",
      Resolvido: "bg-slate-900 text-white border-slate-900",
      "Sem retorno": "bg-slate-50 text-slate-700 border-slate-200",
    };
    return colorMap[status] || "bg-slate-100 text-slate-900 border-slate-200";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          className="w-full justify-between h-11 px-3 text-sm font-normal"
          onClick={() => setOpen(!open)}
        >
          <span className="truncate text-left">
            {isStatus && value ? (
              <Badge className={cn("text-xs font-medium", getStatusColor(value))}>
                {value}
              </Badge>
            ) : (
              <span className={value ? "text-foreground" : "text-muted-foreground"}>
                {displayValue}
              </span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 border-0 shadow-lg"
        style={{ width: `${triggerWidth}px` }}
        align="start"
      >
        <div className="flex flex-col max-h-64 overflow-y-auto">
          {options.map((option) => {
            const isSelected = value === option;

            return (
              <button
                key={option}
                onClick={() => {
                  onChange(option as ClientStatus);
                  setOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-2.5 text-left text-sm font-medium transition-colors flex items-center justify-between gap-2",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-slate-50 dark:hover:bg-slate-900 text-foreground",
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isStatus ? (
                    <Badge className={cn("text-xs font-medium", getStatusColor(option))}>
                      {option}
                    </Badge>
                  ) : (
                    <span className="truncate">{option}</span>
                  )}
                </div>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
