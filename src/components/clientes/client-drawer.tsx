import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Phone, Calendar, AlertTriangle, Edit2 } from "lucide-react";
import { formatPhone, formatDateLabel, isCriticalClient, statusOptions } from "@/lib/client-helpers";
import { CustomSelect } from "./custom-select";
import type { ClientRecord, ClientStatus } from "@/types/mock";

interface ClientDrawerProps {
  open: boolean;
  client: ClientRecord | null;
  onClose: () => void;
  onEdit: (client: ClientRecord) => void;
  onStatusChange: (clientId: string, status: ClientStatus) => Promise<void>;
}

export function ClientDrawer({
  open,
  client,
  onClose,
  onEdit,
  onStatusChange,
}: ClientDrawerProps) {
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  if (!client) return null;

  const handleStatusChange = async (newStatus: ClientStatus) => {
    setStatusChanging(true);
    await onStatusChange(client.id, newStatus);
    setStatusChanging(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    // Simular adição de nota
    await new Promise((resolve) => setTimeout(resolve, 300));
    setNewNote("");
    setIsAddingNote(false);
  };

  const critical = isCriticalClient(client);

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="flex flex-col max-h-[90vh]">
        <DrawerHeader className="border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DrawerTitle className="text-2xl font-bold text-slate-950 dark:text-slate-50">
                {client.name}
              </DrawerTitle>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {client.description}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(client)}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Editar
            </Button>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Status e Informações Críticas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Status e Responsável
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Status
                  </label>
                  <CustomSelect
                    value={client.status}
                    onChange={(val) => handleStatusChange(val as ClientStatus)}
                    options={statusOptions}
                    placeholder="Selecione o status"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Responsável
                  </label>
                  <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm font-medium text-slate-950 dark:text-slate-50">
                    {client.assignee}
                  </div>
                </div>
              </div>

              {critical && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 p-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                      Cliente Crítico
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                      Este cliente requer atenção prioritária.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Informações de Contato
              </h3>

              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <Phone className="h-5 w-5 text-slate-600 dark:text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Telefone</p>
                    <p className="font-medium text-slate-950 dark:text-slate-50">
                      {formatPhone(client.phone)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Último Contato</p>
                    <p className="font-medium text-slate-950 dark:text-slate-50">
                      {formatDateLabel(client.lastContactAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recorrência */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Recorrência
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardContent className="p-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Atendimentos</p>
                    <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-50">
                      {client.totalServices}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800">
                  <CardContent className="p-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">O.S.</p>
                    <p className="mt-1 text-lg font-bold text-slate-950 dark:text-slate-50">
                      {client.osOpen ? "Aberta" : "Fechada"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800">
                  <CardContent className="p-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Status</p>
                    <Badge className="mt-1 text-xs">{client.status}</Badge>
                  </CardContent>
                </Card>
              </div>

              {client.osNumber && (
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-600 dark:text-slate-400">Número da O.S.</p>
                  <p className="font-mono font-semibold text-slate-950 dark:text-slate-50 mt-1">
                    {client.osNumber}
                  </p>
                </div>
              )}
            </div>

            {/* Próxima Ação */}
            {client.nextActionAt && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Próxima Ação
                </h3>

                <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Agendado para</p>
                    <p className="font-medium text-slate-950 dark:text-slate-50">
                      {formatDateLabel(client.nextActionAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Observações */}
            {client.notes && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Observações
                </h3>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-sm text-slate-950 dark:text-slate-50 whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Adicionar Nota */}
            <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Adicionar Observação
              </h3>

              <div className="space-y-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Digite uma observação..."
                  className="min-h-20"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || isAddingNote}
                  className="w-full gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  {isAddingNote ? "Salvando..." : "Adicionar Observação"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
