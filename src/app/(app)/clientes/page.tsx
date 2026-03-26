import { ClientsTable } from "@/components/clientes/clients-table";
import { ClientsProvider } from "@/components/providers/clients-provider";

export default function ClientesPage() {
  return (
    <ClientsProvider>
      <div className="space-y-4 sm:space-y-5">
        <section className="surface-card section-shell animate-enter">
          <p className="section-heading">Operação</p>
          <h1 className="mt-3 page-title">Clientes recorrentes</h1>
          <p className="page-description sm:max-w-2xl">
            Acompanhe a carteira, ajuste status, registre próximas ações e abra a timeline de cada cliente para manter toda a equipe alinhada.
          </p>
        </section>

        <ClientsTable />
      </div>
    </ClientsProvider>
  );
}
