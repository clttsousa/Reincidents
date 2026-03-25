import { UserRoundPlus } from "lucide-react";

import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="rounded-[28px]">
          <CardHeader className="p-7 pb-5 sm:p-8 sm:pb-6">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <UserRoundPlus className="size-5" />
            </div>
            <CardTitle className="text-2xl">Criar conta</CardTitle>
            <CardDescription>Novo acesso entra como atendente por padrão.</CardDescription>
          </CardHeader>
          <CardContent className="p-7 pt-0 sm:p-8 sm:pt-0">
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
