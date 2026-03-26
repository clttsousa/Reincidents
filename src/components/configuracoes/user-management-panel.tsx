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
import { Textarea } from "@/components/ui/textarea";
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
  last_login_at?: string | null;
  disabled_reason?: string | null;
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

function formatLastLogin(value?: string | null) {
  if (!value) return "Sem registro";
  return formatDate(value);
}

function EmptyState() {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
        <Users className="size-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-950 dark:text-slate-50">Nenhum usuário encontrado</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
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
            tone === "default" && "border-slate-200 bg-slate-50 text-slate-700 dark:text-slate-300",
            tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{description}</p>
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
  const reason = typeof log.metadata?.reason === "string" && log.metadata.reason ? ` Motivo: ${log.metadata.reason}.` : "";

  switch (log.action) {
    case "role_changed":
      return `${actorName} alterou ${targetName} para ${roleLabels[(log.metadata?.next_role as UserRole) ?? "ATTENDANT"]}.${reason}`;
    case "user_deactivated":
      return `${actorName} desativou ${targetName}.${reason}`;
    case "user_activated":
      return `${actorName} reativou ${targetName}.${reason}`;
    default:
      return `${actorName} realizou uma alteração administrativa em ${targetName}.${reason}`;
  }
}

async function selectProfilesWithFallback() {
  const supabase = createClient();
  const withExtendedFields = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active, created_at, last_login_at, disabled_reason")
    .order("created_at", { ascending: false });

  if (!withExtendedFields.error) {
    return withExtendedFields;
  }

  return supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active, created_at")
    .order("created_at", { ascending: false });
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
  const [actionReason, setActionReason] = useState("");

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await selectProfilesWithFallback();

    if (fetchError) {
      setError("Não foi possível carregar os usuários. Verifique as permissões do Supabase e tente novamente.");
      setLoading(false);
      return;
    }

    setProfiles((data ?? []) as UserProfileRecord[]);
    setLoading(false);
  };

  const loadAuditLogs = async () => {
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
  };

  useEffect(() => {
    void Promise.all([loadProfiles(), loadAuditLogs()]);
  }, []);

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

  const persistFallbackAuditLog = async (payload: { action: string; targetUserId: string; metadata?: Record<string, string | boolean | null> }) => {
    const supabase = createClient();
    await supabase.from("admin_audit_log").insert({
      actor_id: currentUserId,
      target_user_id: payload.targetUserId,
      action: payload.action,
      metadata: payload.metadata ?? null,
    });
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    const supabase = createClient();
    setSavingUserId(pendingAction.user.id);
    setError(null);
    setFeedback(null);

    const reason = actionReason.trim() || null;
    let successMessage = "Alteração salva com sucesso.";

    try {
      const { data, error: rpcError } = await supabase.rpc("admin_update_profile", {
        target_user_id: pendingAction.user.id,
        next_role: pendingAction.type === "role" ? pendingAction.nextRole : null,
        next_active: pendingAction.type === "status" ? pendingAction.nextActive : null,
        reason,
      });

      if (rpcError) throw rpcError;

      const normalized = Array.isArray(data) ? data[0] : data;
      if (normalized?.id) {
        setProfiles((current) => current.map((profile) => (profile.id === normalized.id ? ({ ...profile, ...normalized } as UserProfileRecord) : profile)));
      } else {
        await loadProfiles();
      }

      successMessage =
        pendingAction.type === "role"
          ? `Perfil de ${pendingAction.user.full_name ?? pendingAction.user.email ?? "usuário"} atualizado para ${roleLabels[pendingAction.nextRole]}.`
          : pendingAction.nextActive
            ? `Usuário ${pendingAction.user.full_name ?? pendingAction.user.email ?? ""} reativado com sucesso.`
            : `Usuário ${pendingAction.user.full_name ?? pendingAction.user.email ?? ""} desativado com sucesso.`;
    } catch (rpcError) {
      const message = rpcError instanceof Error ? rpcError.message : String(rpcError);
      const functionMissing = message.includes("admin_update_profile") || message.includes("Could not find the function");

      if (!functionMissing) {
        setError(message || "Não foi possível salvar a alteração.");
        pushToast({ tone: "error", title: "Falha ao atualizar usuário", description: message });
        setSavingUserId(null);
        return;
      }

      const payload =
        pendingAction.type === "role"
          ? { role: pendingAction.nextRole }
          : { is_active: pendingAction.nextActive, disabled_reason: pendingAction.nextActive ? null : reason };

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
        return;
      }

      setProfiles((current) => current.map((profile) => (profile.id === data.id ? ({ ...profile, ...(data as UserProfileRecord), disabled_reason: pendingAction.type === "status" && !pendingAction.nextActive ? reason : null } as UserProfileRecord) : profile)));

      try {
        await persistFallbackAuditLog({
          action: pendingAction.type === "role" ? "role_changed" : pendingAction.nextActive ? "user_activated" : "user_deactivated",
          targetUserId: pendingAction.user.id,
          metadata:
            pendingAction.type === "role"
              ? { previous_role: pendingAction.user.role, next_role: pendingAction.nextRole, reason }
              : { next_active: pendingAction.nextActive, reason },
        });
      } catch {
        // Best effort para bases antigas.
      }

      successMessage =
        pendingAction.type === "role"
          ? `Perfil de ${pendingAction.user.full_name ?? pendingAction.user.email ?? "usuário"} atualizado para ${roleLabels[pendingAction.nextRole]}.`
          : pendingAction.nextActive
            ? `Usuário ${pendingAction.user.full_name ?? pendingAction.user.email ?? ""} reativado com sucesso.`
            : `Usuário ${pendingAction.user.full_name ?? pendingAction.user.email ?? ""} desativado com sucesso.`;
    }

    await loadAuditLogs();
    setFeedback(successMessage);
    pushToast({ tone: "success", title: "Alteração salva", description: successMessage });
    setSavingUserId(null);
    setActionReason("");
    setPendingAction(null);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="Total de usuários" value={String(metrics.total)} description="Contas já cadastradas no Supabase Auth e sincronizadas no sistema." icon={Users} />
        <SummaryCard title="Admins" value={String(metrics.admins)} description="Contas com acesso total à área administrativa." icon={ShieldCheck} tone="success" />
        <SummaryCard title="Supervisores" value={String(metrics.supervisors)} description="Perfis voltados para coordenação e acompanhamento operacional." icon={UserCog} />
        <SummaryCard title="Atendentes" value={String(metrics.attendants)} description="Usuários focados em atendimento, atualização e operação diária." icon={Users} />
        <SummaryCard title="Inativos" value={String(metrics.inactive)} description="Contas sem acesso operacional até serem reativadas." icon={UserX} tone="warning" />
      </section>

      <section className="surface-card section-shell space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 dark:text-slate-500">
              Gestão de usuários
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">Equipe, cargos e status de acesso</h2>
            <p className="max-w-3xl text-sm text-slate-500 sm:text-[15px]">
              Agora as alterações administrativas podem registrar motivo, mostrar último acesso e usar uma função segura no banco quando a migração v4.0 já estiver aplicada.
            </p>
          </div>

          <div className="grid gap-2 rounded-[22px] border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 sm:max-w-sm">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <p>Por segurança, sua própria conta não pode ser desativada ou rebaixada por esta tela.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_180px_170px_auto] xl:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar por nome ou e-mail" />
          </div>

          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | "Todos")} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <option value="Todos">Todos os cargos</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <div className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 dark:text-slate-400 dark:text-slate-500">
            <Filter className="size-4 text-slate-400 dark:text-slate-500" />
            {filteredProfiles.length} encontrado(s)
          </div>
        </div>

        {feedback ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="h-[240px] animate-pulse bg-slate-50/70 dark:bg-slate-800/40" />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-[24px] border border-slate-200 lg:block">
              <div className="grid grid-cols-[minmax(220px,1.2fr)_140px_140px_150px_150px_170px] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500">
                <span>Usuário</span>
                <span>Cargo</span>
                <span>Status</span>
                <span>Criado em</span>
                <span>Último acesso</span>
                <span>Ações</span>
              </div>
              <div className="divide-y divide-slate-200 bg-white dark:bg-slate-800/60">
                {filteredProfiles.map((profile) => {
                  const isSelf = profile.id === currentUserId;
                  const rowBusy = savingUserId === profile.id;
                  const statusLabel = profile.is_active ? "Ativo" : "Inativo";

                  return (
                    <div key={profile.id} className="grid grid-cols-[minmax(220px,1.2fr)_140px_140px_150px_150px_170px] gap-4 px-6 py-5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-slate-950 dark:text-slate-50">{profile.full_name || "Usuário sem nome"}</p>
                          {isSelf ? <Badge className="border-slate-200 bg-slate-100 text-slate-700 dark:text-slate-300">Você</Badge> : null}
                        </div>
                        <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{profile.email ?? "Sem e-mail"}</p>
                        {!profile.is_active && profile.disabled_reason ? <p className="mt-2 text-xs text-rose-600">Motivo: {profile.disabled_reason}</p> : null}
                      </div>

                      <div>
                        <select
                          value={profile.role}
                          disabled={rowBusy || isSelf}
                          onChange={(event) => {
                            const nextRole = event.target.value as UserRole;
                            if (nextRole === profile.role) return;
                            setActionReason("");
                            setPendingAction({ type: "role", user: profile, nextRole });
                          }}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus-visible:ring-4 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:text-slate-500"
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Badge className={cn("border", statusBadgeClassnames[statusLabel])}>{statusLabel}</Badge>
                      </div>

                      <div className="text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">{formatDate(profile.created_at)}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">{formatLastLogin(profile.last_login_at)}</div>

                      <div>
                        <Button
                          variant={profile.is_active ? "outline" : "default"}
                          className={cn(
                            "w-full",
                            profile.is_active && "border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50",
                            !profile.is_active && "bg-emerald-600 hover:bg-emerald-700",
                          )}
                          disabled={rowBusy || isSelf}
                          onClick={() => {
                            setActionReason(profile.is_active ? profile.disabled_reason ?? "" : "");
                            setPendingAction({ type: "status", user: profile, nextActive: !profile.is_active });
                          }}
                        >
                          {rowBusy ? <Loader2 className="size-4 animate-spin" /> : null}
                          {profile.is_active ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 lg:hidden">
              {filteredProfiles.map((profile) => {
                const isSelf = profile.id === currentUserId;
                const rowBusy = savingUserId === profile.id;
                const statusLabel = profile.is_active ? "Ativo" : "Inativo";

                return (
                  <Card key={profile.id}>
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium text-slate-950 dark:text-slate-50">{profile.full_name || "Usuário sem nome"}</p>
                            {isSelf ? <Badge className="border-slate-200 bg-slate-100 text-slate-700 dark:text-slate-300">Você</Badge> : null}
                          </div>
                          <p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">{profile.email ?? "Sem e-mail"}</p>
                          {!profile.is_active && profile.disabled_reason ? <p className="mt-2 text-xs text-rose-600">Motivo: {profile.disabled_reason}</p> : null}
                        </div>
                        <Badge className={cn("border", statusBadgeClassnames[statusLabel])}>{statusLabel}</Badge>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Cargo</p>
                          <select
                            value={profile.role}
                            disabled={rowBusy || isSelf}
                            onChange={(event) => {
                              const nextRole = event.target.value as UserRole;
                              if (nextRole === profile.role) return;
                              setActionReason("");
                              setPendingAction({ type: "role", user: profile, nextRole });
                            }}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus-visible:ring-4 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:text-slate-500"
                          >
                            {roleOptions.map((role) => (
                              <option key={role} value={role}>
                                {roleLabels[role]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Criado em</p>
                          <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">{formatDate(profile.created_at)}</div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Último acesso</p>
                          <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">{formatLastLogin(profile.last_login_at)}</div>
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Status</p>
                          <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">{statusLabel}</div>
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
                        onClick={() => {
                          setActionReason(profile.is_active ? profile.disabled_reason ?? "" : "");
                          setPendingAction({ type: "status", user: profile, nextActive: !profile.is_active });
                        }}
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
            <CardDescription>Promoções, reativações e desativações recentes com motivo quando informado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
            {auditLoading ? (
              <div className="flex min-h-[180px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  <Loader2 className="size-4 animate-spin" />
                  Carregando trilha administrativa...
                </div>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center">
                <p className="font-medium text-slate-900 dark:text-slate-100">Nenhuma ação administrativa registrada ainda.</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">As mudanças de cargo e ativação vão aparecer aqui automaticamente.</p>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-700 dark:text-slate-300">
                      {log.action === "role_changed" ? "Cargo" : log.action === "user_activated" ? "Reativação" : "Desativação"}
                    </Badge>
                    <p className="text-sm font-medium text-slate-950 dark:text-slate-50">{getAuditDescription(log)}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{formatDate(log.created_at)}</p>
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
              <p className="font-medium text-slate-900 dark:text-slate-100">{metrics.inactive} conta(s) inativa(s)</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400 dark:text-slate-500">Use este número para revisar contas desligadas ou acesso temporariamente suspenso.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-900 dark:text-slate-100">{metrics.admins} admin(s)</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400 dark:text-slate-500">A função v4.0 impede desativar ou rebaixar o último admin ativo.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="font-medium text-slate-900 dark:text-slate-100">{filteredProfiles.length} usuário(s) no filtro atual</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400 dark:text-slate-500">Combine busca, cargo e status para encontrar a pessoa certa mais rápido.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-white/80 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:text-slate-300">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Confirmar alteração</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  {pendingAction.type === "role"
                    ? `Alterar o cargo de ${pendingAction.user.full_name ?? pendingAction.user.email ?? "usuário"} para ${roleLabels[pendingAction.nextRole]}?`
                    : pendingAction.nextActive
                      ? `Reativar ${pendingAction.user.full_name ?? pendingAction.user.email ?? "usuário"} e devolver o acesso ao painel?`
                      : `Desativar ${pendingAction.user.full_name ?? pendingAction.user.email ?? "usuário"} e bloquear o acesso ao painel?`}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">
              Quando a migração v4.0 estiver aplicada, a mudança passa por uma função segura no banco e já registra a trilha administrativa automaticamente.
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-800">Motivo {pendingAction.type === "status" && !pendingAction.nextActive ? "(recomendado)" : "(opcional)"}</label>
              <Textarea value={actionReason} onChange={(event) => setActionReason(event.target.value)} placeholder="Ex.: desligamento da equipe, ajuste de governança, conta temporária." className="min-h-[110px]" />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => { setPendingAction(null); setActionReason(""); }} disabled={savingUserId !== null}>
                Cancelar
              </Button>
              <Button onClick={() => void handleConfirmAction()} disabled={savingUserId !== null}>
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
