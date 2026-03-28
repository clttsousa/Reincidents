"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Calendar, CheckCircle2, Clock3, Info, Save, ShieldCheck, Sparkles, X } from "lucide-react";

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
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setValues(clientToFormValues(client ?? undefined));
    setErrors({});
    requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
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

  const summaryItems = [
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

  if (!open) return null;

  return (
    <section ref={rootRef} className="surface-card animate-enter scroll-mt-28 rounded-[32px] p-5 sm:p-6">
      <div className="workspace-header">
        <div className="min-w-0">
          <Badge
            variant="outline"
            className="rounded-full border-indigo-200 bg-indigo-50/90 px-3 py-1 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/12 dark:text-indigo-300"
          >
            {mode === "create" ? "Novo cliente" : "Editar cadastro"}
          </Badge>
          <h2 className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50 sm:text-[1.7rem]">
            {mode === "create" ? "Cadastrar cliente" : `Editar ${client?.name}`}
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Formulário aberto na área principal, sem overlay e sem mini-dashboard dentro de modal. O foco fica no cadastro, com leitura limpa e edição direta.
          </p>
        </div>

        <Button type="button" variant="ghost" size="icon" onClick={onClose} className="rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" disabled={submitting}>
          <X className="size-5" />
        </Button>
      </div>

      <div className="workspace-divider" />

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="grid gap-3 md:grid-cols-3">
          {summaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="workspace-stat">
                <div className="workspace-stat-icon">
                  <Icon className="size-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-slate-50">{item.value}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.helper}</p>
                </div>
              </div>
            );
          })}
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
          <div className="space-y-4">
            <section className="surface-inset rounded-[26px] p-5">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <h3 className="workspace-group-title">Contato e responsável</h3>
              </div>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="workspace-field-label">Nome completo</label>
                  <Input value={values.name} onChange={(event) => updateValue("name", event.target.value)} placeholder="Ex.: João Silva" />
                  {errors.name ? <p className="text-xs text-rose-600">{errors.name}</p> : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="workspace-field-label">Telefone / WhatsApp</label>
                    <Input value={values.phone} onChange={(event) => updateValue("phone", event.target.value)} placeholder="(00) 00000-0000" />
                    {errors.phone ? <p className="text-xs text-rose-600">{errors.phone}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <label className="workspace-field-label">Responsável</label>
                    <select
                      value={values.responsibleUserId}
                      onChange={(event) => updateValue("responsibleUserId", event.target.value)}
                      className="workspace-select"
                    >
                      <option value="">Selecione um responsável</option>
                      {assignees.map((assignee) => (
                        <option key={assignee.id} value={assignee.id}>
                          {assignee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedAssignee ? (
                  <div className="rounded-[18px] border border-slate-200/90 bg-slate-50/90 px-4 py-3 text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-400">
                    Responsável atual: <span className="font-medium text-slate-900 dark:text-slate-100">{selectedAssignee.name}</span>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="surface-inset rounded-[26px] p-5">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <h3 className="workspace-group-title">Contexto do caso</h3>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="workspace-field-label">Descrição do caso</label>
                  <Textarea
                    value={values.description}
                    onChange={(event) => updateValue("description", event.target.value)}
                    className="min-h-[178px] rounded-[22px]"
                    placeholder="Resumo do problema, ruído operacional ou motivo da recorrência."
                  />
                  {errors.description ? <p className="text-xs text-rose-600">{errors.description}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="workspace-field-label">Notas internas</label>
                  <Textarea
                    value={values.notes}
                    onChange={(event) => updateValue("notes", event.target.value)}
                    className="min-h-[178px] rounded-[22px]"
                    placeholder="Detalhes para a equipe: contexto, retorno, risco ou orientação combinada."
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="surface-inset rounded-[26px] p-5">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <h3 className="workspace-group-title">Status, datas e operação</h3>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="workspace-field-label">Status atual</label>
                  <select value={values.status} onChange={(event) => updateValue("status", event.target.value as ClientFormValues["status"])} className="workspace-select">
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="workspace-field-label">Recorrências registradas</label>
                  <Input
                    type="number"
                    min={1}
                    value={values.totalServices}
                    onChange={(event) => updateValue("totalServices", Number(event.target.value || 0))}
                  />
                  {errors.totalServices ? <p className="text-xs text-rose-600">{errors.totalServices}</p> : null}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="workspace-field-label">Número da O.S.</label>
                  <Input value={values.osNumber} onChange={(event) => updateValue("osNumber", event.target.value)} placeholder="Ex: OS-12345" />
                </div>

                <div className="space-y-2">
                  <label className="workspace-field-label">Último contato</label>
                  <Input type="datetime-local" value={values.lastContactAt ? values.lastContactAt.slice(0, 16) : ""} onChange={(event) => updateValue("lastContactAt", event.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="workspace-field-label">Próxima ação</label>
                  <Input type="datetime-local" value={values.nextActionAt ? values.nextActionAt.slice(0, 16) : ""} onChange={(event) => updateValue("nextActionAt", event.target.value)} />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => updateValue("osOpen", !values.osOpen)}
                  className={values.osOpen ? "workspace-toggle workspace-toggle-active" : "workspace-toggle"}
                >
                  <div className="workspace-toggle-icon"><Info className="size-4" /></div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-50">O.S. em aberto</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Mantém o caso na carga ativa da operação.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateValue("resolved", !values.resolved)}
                  className={values.resolved ? "workspace-toggle workspace-toggle-success" : "workspace-toggle"}
                >
                  <div className="workspace-toggle-icon"><CheckCircle2 className="size-4" /></div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-50">Caso resolvido</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Fecha o ciclo atual sem sair da tela.</p>
                  </div>
                </button>
              </div>
            </section>

            <section className="surface-subtle rounded-[26px] p-5">
              <div className="flex items-center gap-2">
                <Clock3 className="size-4 text-slate-400" />
                <h3 className="workspace-group-title">Leitura operacional</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {values.nextActionAt
                  ? `A próxima ação está marcada para ${formatDateLabel(values.nextActionAt)}.`
                  : "Ainda não há próxima ação registrada para este cliente."}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {values.resolved
                  ? "O cliente será salvo como resolvido; a O.S. deixa de contar na carga ativa."
                  : values.osOpen
                    ? "Este cadastro continuará sinalizando O.S. aberta na carteira."
                    : "O cadastro seguirá como acompanhamento ativo sem O.S. em aberto."}
              </p>
            </section>
          </div>
        </div>

        <div className="workspace-footer">
          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
            Cadastro aberto na própria página para evitar fundo bloqueado, competição visual e sobreposição desnecessária.
          </p>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button type="button" variant="outline" className="h-11 rounded-2xl px-5" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" className="h-11 rounded-2xl px-5">
              <Save className="size-4" />
              {submitting ? "Salvando..." : mode === "create" ? "Cadastrar cliente" : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
