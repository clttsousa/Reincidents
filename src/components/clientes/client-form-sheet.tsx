"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Info,
  Save,
  ShieldCheck,
  Sparkles,
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

  const statusSummary = [
    { label: "Recorrências", value: `${values.totalServices}x`, icon: Sparkles },
    { label: "Status", value: values.status, icon: ShieldCheck },
    { label: "Próxima ação", value: values.nextActionAt ? formatDateLabel(values.nextActionAt) : "Não agendada", icon: Calendar },
  ];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-[80] bg-slate-950/45 p-3 backdrop-blur-md sm:p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget && !submitting) onClose();
          }}
        >
          <div className="flex h-full items-center justify-center">
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 26, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.985 }}
              transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.7 }}
              className="surface-card relative flex max-h-[94vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-[32px] border-none shadow-[0_36px_120px_-44px_rgba(15,23,42,0.45)]"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_48%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_38%)]" />

              <div className="relative flex items-start justify-between gap-4 border-b border-slate-100/90 px-6 py-6 dark:border-slate-800/60 sm:px-8">
                <div className="min-w-0">
                  <Badge variant="outline" className="rounded-full border-indigo-200 bg-indigo-50/90 px-3 py-1 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/12 dark:text-indigo-300">
                    {mode === "create" ? "Novo cliente" : "Editar cadastro"}
                  </Badge>
                  <h2 className="mt-4 text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                    {mode === "create" ? "Cadastrar cliente" : client?.name}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {mode === "create"
                      ? "Modal central com foco no essencial: contato, responsável, status e próxima ação."
                      : "Atualize o contexto do cliente sem perder a leitura da carteira ao fundo."}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="mt-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  disabled={submitting}
                >
                  <X className="size-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="relative flex min-h-0 flex-1 flex-col">
                <div className="custom-scrollbar flex-1 overflow-y-auto px-6 pb-6 pt-6 sm:px-8">
                  <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
                    <aside className="space-y-4">
                      <div className="surface-dark rounded-[28px] p-5 text-white">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">Resumo rápido</p>
                        <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                          {mode === "create" ? "Cadastro limpo, sem travar a tela" : "Atualize sem perder contexto"}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-200">
                          A ação agora acontece em modal central, com rolagem interna, animação suave e áreas agrupadas por contexto.
                        </p>

                        <div className="mt-5 space-y-3">
                          {statusSummary.map((item) => {
                            const Icon = item.icon;
                            return (
                              <div key={item.label} className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/8 px-4 py-3">
                                <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                                  <Icon className="size-4.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">{item.label}</p>
                                  <p className="mt-1 truncate text-sm font-medium text-white">{item.value}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="surface-muted rounded-[28px] p-5">
                        <div className="flex items-center gap-2">
                          <div className="size-1.5 rounded-full bg-indigo-500" />
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Operação</p>
                        </div>
                        <div className="mt-4 grid gap-3">
                          <button
                            type="button"
                            onClick={() => updateValue("osOpen", !values.osOpen)}
                            className={cn(
                              "flex items-center justify-between rounded-[22px] border px-4 py-4 text-left transition-all",
                              values.osOpen
                                ? "border-indigo-200 bg-indigo-50/80 dark:border-indigo-500/25 dark:bg-indigo-500/12"
                                : "border-slate-200/80 bg-white/85 dark:border-slate-700/50 dark:bg-slate-900/50",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("flex size-10 items-center justify-center rounded-2xl", values.osOpen ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300")}>
                                <Info className="size-4.5" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-950 dark:text-slate-50">O.S. em aberto</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Conta como carga ativa na operação</p>
                              </div>
                            </div>
                            <div className={cn("size-6 rounded-full border-2 transition-all", values.osOpen ? "border-indigo-600 bg-indigo-600" : "border-slate-300 dark:border-slate-600")}>
                              {values.osOpen ? <CheckCircle2 className="size-5 text-white" /> : null}
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateValue("resolved", !values.resolved)}
                            className={cn(
                              "flex items-center justify-between rounded-[22px] border px-4 py-4 text-left transition-all",
                              values.resolved
                                ? "border-emerald-200 bg-emerald-50/85 dark:border-emerald-500/25 dark:bg-emerald-500/12"
                                : "border-slate-200/80 bg-white/85 dark:border-slate-700/50 dark:bg-slate-900/50",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("flex size-10 items-center justify-center rounded-2xl", values.resolved ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300")}>
                                <CheckCircle2 className="size-4.5" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-950 dark:text-slate-50">Caso resolvido</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Fecha o ciclo atual do cliente</p>
                              </div>
                            </div>
                            <div className={cn("size-6 rounded-full border-2 transition-all", values.resolved ? "border-emerald-600 bg-emerald-600" : "border-slate-300 dark:border-slate-600")}>
                              {values.resolved ? <CheckCircle2 className="size-5 text-white" /> : null}
                            </div>
                          </button>
                        </div>

                        {client?.updatedAt ? (
                          <div className="mt-4 flex items-center gap-2 rounded-[18px] border border-slate-200/80 bg-white/85 px-4 py-3 text-xs text-slate-500 dark:border-slate-700/50 dark:bg-slate-900/50 dark:text-slate-400">
                            <Clock3 className="size-3.5" />
                            Última atualização em {formatDateLabel(client.updatedAt)}
                          </div>
                        ) : null}
                      </div>
                    </aside>

                    <div className="space-y-5">
                      <section className="surface-muted rounded-[28px] p-5">
                        <div className="flex items-center gap-2">
                          <div className="size-1.5 rounded-full bg-indigo-500" />
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Contato e responsável</h3>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
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

                      <section className="surface-muted rounded-[28px] p-5">
                        <div className="flex items-center gap-2">
                          <div className="size-1.5 rounded-full bg-indigo-500" />
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Status e agenda</h3>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
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

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Último contato</label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                              <Input
                                type="datetime-local"
                                value={values.lastContactAt}
                                onChange={(e) => updateValue("lastContactAt", e.target.value)}
                                className="h-12 rounded-2xl pl-10"
                              />
                            </div>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Próxima ação</label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
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

                      <section className="surface-muted rounded-[28px] p-5">
                        <div className="flex items-center gap-2">
                          <div className="size-1.5 rounded-full bg-indigo-500" />
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Contexto</h3>
                        </div>

                        <div className="mt-5 space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrição do caso</label>
                            <Textarea
                              value={values.description}
                              onChange={(e) => updateValue("description", e.target.value)}
                              placeholder="Resumo do problema relatado, combinados e contexto operacional."
                              className="min-h-[110px] rounded-[22px] border-slate-200/90 bg-white/95 p-4 dark:border-slate-700/60 dark:bg-slate-800/80"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notas internas</label>
                            <Textarea
                              value={values.notes}
                              onChange={(e) => updateValue("notes", e.target.value)}
                              placeholder="Detalhes para a equipe, contexto técnico ou orientação de follow-up."
                              className={cn("min-h-[120px] rounded-[22px] border-slate-200/90 bg-white/95 p-4 dark:border-slate-700/60 dark:bg-slate-800/80", errors.notes && "border-rose-500")}
                            />
                            {errors.notes ? <p className="text-xs font-medium text-rose-500">{errors.notes}</p> : null}
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100/90 bg-white/88 px-6 py-4 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-950/55 sm:px-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {mode === "create"
                        ? "O modal mantém a página disponível ao fundo e evita a sensação de tela travada."
                        : "Salve sem sair do contexto da carteira."}
                    </p>

                    <div className="flex gap-3 sm:justify-end">
                      <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={onClose} disabled={submitting}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1 sm:flex-none" disabled={submitting}>
                        {submitting ? (
                          <span className="flex items-center gap-2">
                            <span className="size-4 rounded-full border-2 border-white/35 border-t-white animate-spin" />
                            Salvando...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Save className="size-4" />
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
