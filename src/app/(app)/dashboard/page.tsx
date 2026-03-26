import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { ClientsProvider } from "@/components/providers/clients-provider";

export default function DashboardPage() {
  return (
    <ClientsProvider>
      <DashboardOverview />
    </ClientsProvider>
  );
}
