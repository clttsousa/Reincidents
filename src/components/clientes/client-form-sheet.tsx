"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, ClipboardList, Save, UserRound, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clientToFormValues, formatDateLabel, formatPhone, statusOptions, validateClientForm } from "@/lib/client-helpers";
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

function FieldLabel({ label, required = false }: { label: string; required?: boolean }) {
  return (
    <label className="mb-2 block text-sm font-medium text-slate-800">
      {label}
      {required ? <span className="ml-1 text-red-500">*</span> : null}
    </label>
  );
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-500">{message}</p>;
}

export function ClientFormSheet({ open, mode, client, assignees, submitting = false, onClose, onSubmit }: ClientFormSheetProps) {
  const [values, setValues] = useState<ClientFormValues>(clientToFormValues());
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormValues, string>>>({});

  useEffect(() => {
    if (!open) return;
    setValues(clientToFormValues(client ?? undefined));
    setErrors({});
  }, [client, open]);

  useEffect(() => {
    if (!open) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onClose, open, submitting]);

  const title = mode === "create" ? "Novo cliente recorrente" : "Editar cliente";
  const subtitle =
    mode === "create"
      ? "Cadastre um caso rapidamente, com foco em operação, responsável real e próximas ações."
      : "Atualize status, responsável, contato e contexto operacional sem perder velocidade no atendimento.";

  const previewPhone = useMemo(() => formatPhone(values.phone), [values.phone]);
  const selectedAssignee = useMemo(
    () => assignees.find((option) => option.id === values.responsibleUserId),
    [assignees, values.responsibleUserId],
  );

  const updateValue = <K extends keyof ClientFormValues>(field: K, value: ClientFormValues[K]) => {
    setValues((current) => {
      const next = { ...current, [field]: value };

      if (field === "status") {
        if (value === "O.S. aberta") {
          next.osOpen = true;
          next.resolved = false;
        }
        if (value === "Resolvido") {
          next.osOpen = true;
          next.resolved = true;
        }
        if (value === "Aguardando contato" || value === "Sem retorno") {
          next.resolved = false;
        }
      }

      if (field === "resolved" && value === true) {
        next.status = "Resolvido";
        next.osOpen = true;
      }

      if (field === "osOpen" && value === false) {
        next.osNumber = "";
      }

      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateClientForm(values);
    setErrors(validation);

    if (Object.keys(validation).length > 0) return;

    const success = await onSubmit(values);
    if (success) onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-950/35 backdrop-blur-sm md:items-stretch">
      <button aria-label="Fechar formulário" className="h-full flex-1 cursor-default" onClick={submitting ? undefined : onClose} type="button" />
      <div className="relative h-[94dvh] w-full overflow-y-auto rounded-t-[28px] border border-white/70 bg-white/95 shadow-2xl md:h-full md:max-w-4xl md:rounded-none md:border-y-0 md:border-r-0 md:border-l">
        <form className="flex min-h-full flex-col" onSubmit={handleSubmit}>
          <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/92 px-4 py-4 backdrop-blur sm:px-5 md:px-7">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge className="w-fit bg-slate-950 text-white">Cadastro rápido</Badge>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">{title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="icon" className="border-white/80 bg-white" onClick={onClose} disabled={submitting}>
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-5 px-4 py-4 sm:px-5 md:space-y-6 md:px-7 md:py-6">
            <section className="grid gap-4 rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="text-sm font-medium text-slate-900">Prévia operacional</p>
                <p className="mt-1 text-sm text-slate-500">Os dados abaixo aparecem na fila e ajudam a equipe a agir rápido.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Telefone</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{previewPhone || "(00) 00000-0000"}</p>
                </div>
                <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Responsável</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedAssignee?.name ?? "Selecione um usuário"}</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="size-4 text-slate-500" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Dados principais</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel label="Nome do cliente" required />
                  <Input
                    autoFocus
                    value={values.name}
                    onChange={(event) => updateValue("name", event.target.value)}
                    placeholder="Ex.: Rosilene Souza Zampieri"
                    className="border-slate-200 bg-white"
                  />
                  <ErrorText message={errors.name} />
                </div>
                <div>
                  <FieldLabel label="Telefone" required />
                  <Input
                    value={values.phone}
                    onChange={(event) => updateValue("phone", event.target.value)}
                    placeholder="5534999991234"
                    className="border-slate-200 bg-white"
                  />
                  <ErrorText message={errors.phone} />
                </div>
                <div>
                  <FieldLabel label="Total de atendimentos" required />
                  <Input
                    type="number"
                    min={1}
                    value={values.totalServices}
                    onChange={(event) => updateValue("totalServices", Number(event.target.value))}
                    className="border-slate-200 bg-white"
                  />
                  <ErrorText message={errors.totalServices} />
                </div>
                <div>
                  <FieldLabel label="Responsável" required />
                  <div className="relative">
                    <select
                      value={values.responsibleUserId}
                      onChange={(event) => updateValue("responsibleUserId", event.target.value)}
                      className="flex h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <option value="">Selecione o responsável</option>
                      {assignees.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} · {option.role === "ADMIN" ? "Admin" : option.role === "SUPERVISOR" ? "Supervisor" : "Atendente"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ErrorText message={errors.responsibleUserId} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-slate-500" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Contexto do caso</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel label="Status atual" required />
                  <select
                    value={values.status}
                    onChange={(event) => updateValue("status", event.target.value as ClientFormValues["status"])}
                    className="flex h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Número da O.S." />
                  <Input
                    value={values.osNumber}
                    onChange={(event) => updateValue("osNumber", event.target.value)}
                    placeholder="Ex.: OS-2451"
                    className="border-slate-200 bg-white"
                    disabled={!values.osOpen && values.status !== "O.S. aberta" && values.status !== "Resolvido"}
                  />
                  <ErrorText message={errors.osNumber} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">O.S. aberta</p>
                    <p className="text-xs text-slate-500">Indique se o caso já foi formalmente escalado.</p>
                  </div>
                  <input type="checkbox" checked={values.osOpen} onChange={(event) => updateValue("osOpen", event.target.checked)} className="size-4 rounded border-slate-300" />
                </label>
                <label className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Resolvido</p>
                    <p className="text-xs text-slate-500">Marque apenas quando o caso estiver efetivamente concluído.</p>
                  </div>
                  <input type="checkbox" checked={values.resolved} onChange={(event) => updateValue("resolved", event.target.checked)} className="size-4 rounded border-slate-300" />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel label="Último contato" />
                  <Input type="datetime-local" value={values.lastContactAt} onChange={(event) => updateValue("lastContactAt", event.target.value)} />
                  <ErrorText message={errors.lastContactAt} />
                </div>
                <div>
                  <FieldLabel label="Próxima ação" />
                  <Input type="datetime-local" value={values.nextActionAt} onChange={(event) => updateValue("nextActionAt", event.target.value)} />
                  <ErrorText message={errors.nextActionAt} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-slate-500" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Relato e observações</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <FieldLabel label="Descrição do relato" />
                  <Textarea
                    value={values.description}
                    onChange={(event) => updateValue("description", event.target.value)}
                    placeholder="Descreva o que o cliente relatou, sintomas, contexto do local e percepção da equipe."
                  />
                </div>
                <div>
                  <FieldLabel label="Observações internas" />
                  <Textarea
                    value={values.notes}
                    onChange={(event) => updateValue("notes", event.target.value)}
                    placeholder="Observações rápidas para a equipe, próximos passos ou detalhes internos."
                    className="min-h-[112px]"
                  />
                  <ErrorText message={errors.notes} />
                </div>
              </div>
            </section>

            {client ? (
              <section className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <UserRound className="size-4" />
                  <span>Última atualização registrada {formatDateLabel(client.updatedAt)}.</span>
                </div>
              </section>
            ) : null}
          </div>

          <div className="sticky bottom-0 border-t border-slate-200 bg-white/92 px-4 py-4 backdrop-blur sm:px-5 md:px-7">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">A timeline do cliente será atualizada automaticamente após salvar.</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  <Save className="size-4" />
                  {submitting ? "Salvando..." : mode === "create" ? "Cadastrar cliente" : "Salvar alterações"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
