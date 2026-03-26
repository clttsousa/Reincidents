import { ShieldCheck, Sparkles, Workflow } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  { icon: ShieldCheck, title: "Acesso seguro", description: "Fluxo refinado com foco mais claro e feedbacks de entrada melhores." },
  { icon: Workflow, title: "Operação viva", description: "Entre rápido para acompanhar carteira, fila e indicadores em um painel mais limpo." },
  { icon: Sparkles, title: "Visual premium", description: "Nova camada visual com mais hierarquia, contraste e microinterações." },
];

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-3 py-5 sm:px-4 sm:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_28%)]" />
      <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="hidden rounded-[34px] border border-white/70 bg-white/72 p-8 shadow-[0_32px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur lg:block">
          <BrandLogo className="mb-8" />
          <div className="max-w-xl">
            <p className="section-heading">RecorrenciaOS</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">Controle operacional mais bonito, claro e rápido de usar.</h1>
            <p className="mt-4 text-base leading-7 text-slate-500 dark:text-slate-400 dark:text-slate-500">A nova experiência visual melhora a leitura da operação, o ritmo de acompanhamento e a sensação de produto premium.</p>
          </div>
          <div className="mt-8 grid gap-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="surface-muted rounded-[24px] border p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.3)]">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-950 dark:text-slate-50">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400 dark:text-slate-500">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="w-full max-w-md justify-self-center lg:max-w-lg lg:justify-self-end">
          <Card className="overflow-hidden rounded-[32px] animate-enter">
            <CardHeader className="p-5 pb-4 sm:p-8 sm:pb-6">
              <BrandLogo className="mb-5 lg:hidden" />
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#1e293b)] text-white shadow-[0_18px_34px_-24px_rgba(15,23,42,0.48)]">
                <ShieldCheck className="size-5" />
              </div>
              <CardTitle className="text-[1.9rem] sm:text-[2rem]">Entrar</CardTitle>
              <CardDescription>Acesse o painel para acompanhar clientes recorrentes, ordens de serviço e o ritmo da operação.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 sm:p-8 sm:pt-0">
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
