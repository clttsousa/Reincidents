import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  icon: ReactNode;
}

export function StatCard({ title, value, trend, icon }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{trend}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
