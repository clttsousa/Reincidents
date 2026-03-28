"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquarePlus,
  PhoneOutgoing,
  TimerReset,
  UserRound,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/components/providers/clients-provider";
import { formatDateLabel, formatPhone, timelineActionLabel, toDateTimeLocalValue } from "@/lib/client-helpers";
import { cn } from "@/lib/utils";
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
  const rootRef = useRef<HTMLElement | null>(null);

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
          requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
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

  const headerStats = [
    {
      label: "Último contato",
      value: client.lastContactAt ? formatDateLabel(client.lastContactAt) : "Ainda não registrado",
      icon: Clock3,
    },
    {
      label: "Status atual",
      value: client.status,
      icon: CheckCircle2,
    },
    {
      label: "Próxima ação",
      value: client.nextActionAt ? formatDateLabel(client.nextActionAt) : "Não agendada",
      icon: CalendarClock,
      emphasis: overdueNextAction,
    },
  ];

  const filterOptions: Array<[TimelineFilter, string]> = [
    ["all", "Tudo"],
    ["notes", "Notas"],
    ["history", "Movimentações"],
  ];

  return (
    <section ref={rootRef} className="surface-card animate-enter scroll-mt-28 rounded-[32px] p-5 sm:p-6">
      <div className="workspace-header">
        <div className="min-w-0">
          <Badge className="rounded-full bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950">Cliente em foco</Badge>
          <h2 className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50 sm:text-[1.7rem]">
            {client.name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>{formatPhone(client.phone)}</span>
            <span>•</span>
            <span>{client.assignee}</span>
            {client.responsibleUserId ? (
              <Badge variant="outline" className="rounded-full">
                Responsável vinculado
              </Badge>
            ) : null}
            {overdueNextAction ? <Badge className="rounded-full bg-rose-600 text-white">Ação atrasada</Badge> : null}
          </div>
        </div>

        <Button type="button" variant="ghost" size="icon" onClick={onClose} disabled={busy} aria-label="Fechar painel do cliente" className="rounded-full">
          <X className="size-4" />
        </Button>
      </div>

      <div className="workspace-divider" />

      <section className="grid gap-3 md:grid-cols-3">
        {headerStats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={cn("workspace-stat", item.emphasis && "border-rose-200/75 bg-rose-50/75 dark:border-rose-500/25 dark:bg-rose-500/10") }>
              <div className={cn("workspace-stat-icon", item.emphasis && "text-rose-500 dark:text-rose-300")}>
                <Icon className="size-[18px]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-50">{item.value}</p>
              </div>
            </div>
          );
        })}
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <section className="surface-subtle rounded-[26px] p-5">
            <div className="flex items-center gap-3">
              <div className="workspace-stat-icon">
                <UserRound className="size-[18px]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Leitura rápida</p>
                <p className="text-sm font-medium text-slate-950 dark:text-slate-50">
                  {client.resolved ? "Cliente encerrado com histórico disponível." : "Cliente ainda em acompanhamento, com histórico consolidado."}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {client.notes?.trim()
                    ? client.notes
                    : "Ainda não há nota fixa salva neste cliente. Use as observações abaixo para registrar o contexto atual da equipe."}
                </p>
              </div>
            </div>
          </section>

          <section className="surface-inset rounded-[26px] p-5">
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="size-4 text-slate-500 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-950 dark:text-slate-50">Adicionar observação</h3>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Use para registrar contexto, decisão ou qualquer detalhe importante para a próxima leitura do caso.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Cliente orientado", "Aguardando retorno", "Manter acompanhamento"].map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => setNote((current) => (current ? `${current.trim()} · ${template}` : template))}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300"
                >
                  {template}
                </button>
              ))}
            </div>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-4 min-h-[172px] rounded-[22px]"
              placeholder="Escreva uma observação objetiva para a equipe."
            />
            <Button className="mt-3 w-full sm:w-auto" onClick={handleAddNote} disabled={busy || note.trim().length < 3}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <MessageSquarePlus className="size-4" />}
              Salvar observação
            </Button>
          </section>
        </div>

        <div className="space-y-4">
          <section className="surface-inset rounded-[26px] p-5">
            <div className="flex items-center gap-2">
              <PhoneOutgoing className="size-4 text-slate-500 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-950 dark:text-slate-50">Registrar tentativa de contato</h3>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Atualize o retorno do cliente e, se necessário, deixe a próxima ação já agendada.
            </p>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="space-y-2">
                <label className="workspace-field-label">Descrição do contato</label>
                <Textarea
                  value={contactNote}
                  onChange={(event) => setContactNote(event.target.value)}
                  className="min-h-[172px] rounded-[22px]"
                  placeholder="Resumo do retorno, ausência de resposta ou orientação passada ao cliente."
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="workspace-field-label">Próxima ação</label>
                  <Input type="datetime-local" value={nextActionAt} onChange={(event) => setNextActionAt(event.target.value)} />
                </div>
                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Deixe o próximo passo visível na carteira e no dashboard.
                </p>
                <Button className="w-full justify-center" onClick={handleRegisterContact} disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <TimerReset className="size-4" />}
                  Registrar contato
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="surface-card mt-4 min-w-0 rounded-[30px] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-slate-500 dark:text-slate-400" />
            <h3 className="font-semibold text-slate-950 dark:text-slate-50">Histórico cronológico</h3>
          </div>
          <div className="flex flex-wrap gap-2 rounded-[20px] border border-slate-200 bg-white/90 p-1.5 dark:border-slate-700/55 dark:bg-slate-900/60">
            {filterOptions.map(([value, label]) => (
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
          <div className="mt-4 flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 dark:border-slate-700/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
              <Loader2 className="size-4 animate-spin" />
              Carregando timeline...
            </div>
          </div>
        ) : groupedTimeline.length === 0 ? (
          <div className="mt-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center dark:border-slate-700/50 dark:bg-slate-800/35">
            <p className="font-medium text-slate-900 dark:text-slate-100">Nenhuma movimentação registrada ainda.</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              As mudanças de status, notas e tentativas de contato vão aparecer aqui.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {groupedTimeline.map(([groupLabel, entries]) => (
              <div key={groupLabel} className="space-y-3">
                <div className="inline-flex rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:border-slate-700/55 dark:bg-slate-950/85 dark:text-slate-300">
                  {groupLabel}
                </div>
                {entries.map((entry) => (
                  <div key={entry.id} className="surface-subtle rounded-[22px] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={entry.type === "note" ? "secondary" : "outline"} className="uppercase tracking-[0.14em]">
                        {timelineActionLabel(entry)}
                      </Badge>
                      <p className="font-semibold text-slate-950 dark:text-slate-50">{entry.title}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{entry.description}</p>
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
    </section>
  );
}
