import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getSessionOrRedirect } from "@/lib/auth/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSessionOrRedirect();

  return (
    <div
      className={[
        "min-h-screen",
        /* Light mode background */
        "bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.07)_0%,transparent_50%),radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.07)_0%,transparent_50%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]",
        /* Dark mode background */
        "dark:bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.12)_0%,transparent_50%),radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08)_0%,transparent_50%),linear-gradient(180deg,#080d14_0%,#0a1020_100%)]",
      ].join(" ")}
    >
      <div className="mx-auto flex min-h-screen max-w-[1720px]">
        <AppSidebar user={session.user} />
        <div className="flex min-h-screen flex-1 flex-col lg:pl-[282px]">
          <AppHeader user={session.user} />
          <main className="flex-1 px-3 pb-24 pt-3 sm:px-6 lg:px-8 lg:pb-10 lg:pt-5">
            <div className="page-shell">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
