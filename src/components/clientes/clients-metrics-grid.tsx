import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function MetricCard({
  label,
  value,
  helper,
  accent = "blue",
}: {
  label: string;
  value: string;
  helper?: string;
  accent?: string;
}) {
  const accentClasses: Record<string, string> = {
    blue: "stat-accent-blue",
    emerald: "stat-accent-emerald",
    amber: "stat-accent-amber",
    rose: "stat-accent-rose",
    violet: "stat-accent-violet",
  };

  return (
    <Card className="overflow-hidden rounded-[26px] border-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
          <div className={cn("flex size-9 items-center justify-center rounded-2xl", accentClasses[accent])}>
            <span className="size-2 rounded-full bg-current" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{value}</p>
        {helper ? <p className="mt-1.5 text-xs leading-5 text-slate-400 dark:text-slate-500">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}

export function ClientsMetricsGrid({
  total,
  waiting,
  os,
  solved,
  noReturn,
}: {
  total: number;
  waiting: number;
  os: number;
  solved: number;
  noReturn: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
      <MetricCard label="Total" value={String(total)} helper="Carteira completa" accent="blue" />
      <MetricCard label="Aguardando" value={String(waiting)} helper="Precisa de contato" accent="amber" />
      <MetricCard label="O.S. aberta" value={String(os)} helper="Em andamento" accent="violet" />
      <MetricCard label="Resolvidos" value={String(solved)} helper="Ciclo concluído" accent="emerald" />
      <MetricCard label="Sem retorno" value={String(noReturn)} helper="Aguardando resposta" accent="rose" />
    </div>
  );
}

export function ClientsLoadingState() {
  return (
    <div className="space-y-6 animate-enter">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-32 rounded-[24px]" />
        ))}
      </div>
      <div className="skeleton-shimmer h-[560px] rounded-[30px]" />
    </div>
  );
}
