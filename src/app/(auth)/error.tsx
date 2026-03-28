"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="surface-card animate-enter rounded-[28px] p-8 text-center shadow-premium">
      <p className="section-heading">Autenticação</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">Não foi possível abrir esta etapa</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Tente recarregar a página. Se o problema continuar, valide a sessão e as variáveis do Supabase.
      </p>
      <Button className="mt-6 rounded-2xl px-5" onClick={reset}>
        Recarregar etapa
      </Button>
    </div>
  );
}
