"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="surface-card animate-enter rounded-[32px] p-8 sm:p-10 shadow-premium">
      <p className="section-heading">Falha de renderização</p>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">Algo saiu do fluxo esperado</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
        A rota encontrou um erro inesperado. Você pode tentar carregar novamente sem perder a sessão atual.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button className="rounded-2xl px-5" onClick={reset}>
          <RotateCcw className="size-4" />
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
