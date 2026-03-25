"use client";

import { ArrowUpRight, Phone } from "lucide-react";

import { useClients } from "@/components/providers/clients-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildWhatsappLink } from "@/lib/client-helpers";

export function PriorityClients() {
  const { topRecurring } = useClients();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Clientes prioritários</CardTitle>
          <CardDescription>Itens com maior recorrência para a equipe acompanhar de perto.</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          Ver todos
          <ArrowUpRight className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {topRecurring.slice(0, 3).map((client) => (
          <div key={client.id} className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{client.name}</p>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{client.status}</span>
              </div>
              <p className="text-sm text-muted-foreground">{client.description}</p>
            </div>
            <a
              href={buildWhatsappLink(client.phone)}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Phone className="size-4" />
              WhatsApp
            </a>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
