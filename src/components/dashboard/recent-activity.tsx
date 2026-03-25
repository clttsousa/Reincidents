"use client";

import { useClients } from "@/components/providers/clients-provider";
import { formatDateLabel } from "@/lib/client-helpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RecentActivity() {
  const { clients } = useClients();
  const recent = [...clients]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade recente</CardTitle>
        <CardDescription>Últimas movimentações simuladas da base local.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recent.map((item, index) => (
          <div key={item.id} className="flex gap-3">
            <div className="mt-1 flex flex-col items-center">
              <span className="size-2.5 rounded-full bg-primary" />
              {index !== recent.length - 1 ? <span className="mt-2 h-full w-px bg-border" /> : null}
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">Atualizado {formatDateLabel(item.updatedAt)}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
