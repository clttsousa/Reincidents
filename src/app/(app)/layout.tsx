import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ClientsProvider } from "@/components/providers/clients-provider";
import { getSessionOrRedirect } from "@/lib/auth/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSessionOrRedirect();

  return (
    <ClientsProvider>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.06),_transparent_32%),linear-gradient(180deg,#fafbfd_0%,#f7f8fb_100%)]">
        <div className="mx-auto flex min-h-screen max-w-[1720px]">
          <AppSidebar user={session.user} />
          <div className="flex min-h-screen flex-1 flex-col lg:pl-[292px]">
            <AppHeader user={session.user} />
            <main className="flex-1 px-3 pb-24 pt-3 sm:px-6 lg:px-8 lg:pb-10 lg:pt-5">{children}</main>
          </div>
        </div>
      </div>
    </ClientsProvider>
  );
}
