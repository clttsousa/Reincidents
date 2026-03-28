import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, AlertCircle } from "lucide-react";
import { clientToFormValues, validateClientForm, statusOptions, formatPhone } from "@/lib/client-helpers";
import type { ClientRecord, ClientFormValues, ClientStatus } from "@/types/mock";
import { CustomSelect } from "./custom-select";

interface ClientModalProps {
  open: boolean;
  mode: "create" | "edit";
  client?: ClientRecord;
  assignees: string[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: ClientFormValues) => Promise<void>;
}

export function ClientModal({
  open,
  mode,
  client,
  assignees,
  submitting,
  onClose,
  onSubmit,
}: ClientModalProps) {
  const [values, setValues] = useState<ClientFormValues>(clientToFormValues(client));
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormValues, string>>>({});

  useEffect(() => {
    setValues(clientToFormValues(client));
    setErrors({});
  }, [client, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateClientForm(values);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      await onSubmit(values);
      onClose();
    }
  };

  const handleStatusChange = (status: ClientStatus) => {
    setValues((prev) => {
      const resolved = status === "Resolvido" || prev.resolved;
      return {
        ...prev,
        status,
        resolved,
        osOpen: resolved ? false : status === "O.S. aberta" || prev.osOpen,
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {mode === "create" ? "Novo Cliente" : `Editar ${client?.name || "Cliente"}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Informações Básicas
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nome do Cliente *</label>
                <Input
                  value={values.name}
                  onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Empresa ABC Ltda"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Telefone *</label>
                <Input
                  value={values.phone}
                  onChange={(e) => setValues((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 98765-4321"
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Descrição</label>
              <Textarea
                value={values.description}
                onChange={(e) => setValues((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o tipo de serviço ou negócio..."
                className="min-h-20"
              />
            </div>
          </div>

          {/* Status e Responsável */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Status e Responsável
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Status *</label>
                <CustomSelect
                  value={values.status}
                  onChange={(val) => handleStatusChange(val as ClientStatus)}
                  options={statusOptions}
                  placeholder="Selecione o status"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Responsável *</label>
                <CustomSelect
                  value={values.responsibleUserId}
                  onChange={(val) => setValues((prev) => ({ ...prev, responsibleUserId: String(val) }))}
                  options={assignees}
                  placeholder="Selecione o responsável"
                />
                {errors.responsibleUserId && <p className="text-xs text-destructive mt-1">{errors.responsibleUserId}</p>}
              </div>
            </div>
          </div>

          {/* Recorrência e O.S. */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Recorrência e Ordem de Serviço
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Total de Atendimentos *</label>
                <Input
                  type="number"
                  min="1"
                  value={values.totalServices}
                  onChange={(e) => setValues((prev) => ({ ...prev, totalServices: parseInt(e.target.value) || 1 }))}
                  className={errors.totalServices ? "border-destructive" : ""}
                />
                {errors.totalServices && <p className="text-xs text-destructive mt-1">{errors.totalServices}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Número da O.S.</label>
                <Input
                  value={values.osNumber}
                  onChange={(e) => setValues((prev) => ({ ...prev, osNumber: e.target.value }))}
                  placeholder="Ex: OS-2024-001"
                  className={errors.osNumber ? "border-destructive" : ""}
                />
                {errors.osNumber && <p className="text-xs text-destructive mt-1">{errors.osNumber}</p>}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={values.osOpen}
                  onChange={(e) => setValues((prev) => ({ ...prev, osOpen: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm font-medium">O.S. Aberta</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={values.resolved}
                  onChange={(e) => setValues((prev) => ({ ...prev, resolved: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm font-medium">Resolvido</span>
              </label>
            </div>
          </div>

          {/* Datas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Datas de Contato
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Último Contato</label>
                <Input
                  type="datetime-local"
                  value={values.lastContactAt}
                  onChange={(e) => setValues((prev) => ({ ...prev, lastContactAt: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Próxima Ação</label>
                <Input
                  type="datetime-local"
                  value={values.nextActionAt}
                  onChange={(e) => setValues((prev) => ({ ...prev, nextActionAt: e.target.value }))}
                />
                {errors.nextActionAt && <p className="text-xs text-destructive mt-1">{errors.nextActionAt}</p>}
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Observações
            </h3>

            <Textarea
              value={values.notes}
              onChange={(e) => setValues((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Adicione observações sobre o cliente..."
              className="min-h-24"
            />
            {errors.notes && <p className="text-xs text-destructive mt-1">{errors.notes}</p>}
          </div>
        </form>

        <DialogFooter className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Salvando..." : mode === "create" ? "Cadastrar" : "Atualizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
