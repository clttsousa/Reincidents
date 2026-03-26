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
      <section className="surface-card section-shell animate-enter">
        <p className="section-heading">Administração</p>
        <h1 className="mt-3 page-title">Configurações e equipe</h1>
        <p className="page-description sm:max-w-3xl">
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
