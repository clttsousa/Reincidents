import { ClientsTable } from "@/components/clientes/clients-table";
import { ClientsProvider } from "@/components/providers/clients-provider";

export default function ClientesPage() {
  return (
    <ClientsProvider>
      <div className="space-y-5 sm:space-y-6">
        <section className="surface-soft animate-enter rounded-[28px] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-heading">Carteira operacional</p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Uma visão mais limpa para filtrar, editar e cadastrar clientes sem quebrar o fluxo da equipe.
              </p>
            </div>
          </div>
        </section>

        <ClientsTable />
      </div>
    </ClientsProvider>
  );
}
