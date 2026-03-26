"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users,
  UserX,
} from "lucide-react";

import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { roleLabels } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

type UserProfileRecord = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

type AuditLogRow = {
  id: string;
  action: string;
  created_at: string;
  metadata: Record<string, string | boolean | null> | null;
  actor: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
  target: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
};

type PendingAction =
  | { type: "role"; user: UserProfileRecord; nextRole: UserRole }
  | { type: "status"; user: UserProfileRecord; nextActive: boolean };

interface UserManagementPanelProps {
  currentUserId: string;
}

const roleOptions: UserRole[] = ["ADMIN", "SUPERVISOR", "ATTENDANT"];
const statusOptions = ["Todos", "Ativos", "Inativos"] as const;
type StatusFilter = (typeof statusOptions)[number];

const statusBadgeClassnames: Record<"Ativo" | "Inativo", string> = {
  Ativo: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Inativo: "border-rose-200 bg-rose-50 text-rose-700",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function EmptyState() {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
        <Users className="size-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-950">Nenhum usuário encontrado</h3>
      <p className="mt-2 text-sm text-slate-500">
        Ajuste a busca ou os filtros. Os usuários continuam sendo criados pelo fluxo de registro do sistema.
      </p>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Users;
  tone?: "default" | "warning" | "success";
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
        </div>
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl border",
            tone === "default" && "border-slate-200 bg-slate-50 text-slate-700",
            tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}

function getProfileLabel(profile: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null) {
  const normalized = Array.isArray(profile) ? profile[0] : profile;
  return normalized?.full_name ?? normalized?.email ?? "Equipe";
}

function getAuditDescription(log: AuditLogRow) {
  const targetName = getProfileLabel(log.target);
  const actorName = getProfileLabel(log.actor);

  switch (log.action) {
    case "role_changed":
      return `${actorName} alterou ${targetName} para ${roleLabels[(log.metadata?.next_role as UserRole) ?? "ATTENDANT"]}.`;
    case "user_deactivated":
      return `${actorName} desativou ${targetName}.`;
    case "user_activated":
      return `${actorName} reativou ${targetName}.`;
    default:
      return `${actorName} realizou uma alteração administrativa em ${targetName}.`;
  }
}

export function UserManagementPanel({ currentUserId }: UserManagementPanelProps) {
  const { pushToast } = useToast();
  const [profiles, setProfiles] = useState<UserProfileRecord[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "Todos">("Todos");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);

  useEffect(() => {
    void Promise.all([loadProfiles(), loadAuditLogs()]);
  }, []);

  async function loadProfiles() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError("Não foi possível carregar os usuários. Verifique as permissões do Supabase e tente novamente.");
      setLoading(false);
      return;
    }

    setProfiles((data ?? []) as UserProfileRecord[]);
    setLoading(false);
  }

  async function loadAuditLogs() {
    setAuditLoading(true);

    const supabase = createClient();
    const { data } = await supabase
      .from("admin_audit_log")
      .select(`
        id,
        action,
        created_at,
        metadata,
        actor:profiles!admin_audit_log_actor_id_fkey(full_name, email),
        target:profiles!admin_audit_log_target_user_id_fkey(full_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(8);

    setAuditLogs((data ?? []) as AuditLogRow[]);
    setAuditLoading(false);
  }

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();

    return profiles.filter((profile) => {
      const name = profile.full_name?.toLowerCase() ?? "";
      const email = profile.email?.toLowerCase() ?? "";
      const matchesSearch = !term || name.includes(term) || email.includes(term);
      const matchesRole = roleFilter === "Todos" ? true : profile.role === roleFilter;
      const matchesStatus =
        statusFilter === "Todos" ? true : statusFilter === "Ativos" ? profile.is_active : !profile.is_active;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [profiles, roleFilter, search, statusFilter]);

  const metrics = useMemo(() => {
    return {
      total: profiles.length,
      admins: profiles.filter((profile) => profile.role === "ADMIN").length,
      supervisors: profiles.filter((profile) => profile.role === "SUPERVISOR").length,
      attendants: profiles.filter((profile) => profile.role === "ATTENDANT").length,
      inactive: profiles.filter((profile) => !profile.is_active).length,
    };
  }, [profiles]);

  async function insertAuditLog(payload: { action: string; targetUserId: string; metadata?: Record<string, string | boolean | null> }) {
    const supabase = createClient();
    await supabase.from("admin_audit_log").insert({
      actor_id: currentUserId,
      target_user_id: payload.targetUserId,
      action: payload.action,
      metadata: payload.metadata ?? null,
    });
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;

    const supabase = createClient();
    setSavingUserId(pendingAction.user.id);
    setError(null);
    setFeedback(null);

    const payload =
      pendingAction.type === "role"
        ? { role: pendingAction.nextRole }
        : { is_active: pendingAction.nextActive };

    const { data, error: updateError } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", pendingAction.user.id)
      .select("id, email, full_name, role, is_active, created_at")
      .single();

    if (updateError) {
      setError(updateError.message || "Não foi possível salvar a alteração.");
      pushToast({ tone: "error", title: "Falha ao atualizar usuário", description: updateError.message });
      setSavingUserId(null);
      setPendingAction(null);
      return;
    }

    setProfiles((current) => current.map((profile) => (profile.id === data.id ? (data as UserProfileRecord) : profile)));

    try {
      if (pendingAction.type === "role") {
        await insertAuditLog({
          action: "role_changed",
          targetUserId: pendingAction.user.id,
          metadata: {
            previous_role: pendingAction.user.role,
            next_role: (data as UserProfileRecord).role,
          },
        });
      } else {
        await insertAuditLog({
          action: pendingAction.nextActive ? "user_activated" : "user_deactivated",
          targetUserId: pendingAction.user.id,
          metadata: { next_active: pendingAction.nextActive },
        });
      }
      await loadAuditLogs();
    } catch {
      // best effort: the core user update already succeeded.
    }

    const successMessage =
      pendingAction.type === "role"
        ? `Perfil de ${pendingAction.user.full_name ?? pendingAction.user.email ?? "usuário"} atualizado para ${roleLabels[(data as UserProfileRecord).role]}.`
        : pendingAction.nextActive
          ? `Usuário ${pendingAction.user.full_name ?? pendingAction.user.email ?? ""} reativado com sucesso.`
          : `Usuário ${pendingAction.user.full_name ?? pendingAction.user.email ?? ""} desativado com sucesso.`;

    setFeedback(successMessage);
    pushToast({ tone: "success", title: "Alteração salva", description: successMessage });
    setSavingUserId(null);
    setPendingAction(null);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Total de usuários"
          value={String(metrics.total)}
          description="Contas já cadastradas no Supabase Auth e sincronizadas no sistema."
          icon={Users}
        />
        <SummaryCard
          title="Admins"
          value={String(metrics.admins)}
          description="Contas com acesso total à área administrativa."
          icon={ShieldCheck}
          tone="success"
        />
        <SummaryCard
          title="Supervisores"
          value={String(metrics.supervisors)}
          description="Perfis voltados para coordenação e acompanhamento operacional."
          icon={UserCog}
        />
        <SummaryCard
          title="Atendentes"
          value={String(metrics.attendants)}
          description="Usuários focados em atendimento, atualização e operação diária."
          icon={Users}
        />
        <SummaryCard
          title="Inativos"
          value={String(metrics.inactive)}
          description="Contas sem acesso operacional até serem reativadas."
          icon={UserX}
          tone="warning"
        />
      </section>

      <section className="surface-card section-shell space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Gestão de usuários
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">Equipe, cargos e status de acesso</h2>
            <p className="max-w-3xl text-sm text-slate-500 sm:text-[15px]">
              Atualize cargos e status sem sair do painel. A busca agora aceita filtros por cargo e atividade, e a trilha de auditoria mostra as últimas mudanças feitas por administradores.
            </p>
          </div>

          <div className="grid gap-2 rounded-[22px] border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 sm:max-w-sm">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <p>
                Por segurança, sua própria conta não pode ser desativada ou rebaixada por esta tela.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_180px_170px_auto] xl:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              placeholder="Buscar por nome ou e-mail"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as UserRole | "Todos")}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="Todos">Todos os cargos</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <div className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600">
            <Filter className="size-4 text-slate-400" />
            {filteredProfiles.length} usuário(s)
          </div>
        </div>

        {feedback ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {feedback}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
              <Loader2 className="size-4 animate-spin" />
              Carregando usuários...
            </div>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-[24px] border border-slate-200 xl:block">
              <table className="min-w-full divide-y divide-slate-200 bg-white">
                <thead className="bg-slate-50/90 text-left text-sm text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">Usuário</th>
                    <th className="px-5 py-4 font-medium">Cargo</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Criado em</th>
                    <th className="px-5 py-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                  {filteredProfiles.map((profile) => {
                    const isSelf = profile.id === currentUserId;
                    const rowBusy = savingUserId === profile.id;
                    const statusLabel = profile.is_active ? "Ativo" : "Inativo";

                    return (
                      <tr key={profile.id} className="align-top">
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-950">{profile.full_name || "Usuário sem nome"}</p>
                              {isSelf ? <Badge className="border-slate-200 bg-slate-100 text-slate-700">Você</Badge> : null}
                            </div>
                            <p className="text-sm text-slate-500">{profile.email ?? "Sem e-mail"}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={profile.role}
                            disabled={rowBusy || isSelf}
                            onChange={(event) => {
                              const nextRole = event.target.value as UserRole;
                              if (nextRole === profile.role) return;
                              setPendingAction({ type: "role", user: profile, nextRole });
                            }}
                            className="h-10 min-w-[170px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus-visible:ring-4 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                          >
                            {roleOptions.map((role) => (
                              <option key={role} value={role}>
                                {roleLabels[role]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <Badge className={cn("border", statusBadgeClassnames[statusLabel])}>{statusLabel}</Badge>
                        </td>
                        <td className="px-5 py-4 text-slate-500">{formatDate(profile.created_at)}</td>
                        <td className="px-5 py-4">
                          <Button
                            variant={profile.is_active ? "outline" : "default"}
                            size="sm"
                            disabled={rowBusy || isSelf}
                            onClick={() => setPendingAction({ type: "status", user: profile, nextActive: !profile.is_active })}
                            className={cn(
                              profile.is_active && "border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50",
                              !profile.is_active && "bg-emerald-600 hover:bg-emerald-700",
                            )}
                          >
                            {rowBusy ? <Loader2 className="size-4 animate-spin" /> : null}
                            {profile.is_active ? "Desativar" : "Ativar"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 xl:hidden">
              {filteredProfiles.map((profile) => {
                const isSelf = profile.id === currentUserId;
                const rowBusy = savingUserId === profile.id;
                const statusLabel = profile.is_active ? "Ativo" : "Inativo";

                return (
                  <Card key={profile.id} className="overflow-hidden">
                    <CardContent className="space-y-4 p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold text-slate-950">{profile.full_name || "Usuário sem nome"}</p>
                            {isSelf ? <Badge className="border-slate-200 bg-slate-100 text-slate-700">Você</Badge> : null}
                          </div>
                          <p className="mt-1 break-all text-sm text-slate-500">{profile.email ?? "Sem e-mail"}</p>
                        </div>
                        <Badge className={cn("border", statusBadgeClassnames[statusLabel])}>{statusLabel}</Badge>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Cargo</p>
                          <select
                            value={profile.role}
                            disabled={rowBusy || isSelf}
                            onChange={(event) => {
                              const nextRole = event.target.value as UserRole;
                              if (nextRole === profile.role) return;
                              setPendingAction({ type: "role", user: profile, nextRole });
                            }}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus-visible:ring-4 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                          >
                            {roleOptions.map((role) => (
                              <option key={role} value={role}>
                                {roleLabels[role]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Criado em</p>
                          <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                            {formatDate(profile.created_at)}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant={profile.is_active ? "outline" : "default"}
                        className={cn(
                          "w-full",
                          profile.is_active && "border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50",
                          !profile.is_active && "bg-emerald-600 hover:bg-emerald-700",
                        )}
                        disabled={rowBusy || isSelf}
                        onClick={() => setPendingAction({ type: "status", user: profile, nextActive: !profile.is_active })}
                      >
                        {rowBusy ? <Loader2 className="size-4 animate-spin" /> : null}
                        {profile.is_active ? "Desativar usuário" : "Ativar usuário"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle>Últimas ações administrativas</CardTitle>
            <CardDescription>
              Mudanças recentes de cargos e status feitas por contas admin. Isso ajuda na auditoria do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
            {auditLoading ? (
              <div className="flex min-h-[180px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                  <Loader2 className="size-4 animate-spin" />
                  Carregando trilha administrativa...
                </div>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center">
                <p className="font-medium text-slate-900">Nenhuma ação administrativa registrada ainda.</p>
                <p className="mt-1 text-sm text-slate-500">As mudanças de cargo e ativação vão aparecer aqui automaticamente.</p>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                      {log.action === "role_changed" ? "Cargo" : log.action === "user_activated" ? "Reativação" : "Desativação"}
                    </Badge>
                    <p className="text-sm font-medium text-slate-950">{getAuditDescription(log)}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{formatDate(log.created_at)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle>Resumo administrativo</CardTitle>
            <CardDescription>Atalhos mentais para revisar a equipe antes de mexer em acessos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 text-sm text-slate-600 sm:p-6 sm:pt-0">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-900">{metrics.inactive} conta(s) inativa(s)</p>
              <p className="mt-1 text-slate-500">Use este número para revisar contas desligadas ou acesso temporariamente suspenso.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-900">{metrics.admins} admin(s) ativo(s)</p>
              <p className="mt-1 text-slate-500">Evite excesso de administradores e mantenha a governança centralizada.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-900">{filteredProfiles.length} usuário(s) no filtro atual</p>
              <p className="mt-1 text-slate-500">Combine busca, cargo e status para encontrar a pessoa certa mais rápido.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-white/80 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Confirmar alteração</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {pendingAction.type === "role"
                    ? `Alterar o cargo de ${pendingAction.user.full_name ?? pendingAction.user.email ?? "usuário"} para ${roleLabels[pendingAction.nextRole]}?`
                    : pendingAction.nextActive
                      ? `Reativar ${pendingAction.user.full_name ?? pendingAction.user.email ?? "usuário"} e devolver o acesso ao painel?`
                      : `Desativar ${pendingAction.user.full_name ?? pendingAction.user.email ?? "usuário"} e bloquear o acesso ao painel?`}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              As mudanças são salvas imediatamente no Supabase. O usuário verá a alteração na próxima navegação ou atualização de página.
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setPendingAction(null)} disabled={savingUserId !== null}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmAction} disabled={savingUserId !== null}>
                {savingUserId ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
