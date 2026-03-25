"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, ClipboardList, Save, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  clientToFormValues,
  formatPhone,
  statusOptions,
  validateClientForm,
} from "@/lib/client-helpers";
import { assigneeOptions } from "@/lib/mock-data";
import type { ClientFormValues, ClientRecord } from "@/types/mock";

interface ClientFormSheetProps {
  open: boolean;
  mode: "create" | "edit";
  client?: ClientRecord | null;
  onClose: () => void;
  onSubmit: (values: ClientFormValues) => void;
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

export function ClientFormSheet({ open, mode, client, onClose, onSubmit }: ClientFormSheetProps) {
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
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onClose, open]);

  const title = mode === "create" ? "Novo cliente recorrente" : "Editar cliente";
  const subtitle =
    mode === "create"
      ? "Cadastre um caso rapidamente, com foco em operação e acompanhamento futuro."
      : "Atualize status, O.S. e contexto operacional sem perder velocidade no atendimento.";

  const previewPhone = useMemo(() => formatPhone(values.phone), [values.phone]);

  const updateValue = <K extends keyof ClientFormValues>(field: K, value: ClientFormValues[K]) => {
    setValues((current) => {
      const next = { ...current, [field]: value };

      if (field === "status") {
        if (value === "O.S. aberta") {
          next.osOpen = true;
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateClientForm(values);
    setErrors(validation);

    if (Object.keys(validation).length > 0) return;

    onSubmit(values);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-sm">
      <button aria-label="Fechar formulário" className="h-full flex-1 cursor-default" onClick={onClose} type="button" />
      <div className="relative h-full w-full max-w-3xl overflow-y-auto border-l border-white/70 bg-white/95 shadow-2xl">
        <form className="flex min-h-full flex-col" onSubmit={handleSubmit}>
          <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/92 px-5 py-4 backdrop-blur md:px-7">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge className="w-fit bg-slate-950 text-white">Cadastro rápido</Badge>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">{title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="icon" className="border-white/80 bg-white" onClick={onClose}>
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-6 px-5 py-5 md:px-7 md:py-6">
            <section className="grid gap-4 rounded-[28px] border border-slate-200/80 bg-slate-50/70 p-5 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="text-sm font-medium text-slate-900">Prévia operacional</p>
                <p className="mt-1 text-sm text-slate-500">
                  Os dados abaixo aparecem na tabela principal e ajudam a equipe a agir rápido.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Telefone</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{previewPhone || "(00) 00000-0000"}</p>
                </div>
                <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{values.status}</p>
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
                      value={values.assignee}
                      onChange={(event) => updateValue("assignee", event.target.value)}
                      className="flex h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <option value="">Selecione o responsável</option>
                      {assigneeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ErrorText message={errors.assignee} />
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
                    placeholder="Ex.: OS-2401"
                    disabled={!values.osOpen && values.status !== "O.S. aberta" && !values.resolved}
                    className="border-slate-200 bg-white disabled:bg-slate-100"
                  />
                  <ErrorText message={errors.osNumber} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={values.osOpen}
                    onChange={(event) => updateValue("osOpen", event.target.checked)}
                    className="mt-1 size-4 rounded border-slate-300"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">O.S. aberta</p>
                    <p className="text-sm text-slate-500">Marque quando o caso já tiver sido encaminhado para ordem de serviço.</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={values.resolved}
                    onChange={(event) => updateValue("resolved", event.target.checked)}
                    className="mt-1 size-4 rounded border-slate-300"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Resolvido</p>
                    <p className="text-sm text-slate-500">Ao marcar, o sistema ajusta o status para resolvido e mantém o histórico pronto.</p>
                  </div>
                </label>
              </div>

              <div>
                <FieldLabel label="Descrição do relato" />
                <Textarea
                  value={values.description}
                  onChange={(event) => updateValue("description", event.target.value)}
                  placeholder="Descreva o que o cliente relatou, sintomas percebidos, horários e qualquer contexto útil."
                  className="border-slate-200 bg-white"
                />
                <ErrorText message={errors.description} />
              </div>

              <div>
                <FieldLabel label="Observações internas" />
                <Textarea
                  value={values.notes}
                  onChange={(event) => updateValue("notes", event.target.value)}
                  placeholder="Observações internas para a equipe: sensibilidade do cliente, prioridade, próximos passos, etc."
                  className="min-h-[110px] border-slate-200 bg-white"
                />
                <div className="mt-1 flex items-center justify-between gap-3">
                  <ErrorText message={errors.notes} />
                  <p className="text-xs text-slate-400">Use este campo para contexto operacional que não deve se perder.</p>
                </div>
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 border-t border-slate-200/80 bg-white/92 px-5 py-4 backdrop-blur md:px-7">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CheckCircle2 className="size-4 text-green-600" />
                Fluxo pensado para cadastro rápido e edição sem atrito.
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="border-slate-200 bg-white" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="size-4" />
                  {mode === "create" ? "Salvar cliente" : "Salvar alterações"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
