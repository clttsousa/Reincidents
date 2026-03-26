"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { 
  AlertCircle, 
  CheckCircle2, 
  ClipboardList, 
  Save, 
  UserRound, 
  X,
  Info,
  Clock3,
  Calendar
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  clientToFormValues, 
  formatDateLabel, 
  formatPhone, 
  formatPhoneInput, 
  statusOptions, 
  validateClientForm 
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
  onSubmit 
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
    <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        ref={panelRef}
        className="h-full w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-8 border-b border-slate-100 dark:border-slate-800/50">
          <div>
            <Badge variant="outline" className="mb-3 rounded-lg border-indigo-100 bg-indigo-50/50 text-indigo-600 dark:border-indigo-900/30 dark:bg-indigo-900/20 dark:text-indigo-400">
              {mode === "create" ? "Novo Cadastro" : "Edição de Cliente"}
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {mode === "create" ? "Cadastrar novo cliente" : client?.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {mode === "create" 
                ? "Preencha os dados para iniciar o acompanhamento operacional." 
                : "Atualize as informações e o status do atendimento."}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" disabled={submitting}>
            <X className="size-5 text-slate-400" />
          </Button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 space-y-12">
            {/* Section: Basic Info */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-1.5 rounded-full bg-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Informações de Contato</h3>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nome Completo</label>
                  <Input
                    value={values.name}
                    onChange={(e) => updateValue("name", e.target.value)}
                    placeholder="Ex: João Silva"
                    className={cn("h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white dark:bg-slate-800/40 dark:border-slate-700/40", errors.name && "border-rose-500 focus:ring-rose-500/20")}
                  />
                  {errors.name && <p className="text-xs font-medium text-rose-500 ml-1">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Telefone / WhatsApp</label>
                  <Input
                    value={values.phone}
                    onChange={(e) => updateValue("phone", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className={cn("h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white dark:bg-slate-800/40 dark:border-slate-700/40", errors.phone && "border-rose-500 focus:ring-rose-500/20")}
                  />
                  {errors.phone && <p className="text-xs font-medium text-rose-500 ml-1">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Responsável</label>
                  <select
                    value={values.responsibleUserId}
                    onChange={(e) => updateValue("responsibleUserId", e.target.value)}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-slate-800/40 dark:border-slate-700/40"
                  >
                    <option value="">Selecione um responsável</option>
                    {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  {errors.responsibleUserId && <p className="text-xs font-medium text-rose-500 ml-1">{errors.responsibleUserId}</p>}
                </div>
              </div>
            </section>

            {/* Section: Status & Operational */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-1.5 rounded-full bg-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Status e Operação</h3>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status Atual</label>
                  <select
                    value={values.status}
                    onChange={(e) => updateValue("status", e.target.value as any)}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-slate-800/40 dark:border-slate-700/40"
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Número da O.S.</label>
                  <Input
                    value={values.osNumber}
                    onChange={(e) => updateValue("osNumber", e.target.value)}
                    placeholder="Ex: OS-12345"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white dark:bg-slate-800/40 dark:border-slate-700/40"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className={cn(
                  "p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group",
                  values.osOpen ? "bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800" : "bg-slate-50/50 border-slate-100 dark:bg-slate-800/30 dark:border-slate-800"
                )} onClick={() => updateValue("osOpen", !values.osOpen)}>
                  <div className="flex items-center gap-4">
                    <div className={cn("size-10 rounded-xl flex items-center justify-center transition-colors", values.osOpen ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-700")}>
                      <Info className="size-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">O.S. em Aberto</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Contabiliza no dashboard</p>
                    </div>
                  </div>
                  <div className={cn("size-6 rounded-full border-2 flex items-center justify-center transition-all", values.osOpen ? "bg-indigo-600 border-indigo-600" : "border-slate-300 dark:border-slate-600")}>
                    {values.osOpen && <CheckCircle2 className="size-4 text-white" />}
                  </div>
                </div>

                <div className={cn(
                  "p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group",
                  values.resolved ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800" : "bg-slate-50/50 border-slate-100 dark:bg-slate-800/30 dark:border-slate-800"
                )} onClick={() => updateValue("resolved", !values.resolved)}>
                  <div className="flex items-center gap-4">
                    <div className={cn("size-10 rounded-xl flex items-center justify-center transition-colors", values.resolved ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-700")}>
                      <CheckCircle2 className="size-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">Caso Resolvido</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Finaliza o ciclo atual</p>
                    </div>
                  </div>
                  <div className={cn("size-6 rounded-full border-2 flex items-center justify-center transition-all", values.resolved ? "bg-emerald-600 border-emerald-600" : "border-slate-300 dark:border-slate-600")}>
                    {values.resolved && <CheckCircle2 className="size-4 text-white" />}
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Agenda */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-1.5 rounded-full bg-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Agenda e Prazos</h3>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Último Contato</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="datetime-local"
                      value={values.lastContactAt}
                      onChange={(e) => updateValue("lastContactAt", e.target.value)}
                      className="h-12 pl-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white dark:bg-slate-800/40 dark:border-slate-700/40"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Próxima Ação</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="datetime-local"
                      value={values.nextActionAt}
                      onChange={(e) => updateValue("nextActionAt", e.target.value)}
                      className={cn("h-12 pl-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white dark:bg-slate-800/40 dark:border-slate-700/40", errors.nextActionAt && "border-rose-500")}
                    />
                  </div>
                  {errors.nextActionAt && <p className="text-xs font-medium text-rose-500 ml-1">{errors.nextActionAt}</p>}
                </div>
              </div>
            </section>

            {/* Section: Description & Notes */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-1.5 rounded-full bg-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Contexto e Observações</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Descrição do Caso</label>
                  <Textarea
                    value={values.description}
                    onChange={(e) => updateValue("description", e.target.value)}
                    placeholder="Resumo do problema relatado pelo cliente..."
                    className="min-h-[100px] rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white dark:bg-slate-800/40 dark:border-slate-700/40 p-4"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Notas Internas</label>
                  <Textarea
                    value={values.notes}
                    onChange={(e) => updateValue("notes", e.target.value)}
                    placeholder="Detalhes técnicos ou observações para a equipe..."
                    className="min-h-[120px] rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white dark:bg-slate-800/40 dark:border-slate-700/40 p-4"
                  />
                </div>
              </div>
            </section>

            {client?.updatedAt && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500">
                <Clock3 className="size-3.5" />
                Última atualização em {formatDateLabel(client.updatedAt)}
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-8 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/50">
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 h-14 rounded-2xl text-base font-semibold" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button 
              className="flex-[1.5] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold shadow-lg shadow-indigo-500/20" 
              onClick={(e: any) => handleSubmit(e)} 
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="size-5" />
                  {mode === "create" ? "Cadastrar Cliente" : "Salvar Alterações"}
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
