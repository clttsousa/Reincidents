import { ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="rounded-[28px]">
          <CardHeader className="p-7 pb-5 sm:p-8 sm:pb-6">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <ShieldCheck className="size-5" />
            </div>
            <CardTitle className="text-2xl">Entrar</CardTitle>
            <CardDescription>Acesse o painel para acompanhar os clientes recorrentes.</CardDescription>
          </CardHeader>
          <CardContent className="p-7 pt-0 sm:p-8 sm:pt-0">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
