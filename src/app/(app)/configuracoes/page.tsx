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
    title: "Integração Supabase",
    description: "Os dados de usuários são lidos e atualizados em tempo real na tabela public.profiles.",
    icon: Database,
  },
];

export default async function ConfiguracoesPage() {
  const session = await requireRole(["ADMIN"]);

  return (
    <div className="space-y-6">
      <section className="surface-card section-shell space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Configurações administrativas</h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Gerencie usuários, cargos e disponibilidade de acesso com uma experiência pensada para operação diária.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {supportCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title}>
              <CardHeader>
                <div className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
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
