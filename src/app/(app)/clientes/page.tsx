import { ClientsTable } from "@/components/clientes/clients-table";

export default function ClientesPage() {
  return (
    <div className="space-y-5">
      <section className="flex items-end justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Clientes recorrentes</h1>
          <p className="mt-1 text-sm text-slate-500">Acompanhe a fila, ajuste status e mantenha a equipe organizada.</p>
        </div>
      </section>

      <ClientsTable />
    </div>
  );
}
