"use client";

import { useMemo } from "react";

import { useClients } from "@/components/providers/clients-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhone, statusOptions } from "@/lib/client-helpers";

export default function FilaPage() {
  const { clients } = useClients();

  const columns = useMemo(
    () =>
      statusOptions.map((status) => ({
        title: status,
        items: clients.filter((client) => client.status === status),
        description:
          status === "Aguardando contato"
            ? "Clientes que precisam de retorno inicial."
            : status === "O.S. aberta"
              ? "Casos em andamento com ordem de serviço."
              : status === "Resolvido"
                ? "Ocorrências concluídas e monitoradas."
                : "Clientes sem retorno após tentativa de contato.",
      })),
    [clients],
  );

  return (
    <div className="space-y-6">
      <section className="surface-card section-shell space-y-2">
        <Badge variant="secondary" className="w-fit bg-slate-100 text-slate-700">
          Visão operacional
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Fila por status</h1>
        <p className="text-sm text-slate-500 sm:text-base">
          Uma leitura rápida da operação por estágio, útil para distribuição de esforço ao longo do dia.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => (
          <Card key={column.title} className="min-h-[340px]">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{column.title}</CardTitle>
                <Badge variant="outline">{column.items.length}</Badge>
              </div>
              <CardDescription>{column.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {column.items.map((item) => (
                <div key={item.id} className="hover-lift rounded-[24px] border border-slate-200/80 bg-slate-50/75 p-4 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.18)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950">{item.name}</p>
                      <p className="text-xs text-slate-500">{formatPhone(item.phone)}</p>
                    </div>
                    <Badge variant="secondary">{item.totalServices}x</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{item.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
