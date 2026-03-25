import { Database, KeyRound, ShieldCheck, Users2, Workflow } from "lucide-react";

import { requireRole } from "@/lib/auth/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const cards = [
  {
    title: "Equipe e perfis",
    description: "Base preparada para admin, supervisor e atendente.",
    icon: Users2,
  },
  {
    title: "Segurança e acesso",
    description: "Supabase Auth ativo com rotas protegidas e sessão por cookie.",
    icon: ShieldCheck,
  },
  {
    title: "Supabase Database",
    description: "Banco Postgres com RLS, trigger de perfis e estrutura multiusuário.",
    icon: Database,
  },
  {
    title: "Controle de permissões",
    description: "Perfis prontos para crescer com governança gradual depois.",
    icon: KeyRound,
  },
  {
    title: "Fluxo operacional",
    description: "Status, fila e histórico conectados à operação diária.",
    icon: Workflow,
  },
];

export default async function ConfiguracoesPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="space-y-6">
      <section className="surface-card section-shell space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Configurações administrativas</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Área reservada para evolução de perfis, preferências do sistema, integrações e governança de acesso.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
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
                Esta área já está protegida por perfil de admin, evitando que atendentes acessem configurações sensíveis.
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
