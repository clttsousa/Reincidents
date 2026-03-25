import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";

import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "InfraOS Recorrência",
  description: "Painel interno para gestão de clientes recorrentes com problemas de conexão.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} min-h-screen bg-background font-sans text-foreground`}>
        {children}
      </body>
    </html>
  );
}
