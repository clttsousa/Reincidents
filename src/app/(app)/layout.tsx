import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ClientsProvider } from "@/components/providers/clients-provider";
import { getSessionOrRedirect } from "@/lib/auth/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSessionOrRedirect();

  return (
    <ClientsProvider>
      <div className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-[1720px]">
          <AppSidebar user={session.user} />
          <div className="flex min-h-screen flex-1 flex-col lg:pl-[292px]">
            <AppHeader user={session.user} />
            <main className="flex-1 px-4 pb-8 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-5">{children}</main>
          </div>
        </div>
      </div>
    </ClientsProvider>
  );
}
