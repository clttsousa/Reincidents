import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
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
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
