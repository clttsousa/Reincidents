import { Database, ShieldCheck, Users2 } from "lucide-react";

import { UserManagementPanel } from "@/components/configuracoes/user-management-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/server";

const supportCards = [
  {
    title: "Gestão centralizada",
    description: "Perfis, status de acesso e governança de equipe concentrados em uma única área administrativa.",
    icon: Users2,
  },
  {
    title: "Segurança operacional",
    description: "Apenas administradores podem acessar esta tela e as alterações são confirmadas antes de salvar.",
    icon: ShieldCheck,
  },
  {
    title: "Auditoria e Supabase",
    description: "As mudanças ficam registradas e a listagem é atualizada em tempo real com base na tabela public.profiles.",
    icon: Database,
  },
];

export default async function ConfiguracoesPage() {
  const session = await requireRole(["ADMIN"]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-[24px] border border-slate-200/80 bg-white/80 px-4 py-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] sm:px-5 sm:py-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-600">Administração</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">Configurações e equipe</h1>
        <p className="mt-1 text-sm leading-6 text-slate-500 sm:max-w-3xl">
          Você está acessando esta área como <span className="font-medium text-slate-800">{session.user.name}</span>. Use este painel para revisar cargos, bloquear ou reativar contas e acompanhar a trilha administrativa do sistema.
        </p>
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        {supportCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader>
                <div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                As mudanças feitas aqui respeitam permissões por perfil e persistem diretamente no Supabase.
              </CardContent>
            </Card>
          );
        })}
      </div>

      <UserManagementPanel currentUserId={session.user.id} />
    </div>
  );
}
