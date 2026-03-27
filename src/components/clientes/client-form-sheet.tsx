"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Info,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  clientToFormValues,
  formatDateLabel,
  formatPhoneInput,
  statusOptions,
  validateClientForm,
} from "@/lib/client-helpers";
import { useOverlayBehavior } from "@/hooks/use-overlay-behavior";
import { cn } from "@/lib/utils";
import type { AssigneeOption, ClientFormValues, ClientRecord } from "@/types/mock";

interface ClientFormSheetProps {
  open: boolean;
  mode: "create" | "edit";
  client?: ClientRecord | null;
  assignees: AssigneeOption[];
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: ClientFormValues) => Promise<boolean>;
}

export function ClientFormSheet({
  open,
  mode,
  client,
  assignees,
  submitting = false,
  onClose,
  onSubmit,
}: ClientFormSheetProps) {
  const [values, setValues] = useState<ClientFormValues>(clientToFormValues());
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormValues, string>>>({});
  const panelRef = useOverlayBehavior({ open, onClose, disableClose: submitting });

  useEffect(() => {
    if (!open) return;
    setValues(clientToFormValues(client ?? undefined));
    setErrors({});
  }, [client, open]);

  const updateValue = <K extends keyof ClientFormValues>(field: K, value: ClientFormValues[K]) => {
    setValues((current) => {
      const next: ClientFormValues = { ...current, [field]: value } as ClientFormValues;

      if (field === "phone") {
        next.phone = formatPhoneInput(String(value ?? ""));
      }

      if (field === "status") {
        if (value === "O.S. aberta") {
          next.osOpen = true;
          next.resolved = false;
        } else if (value === "Resolvido") {
          next.osOpen = false;
          next.resolved = true;
        } else {
          next.osOpen = false;
          next.resolved = false;
        }
      }

      if (field === "resolved") {
        if (value === true) {
          next.status = "Resolvido";
          next.osOpen = false;
        } else if (next.status === "Resolvido") {
          next.status = next.osOpen ? "O.S. aberta" : "Aguardando contato";
        }
      }

      if (field === "osOpen") {
        if (value === true && next.status !== "Resolvido") {
          next.status = "O.S. aberta";
        } else if (value === false && next.status === "O.S. aberta") {
          next.status = "Aguardando contato";
        }
      }

      if (field === "resolved" && value === true) {
        next.osNumber = next.osNumber || client?.osNumber || "OS-";
      }

      return next;
    });

    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateClientForm(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    const success = await onSubmit(values);
    if (success) onClose();
  };

  const selectedAssignee = useMemo(
    () => assignees.find((assignee) => assignee.id === values.responsibleUserId),
    [assignees, values.responsibleUserId],
  );

  const statusSummary = [
    {
      label: "Recorrências",
      value: `${values.totalServices}x`,
      helper: values.totalServices > 5 ? "Carteira com pressão recorrente." : "Caso em acompanhamento controlado.",
      icon: Sparkles,
    },
    {
      label: "Status",
      value: values.status,
      helper: values.resolved ? "Ciclo concluído nesta etapa." : "Mantém a fila operacional alinhada.",
      icon: ShieldCheck,
    },
    {
      label: "Próxima ação",
      value: values.nextActionAt ? formatDateLabel(values.nextActionAt) : "Não agendada",
      helper: values.nextActionAt ? "Prazo visível para a equipe." : "Defina o próximo movimento do caso.",
      icon: Calendar,
    },
  ];

  const operationToggles = [
    {
      key: "osOpen" as const,
      label: "O.S. em aberto",
      helper: "Mantém o caso na carga ativa da operação.",
      active: values.osOpen,
      tone: values.osOpen ? "indigo" : "neutral",
      icon: Info,
      onClick: () => updateValue("osOpen", !values.osOpen),
    },
    {
      key: "resolved" as const,
      label: "Caso resolvido",
      helper: "Fecha o ciclo atual sem sair da tela.",
      active: values.resolved,
      tone: values.resolved ? "emerald" : "neutral",
      icon: CheckCircle2,
      onClick: () => updateValue("resolved", !values.resolved),
    },
  ];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="dialog-backdrop fixed inset-0 z-[80] overflow-y-auto px-3 py-4 sm:px-6 sm:py-8"
          onClick={(event) => {
            if (event.target === event.currentTarget && !submitting) onClose();
          }}
          role="dialog"
          aria-modal="true"
          aria-label={mode === "create" ? "Cadastrar cliente" : `Editar ${client?.name ?? "cliente"}`}
        >
          <div className="flex min-h-full items-center justify-center">
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 22, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.985 }}
              transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.72 }}
              className="dialog-shell relative flex max-h-[min(92vh,880px)] w-full max-w-[980px] flex-col overflow-hidden rounded-[30px]"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.14),transparent_46%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_34%)]" />

              <div className="relative border-b border-slate-100/90 px-4 py-5 dark:border-slate-800/60 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Badge
                      variant="outline"
                      className="rounded-full border-indigo-200 bg-indigo-50/90 px-3 py-1 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/12 dark:text-indigo-300"
                    >
                      {mode === "create" ? "Novo cliente" : "Editar cadastro"}
                    </Badge>
                    <h2 className="mt-3 text-[1.55rem] font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50 sm:text-[1.72rem]">
                      {mode === "create" ? "Cadastrar cliente" : client?.name}
                    </h2>
                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Cadastro em modal central, mais compacto e com leitura mais limpa do formulário.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="shrink-0 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    disabled={submitting}
                  >
                    <X className="size-5" />
                  </Button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="relative flex min-h-0 flex-1 flex-col">
                <div className="custom-scrollbar scroll-stable flex-1 overflow-y-auto px-4 pb-5 pt-4 sm:px-6">
                  <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-start">
                    <aside className="space-y-4 xl:sticky xl:top-0">
                      <section className="surface-dark rounded-[26px] p-4 text-white">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">Resumo do cadastro</p>
                        <h3 className="mt-2 text-xl font-semibold tracking-tight">
                          {mode === "create" ? "Sem travar a visualização" : "Edição rápida e contextual"}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-200">
                          O foco fica no essencial, com os campos principais visíveis e rolagem só dentro do modal.
                        </p>

                        <div className="mt-4 space-y-3">
                          {statusSummary.map((item) => {
                            const Icon = item.icon;
                            return (
                              <div key={item.label} className="rounded-[20px] border border-white/10 bg-white/8 px-4 py-3">
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                                    <Icon className="h-[18px] w-[18px]" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">{item.label}</p>
                                    <p className="mt-1 truncate text-sm font-medium text-white">{item.value}</p>
                                    <p className="mt-1 text-xs leading-5 text-white/62">{item.helper}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>

                      <section className="dialog-section-muted space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Ajustes rápidos</p>
                        </div>

                        <div className="space-y-3">
                          {operationToggles.map((item) => {
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={item.onClick}
                                className={cn(
                                  "flex w-full items-center justify-between gap-3 rounded-[20px] border px-4 py-3 text-left transition-all",
                                  item.tone === "indigo" && item.active && "border-indigo-200 bg-indigo-50/85 dark:border-indigo-500/25 dark:bg-indigo-500/12",
                                  item.tone === "emerald" && item.active && "border-emerald-200 bg-emerald-50/85 dark:border-emerald-500/25 dark:bg-emerald-500/12",
                                  !item.active && "border-slate-200/80 bg-white/90 dark:border-slate-700/50 dark:bg-slate-900/50",
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "flex h-10 w-10 items-center justify-center rounded-2xl",
                                      item.tone === "indigo" && item.active && "bg-indigo-600 text-white",
                                      item.tone === "emerald" && item.active && "bg-emerald-600 text-white",
                                      !item.active && "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
                                    )}
                                  >
                                    <Icon className="h-[18px] w-[18px]" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-950 dark:text-slate-50">{item.label}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.helper}</p>
                                  </div>
                                </div>
                                <div
                                  className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                                    item.tone === "indigo" && item.active && "border-indigo-600 bg-indigo-600",
                                    item.tone === "emerald" && item.active && "border-emerald-600 bg-emerald-600",
                                    !item.active && "border-slate-300 dark:border-slate-600",
                                  )}
                                >
                                  {item.active ? <CheckCircle2 className="h-5 w-5 text-white" /> : null}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="rounded-[20px] border border-slate-200/80 bg-white/90 px-4 py-3 dark:border-slate-700/50 dark:bg-slate-900/50">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                              <UserRound className="h-[18px] w-[18px]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Responsável</p>
                              <p className="truncate text-sm font-medium text-slate-950 dark:text-slate-50">
                                {selectedAssignee?.name ?? "Ainda não selecionado"}
                              </p>
                              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {selectedAssignee?.email ?? "Escolha um usuário para assumir o caso."}
                              </p>
                            </div>
                          </div>
                        </div>

                        {client?.updatedAt ? (
                          <div className="flex items-center gap-2 rounded-[18px] border border-slate-200/80 bg-white/90 px-4 py-3 text-xs text-slate-500 dark:border-slate-700/50 dark:bg-slate-900/50 dark:text-slate-400">
                            <Clock3 className="h-[14px] w-[14px]" />
                            Última atualização em {formatDateLabel(client.updatedAt)}
                          </div>
                        ) : null}
                      </section>
                    </aside>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <section className="dialog-section lg:col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Contato e responsável</h3>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome completo</label>
                            <Input
                              value={values.name}
                              onChange={(e) => updateValue("name", e.target.value)}
                              placeholder="Ex: João Silva"
                              className={cn("h-12 rounded-2xl", errors.name && "border-rose-500 focus:ring-rose-500/15")}
                            />
                            {errors.name ? <p className="text-xs font-medium text-rose-500">{errors.name}</p> : null}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone / WhatsApp</label>
                            <Input
                              value={values.phone}
                              onChange={(e) => updateValue("phone", e.target.value)}
                              placeholder="(00) 00000-0000"
                              className={cn("h-12 rounded-2xl", errors.phone && "border-rose-500 focus:ring-rose-500/15")}
                            />
                            {errors.phone ? <p className="text-xs font-medium text-rose-500">{errors.phone}</p> : null}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Responsável</label>
                            <select
                              value={values.responsibleUserId}
                              onChange={(e) => updateValue("responsibleUserId", e.target.value)}
                              className={cn(
                                "h-12 w-full rounded-2xl border border-slate-200/90 bg-white/95 px-4 text-sm text-slate-950 outline-none transition-all focus:border-blue-400/70 focus:ring-4 focus:ring-blue-500/12 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-indigo-500/60 dark:focus:ring-indigo-500/15",
                                errors.responsibleUserId && "border-rose-500 focus:ring-rose-500/15",
                              )}
                            >
                              <option value="">Selecione um responsável</option>
                              {assignees.map((assignee) => (
                                <option key={assignee.id} value={assignee.id}>
                                  {assignee.name}
                                </option>
                              ))}
                            </select>
                            {errors.responsibleUserId ? <p className="text-xs font-medium text-rose-500">{errors.responsibleUserId}</p> : null}
                          </div>
                        </div>
                      </section>

                      <section className="dialog-section">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Status e agenda</h3>
                        </div>

                        <div className="mt-4 grid gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status atual</label>
                            <select
                              value={values.status}
                              onChange={(e) => updateValue("status", e.target.value as ClientFormValues["status"])}
                              className="h-12 w-full rounded-2xl border border-slate-200/90 bg-white/95 px-4 text-sm text-slate-950 outline-none transition-all focus:border-blue-400/70 focus:ring-4 focus:ring-blue-500/12 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-indigo-500/60 dark:focus:ring-indigo-500/15"
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Recorrências registradas</label>
                            <Input
                              type="number"
                              min={1}
                              value={String(values.totalServices)}
                              onChange={(e) => updateValue("totalServices", Math.max(1, Number(e.target.value || 1)))}
                              placeholder="1"
                              className={cn("h-12 rounded-2xl", errors.totalServices && "border-rose-500 focus:ring-rose-500/15")}
                            />
                            {errors.totalServices ? <p className="text-xs font-medium text-rose-500">{errors.totalServices}</p> : null}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Número da O.S.</label>
                            <Input
                              value={values.osNumber}
                              onChange={(e) => updateValue("osNumber", e.target.value)}
                              placeholder="Ex: OS-12345"
                              className={cn("h-12 rounded-2xl", errors.osNumber && "border-rose-500 focus:ring-rose-500/15")}
                            />
                            {errors.osNumber ? <p className="text-xs font-medium text-rose-500">{errors.osNumber}</p> : null}
                          </div>
                        </div>
                      </section>

                      <section className="dialog-section">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Datas operacionais</h3>
                        </div>

                        <div className="mt-4 grid gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Último contato</label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <Input
                                type="datetime-local"
                                value={values.lastContactAt}
                                onChange={(e) => updateValue("lastContactAt", e.target.value)}
                                className="h-12 rounded-2xl pl-10"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Próxima ação</label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <Input
                                type="datetime-local"
                                value={values.nextActionAt}
                                onChange={(e) => updateValue("nextActionAt", e.target.value)}
                                className={cn("h-12 rounded-2xl pl-10", errors.nextActionAt && "border-rose-500 focus:ring-rose-500/15")}
                              />
                            </div>
                            {errors.nextActionAt ? <p className="text-xs font-medium text-rose-500">{errors.nextActionAt}</p> : null}
                          </div>
                        </div>
                      </section>

                      <section className="dialog-section lg:col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Contexto do caso</h3>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrição do caso</label>
                            <Textarea
                              value={values.description}
                              onChange={(e) => updateValue("description", e.target.value)}
                              placeholder="Resumo do problema relatado, combinados e contexto operacional."
                              className="min-h-[132px] rounded-[22px] border-slate-200/90 bg-white/95 p-4 dark:border-slate-700/60 dark:bg-slate-800/80"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notas internas</label>
                            <Textarea
                              value={values.notes}
                              onChange={(e) => updateValue("notes", e.target.value)}
                              placeholder="Detalhes para a equipe, contexto técnico ou orientação de follow-up."
                              className={cn(
                                "min-h-[132px] rounded-[22px] border-slate-200/90 bg-white/95 p-4 dark:border-slate-700/60 dark:bg-slate-800/80",
                                errors.notes && "border-rose-500",
                              )}
                            />
                            {errors.notes ? <p className="text-xs font-medium text-rose-500">{errors.notes}</p> : null}
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100/90 bg-white/92 px-4 py-4 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-950/65 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {mode === "create"
                        ? "Cadastro mais compacto, com foco no formulário e sem quebrar a leitura da carteira."
                        : "Edite o cliente com contexto preservado e salvamento rápido."}
                    </p>

                    <div className="flex gap-3 sm:justify-end">
                      <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={onClose} disabled={submitting}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1 sm:flex-none" disabled={submitting}>
                        {submitting ? (
                          <span className="flex items-center gap-2">
                            <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                            Salvando...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            {mode === "create" ? "Cadastrar cliente" : "Salvar alterações"}
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
