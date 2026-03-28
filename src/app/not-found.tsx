import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="surface-card max-w-xl rounded-[32px] p-10 text-center shadow-premium">
        <p className="section-heading">Erro de rota</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">Página não encontrada</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          O endereço informado não existe mais ou foi movido. Volte para o dashboard para retomar a operação.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#1e293b)] px-5 text-sm font-medium text-white shadow-[0_16px_34px_-22px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5">
            Ir para o dashboard
          </Link>
          <Link href="/clientes" className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-white/95 px-5 text-sm font-medium text-slate-700 shadow-[0_12px_28px_-22px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950">
            Abrir carteira
          </Link>
        </div>
      </div>
    </main>
  );
}
