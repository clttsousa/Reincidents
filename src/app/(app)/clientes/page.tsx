import { ClientsTable } from "@/components/clientes/clients-table";

export default function ClientesPage() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-[24px] border border-slate-200/80 bg-white/80 px-4 py-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] sm:px-5 sm:py-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-600">Operação</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">Clientes recorrentes</h1>
        <p className="mt-1 text-sm leading-6 text-slate-500 sm:max-w-2xl">
          Acompanhe a carteira, ajuste status, registre próximas ações e abra a timeline de cada cliente para manter toda a equipe alinhada.
        </p>
      </section>

      <ClientsTable />
    </div>
  );
}
