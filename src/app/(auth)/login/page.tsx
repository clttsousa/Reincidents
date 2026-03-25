import { ShieldCheck } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-3 py-5 sm:px-4 sm:py-10">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden rounded-[28px]">
          <CardHeader className="p-5 pb-4 sm:p-8 sm:pb-6">
            <BrandLogo className="mb-5" />
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <ShieldCheck className="size-5" />
            </div>
            <CardTitle className="text-[1.75rem] sm:text-2xl">Entrar</CardTitle>
            <CardDescription>Acesse o painel para acompanhar clientes recorrentes e ordens de serviço.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 sm:p-8 sm:pt-0">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
