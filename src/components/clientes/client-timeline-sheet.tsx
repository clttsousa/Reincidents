"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Loader2, MessageSquarePlus, PhoneOutgoing, TimerReset, X } from "lucide-react";

import { useClients } from "@/components/providers/clients-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDateLabel, formatPhone, timelineActionLabel, toDateTimeLocalValue } from "@/lib/client-helpers";
import { cn } from "@/lib/utils";
import { useOverlayBehavior } from "@/hooks/use-overlay-behavior";
import type { ClientRecord, ClientTimelineEntry } from "@/types/mock";

interface ClientTimelineSheetProps {
  open: boolean;
  client: ClientRecord | null;
  onClose: () => void;
}

type TimelineFilter = "all" | "notes" | "history";

function groupTimelineEntries(entries: ClientTimelineEntry[]) {
  const formatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const groups = new Map<string, ClientTimelineEntry[]>();

  entries.forEach((entry) => {
    const key = formatter.format(new Date(entry.createdAt));
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  });

  return Array.from(groups.entries());
}

export function ClientTimelineSheet({ open, client, onClose }: ClientTimelineSheetProps) {
  const { fetchClientTimeline, addClientNote, registerContactAttempt, updatingClientId } = useClients();
  const [timeline, setTimeline] = useState<ClientTimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const busy = Boolean(client && updatingClientId === client.id);
  const panelRef = useOverlayBehavior({ open, onClose, disableClose: busy });

  useEffect(() => {
    if (!open || !client) return;

    const currentClient = client;
    let active = true;

    async function loadTimeline() {
      setLoading(true);
      try {
        const entries = await fetchClientTimeline(currentClient.id);
        if (active) {
          setTimeline(entries);
          setNote("");
          setContactNote("");
          setNextActionAt(toDateTimeLocalValue(currentClient.nextActionAt));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTimeline();
    return () => {
      active = false;
    };
  }, [client, fetchClientTimeline, open]);

  const overdueNextAction = useMemo(() => {
    if (!client?.nextActionAt) return false;
    return new Date(client.nextActionAt).getTime() < Date.now();
  }, [client?.nextActionAt]);

  const filteredTimeline = useMemo(() => {
    if (filter === "all") return timeline;
    if (filter === "notes") return timeline.filter((entry) => entry.type === "note");
    return timeline.filter((entry) => entry.type === "history");
  }, [filter, timeline]);

  const groupedTimeline = useMemo(() => groupTimelineEntries(filteredTimeline), [filteredTimeline]);

  const reloadTimeline = async () => {
    if (!client) return;
    const entries = await fetchClientTimeline(client.id);
    setTimeline(entries);
  };

  const handleAddNote = async () => {
    if (!client) return;
    const success = await addClientNote(client.id, note);
    if (!success) return;
    setNote("");
    await reloadTimeline();
  };

  const handleRegisterContact = async () => {
    if (!client) return;
    const success = await registerContactAttempt(client.id, {
      description: contactNote,
      nextActionAt: nextActionAt ? new Date(nextActionAt).toISOString() : "",
    });
    if (!success) return;
    setContactNote("");
    await reloadTimeline();
  };

  if (!open || !client) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-end bg-slate-950/35 backdrop-blur-sm md:items-stretch" role="dialog" aria-modal="true" aria-label={`Timeline de ${client.name}`}>
      <button aria-label="Fechar timeline" className="h-full flex-1 cursor-default" onClick={busy ? undefined : onClose} type="button" />
      <div className="animate-enter relative h-[94dvh] w-full overflow-y-auto rounded-t-[30px] border border-white/70 bg-white/95 shadow-2xl md:h-full md:max-w-2xl md:rounded-none md:border-y-0 md:border-r-0 md:border-l">
        <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/92 px-4 py-4 backdrop-blur sm:px-5 md:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge className="bg-slate-950 text-white">Timeline do cliente</Badge>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{client.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                <span>{formatPhone(client.phone)}</span>
                <span>•</span>
                <span>{client.assignee}</span>
                {client.nextActionAt ? (
                  <Badge className={cn("border text-[11px] font-semibold", overdueNextAction ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-50 text-slate-700 dark:text-slate-300")}>
                    Próxima ação {formatDateLabel(client.nextActionAt)}
                  </Badge>
                ) : null}
              </div>
            </div>
            <Button type="button" variant="outline" size="icon" onClick={onClose} disabled={busy} aria-label="Fechar timeline">
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-5 px-4 py-4 sm:px-5 md:px-6 md:py-5">
          <section className="surface-muted grid gap-4 rounded-[28px] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-white bg-white px-4 py-3 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.18)]">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Último contato</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{client.lastContactAt ? formatDateLabel(client.lastContactAt) : "Ainda não registrado"}</p>
              </div>
              <div className="rounded-[22px] border border-white bg-white px-4 py-3 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.18)]">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Status atual</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{client.status}</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="surface-card rounded-[26px] p-4">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="size-4 text-slate-500 dark:text-slate-400 dark:text-slate-500" />
                <h3 className="font-semibold text-slate-950 dark:text-slate-50">Adicionar observação</h3>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Use para registrar contexto, decisão ou algum detalhe interno importante.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Cliente orientado", "Aguardando retorno", "Manter acompanhamento"].map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => setNote((current) => (current ? `${current.trim()} · ${template}` : template))}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-800/40"
                  >
                    {template}
                  </button>
                ))}
              </div>
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-4 min-h-[132px]" placeholder="Escreva uma observação rápida para a equipe." />
              <Button className="mt-3 w-full sm:w-auto" onClick={handleAddNote} disabled={busy || note.trim().length < 3}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <MessageSquarePlus className="size-4" />}
                Salvar observação
              </Button>
            </div>

            <div className="surface-card rounded-[26px] p-4">
              <div className="flex items-center gap-2">
                <PhoneOutgoing className="size-4 text-slate-500 dark:text-slate-400 dark:text-slate-500" />
                <h3 className="font-semibold text-slate-950 dark:text-slate-50">Registrar tentativa de contato</h3>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Atualize o último contato e, se necessário, agende a próxima ação.</p>
              <Textarea value={contactNote} onChange={(event) => setContactNote(event.target.value)} className="mt-4 min-h-[96px]" placeholder="Resumo do retorno, sem retorno ou orientação passada ao cliente." />
              <div className="mt-3">
                <label className="mb-2 block text-sm font-medium text-slate-800">Próxima ação</label>
                <Input type="datetime-local" value={nextActionAt} onChange={(event) => setNextActionAt(event.target.value)} />
              </div>
              <Button className="mt-3 w-full sm:w-auto" onClick={handleRegisterContact} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <TimerReset className="size-4" />}
                Registrar contato
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Clock3 className="size-4 text-slate-500 dark:text-slate-400 dark:text-slate-500" />
                <h3 className="font-semibold text-slate-950 dark:text-slate-50">Histórico cronológico</h3>
              </div>
              <div className="flex flex-wrap gap-2 rounded-[20px] border border-slate-200 bg-white/90 p-1.5 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.16)]">
                {([
                  ["all", "Tudo"],
                  ["notes", "Notas"],
                  ["history", "Movimentações"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={cn(
                      "rounded-[16px] px-3 py-2 text-sm font-medium transition-all",
                      filter === value ? "chip-active" : "chip-neutral hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-800/40",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  <Loader2 className="size-4 animate-spin" />
                  Carregando timeline...
                </div>
              </div>
            ) : groupedTimeline.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center">
                <p className="font-medium text-slate-900 dark:text-slate-100">Nenhuma movimentação registrada ainda.</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">As mudanças de status, notas e tentativas de contato vão aparecer aqui.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedTimeline.map(([groupLabel, entries]) => (
                  <div key={groupLabel} className="space-y-3">
                    <div className="sticky top-[86px] z-[1] inline-flex rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.18)]">
                      {groupLabel}
                    </div>
                    {entries.map((entry) => (
                      <div key={entry.id} className="relative rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.16)] before:absolute before:left-4 before:top-5 before:h-full before:w-px before:bg-slate-100 md:before:left-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={entry.type === "note" ? "secondary" : "outline"} className="uppercase tracking-[0.14em]">
                            {timelineActionLabel(entry)}
                          </Badge>
                          <p className="font-semibold text-slate-950 dark:text-slate-50">{entry.title}</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400 dark:text-slate-500">{entry.description}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                          <span>{entry.actorName}</span>
                          <span>•</span>
                          <span>{formatDateLabel(entry.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
