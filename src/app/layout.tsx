import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { ToastProvider } from "@/components/providers/toast-provider";

export const metadata: Metadata = {
  title: {
    default: "RecorrênciaOS",
    template: "%s | RecorrênciaOS",
  },
  description: "Painel interno para gestão de clientes recorrentes, contatos e ordens de serviço.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background font-sans text-foreground">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
