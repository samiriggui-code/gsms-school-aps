'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/table';
import { ScrollArea } from '@repo/ui/scroll-area';
import { Textarea } from '@repo/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Banknote,
  CalendarClock,
  ChevronDown,
  Hash,
  Link2,
  MessageSquare,
  Pencil,
  Percent,
  Receipt,
  Building2,
  FileSpreadsheet,
  Send,
  Printer,
  UserRound,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import type { FinanceDevisDetail } from '../hooks/use-finance-devis-detail-query';
import { useDevisDetailSheet, type DevisDetailInitialTab } from './devis-detail-sheet/hooks/use-devis-detail-sheet';
import { DEVIS_STATUS_LABEL_FR } from '../constants/status-labels';
import { VIE_SCOLAIRE_SHEET_LARGE } from '@/app/(protected)/gestion-academique/vie-scolaire/constants/sheet-shell-classes';
import { financeDevisDetailQueryKey, financeDevisListQueryKey } from '../constants/query-keys';
import { DevisWorkflowStepper } from './devis-workflow-stepper';
import { DevisClientSidebar } from './devis-client-sidebar';
import { devisStatusBadgeVariant } from '../lib/devis-workflow';
import {
  CRM_MARKETING_LEADS_PATH,
  CRM_CANDIDATURES_PATH,
} from '@/app/(protected)/communication-contenu/marketing/formulaires-leads/constants/crm-paths';
import {
  DevisDraftClientSection,
  DevisDraftHeaderSection,
  DevisDraftLinesSection,
  DevisNotesEditorSection,
} from './devis-draft-sections';

export type { DevisDetailInitialTab } from './devis-detail-sheet/hooks/use-devis-detail-sheet';

interface DevisDetailSheetProps {
  devisId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Onglet affiché à l’ouverture (ex. « edit » depuis le bouton Modifier de la liste). */
  initialTab?: DevisDetailInitialTab;
}

const CLIENT_SNAPSHOT_LABELS: Record<string, string> = {
  company: 'Raison sociale',
  companySiret: 'SIRET',
  companySiren: 'SIREN',
  siret: 'SIRET',
  siren: 'SIREN',
  deliveryMode: 'Mode de prestation / livraison',
  preferredDates: 'Période souhaitée',
  fundingHint: 'Financement envisagé',
  traineesExpected: 'Stagiaires prévus',
  address: 'Adresse',
  postalCode: 'Code postal',
  city: 'Ville',
  country: 'Pays',
  vatNumber: 'N° TVA intracommunautaire',
  email: 'E-mail',
  phone: 'Téléphone',
  contactName: 'Contact',
  contactFirstName: 'Prénom du contact',
  contactLastName: 'Nom du contact',
  billingAddress: 'Adresse de facturation',
  shippingAddress: 'Adresse de livraison',
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(value);
}

function formatClientKeyLabel(key: string): string {
  if (CLIENT_SNAPSHOT_LABELS[key]) return CLIENT_SNAPSHOT_LABELS[key];
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function formatSnapshotValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return '—';
  return String(value);
}

function DevisFinancialOverviewCards({ detail }: { detail: FinanceDevisDetail }) {
  const validUntilLabel =
    detail.validUntil != null
      ? (() => {
          try {
            return format(new Date(detail.validUntil), 'd MMMM yyyy', { locale: fr });
          } catch {
            return detail.validUntil;
          }
        })()
      : null;

  const items: {
    title: string;
    value: string;
    subtitle: string;
    icon: typeof Receipt;
    iconClassName: string;
  }[] = [
    {
      icon: Receipt,
      title: 'Sous-total HT',
      value: money(detail.subtotalHt, detail.currency),
      subtitle: 'Hors taxes',
      iconClassName: 'text-sky-600 bg-sky-100',
    },
    {
      icon: Percent,
      title: 'TVA',
      value: money(detail.vatTotal, detail.currency),
      subtitle: 'Montant TVA',
      iconClassName: 'text-violet-600 bg-violet-100',
    },
    {
      icon: Banknote,
      title: 'Total TTC',
      value: money(detail.totalTtc, detail.currency),
      subtitle: 'Toutes taxes comprises',
      iconClassName: 'text-amber-600 bg-amber-100',
    },
  ];

  if (validUntilLabel) {
    items.push({
      icon: CalendarClock,
      title: "Valable jusqu'au",
      value: validUntilLabel,
      subtitle: 'Fin de validité du devis',
      iconClassName: 'text-emerald-600 bg-emerald-100',
    });
  }

  const gridClass =
    items.length >= 4
      ? 'grid w-full grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4'
      : 'grid w-full grid-cols-1 gap-4 sm:grid-cols-3';

  return (
    <div className={gridClass}>
      {items.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
          >
            <div className="absolute -end-8 -top-8 size-24 rounded-full bg-primary/5" />
            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0 pr-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.title}</p>
                <p className="mt-1 text-xl font-semibold text-foreground tabular-nums sm:text-2xl">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg',
                  stat.iconClassName,
                )}
              >
                <Icon className="size-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type DevisLineRow = {
  label: string;
  quantity: number;
  unitPriceHt: number;
  vatRate: number;
};

function normalizeDevisLines(lines: unknown): DevisLineRow[] {
  if (!Array.isArray(lines)) return [];
  return lines
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const o = raw as Record<string, unknown>;
      const label = typeof o.label === 'string' ? o.label : 'Ligne';
      const quantity = Number(o.quantity ?? 1) || 0;
      const unitPriceHt = Number(o.unitPriceHt ?? o.unitPrice ?? 0) || 0;
      const vatRate = Number(o.vatRate ?? o.vat ?? 0) || 0;
      return { label, quantity, unitPriceHt, vatRate };
    })
    .filter((x): x is DevisLineRow => x !== null);
}

function DevisClientContextCard({ snapshot }: { snapshot: Record<string, unknown> }) {
  const entries = Object.entries(snapshot).filter(
    ([, v]) => v !== null && v !== undefined && String(v).trim() !== '' && typeof v !== 'object',
  );

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">Aucune information client enregistrée sur ce devis.</p>
    );
  }

  return (
    <Card className="shadow-none border border-border/60 bg-background">
      <CardHeader className="pb-4 pt-5 px-5 border-b border-border/50">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2.5 text-foreground">
          <div className="p-2 rounded-lg bg-background border border-border">
            <Building2 className="size-4 text-foreground/70" />
          </div>
          Contexte client (figé au devis)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-0">
        {entries.map(([key, value], index) => (
          <div
            key={key}
            className={cn(
              'flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between text-sm py-3',
              index < entries.length - 1 && 'border-b border-dashed border-border/60',
            )}
          >
            <span className="font-medium text-muted-foreground shrink-0">{formatClientKeyLabel(key)}</span>
            <span className="font-semibold text-foreground text-right sm:max-w-[65%] break-words">
              {formatSnapshotValue(value)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DevisLinesTable({
  lines,
  currency,
}: {
  lines: DevisLineRow[];
  currency: string;
}) {
  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">Aucune ligne sur ce devis.</p>;
  }

  let subtotalHt = 0;
  for (const line of lines) {
    subtotalHt += line.quantity * line.unitPriceHt;
  }

  return (
    <div className="rounded-lg border border-border/70 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40%]">Libellé</TableHead>
            <TableHead className="text-right">Qté</TableHead>
            <TableHead className="text-right">PU HT</TableHead>
            <TableHead className="text-right">TVA</TableHead>
            <TableHead className="text-right">Montant HT</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line, i) => {
            const lineHt = line.quantity * line.unitPriceHt;
            return (
              <TableRow key={`${line.label}-${i}`}>
                <TableCell className="font-medium align-top">{line.label}</TableCell>
                <TableCell className="text-right tabular-nums align-top">{line.quantity}</TableCell>
                <TableCell className="text-right tabular-nums align-top">{money(line.unitPriceHt, currency)}</TableCell>
                <TableCell className="text-right tabular-nums align-top">{line.vatRate} %</TableCell>
                <TableCell className="text-right font-medium tabular-nums align-top">{money(lineHt, currency)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="flex justify-end border-t bg-muted/30 px-4 py-3 text-sm">
        <span className="text-muted-foreground mr-3">Sous-total lignes HT</span>
        <span className="font-semibold tabular-nums">{money(subtotalHt, currency)}</span>
      </div>
    </div>
  );
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'd MMM yyyy', { locale: fr });
  } catch {
    return '—';
  }
}

function DevisPlaquetteExchangesPanel({
  messages,
  devisId,
}: {
  messages: NonNullable<FinanceDevisDetail['plaquetteMessages']>;
  devisId: string | null;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');

  const sorted = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  );

  const replyMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!devisId) throw new Error('Devis introuvable.');
      const res = await apiFetch(
        `/api/sections/administration-facturation/finance/devis/${devisId}/plaquette-messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: text }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Envoi impossible.');
      }
      return unwrapSectionApiData<{ message: { id: string } }>(json);
    },
    onSuccess: () => {
      if (devisId) {
        void queryClient.invalidateQueries({ queryKey: [...financeDevisDetailQueryKey, devisId] });
      }
      void queryClient.invalidateQueries({ queryKey: [...financeDevisListQueryKey] });
      setDraft('');
      toast.success(t('devis.replySaved'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendReply = () => {
    const text = draft.trim();
    if (!text) {
      toast.error(t('devis.messageRequired'));
      return;
    }
    replyMutation.mutate(text);
  };

  return (
    <div className="space-y-5">
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 px-4 py-6 text-center">
          <MessageSquare className="mx-auto size-8 text-muted-foreground/70" />
          <p className="mt-3 text-sm font-medium text-foreground">Fil vide pour l’instant</p>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Dès que le client écrit depuis la plaquette publique (ou accepte la proposition), l’historique s’affiche
            ici. Vous pouvez aussi lui écrire en premier ci-dessous : le message sera visible sur sa plaquette.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Fil chronologique partagé avec la plaquette publique. Pas de chat temps réel : le client voit vos réponses
            après rechargement de sa page.
          </p>
          <div className="max-h-[min(360px,calc(100dvh-26rem))] space-y-2 overflow-y-auto pe-1">
            {sorted.map((m) => {
              const isStaff = m.authorKind === 'STAFF';
              return (
                <div
                  key={m.id}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 shadow-sm',
                    isStaff
                      ? 'border-primary/35 bg-primary/[0.06] ms-4 sm:ms-8'
                      : 'border-border/60 bg-muted/15 me-4 sm:me-8',
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded px-1.5 py-0 text-[10px] font-bold uppercase tracking-wide',
                        isStaff ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {isStaff ? 'Équipe' : 'Client'}
                    </span>
                    <p className="text-[11px] font-semibold text-foreground">
                      {m.authorLabel ?? m.authorKind}
                      <span className="font-normal text-muted-foreground">
                        {' '}
                        —{' '}
                        {new Date(m.createdAt).toLocaleString('fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </p>
                  </div>
                  <p className="mt-1.5 text-sm text-foreground/90 whitespace-pre-wrap">{m.body}</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="space-y-2 border-t border-border/60 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Répondre au client</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Le texte est ajouté au même fil que sur la page client (lien plaquette). Pensez à prévenir le client par e-mail
          ou téléphone s’il doit consulter la page.
        </p>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Votre message au client…"
          className="min-h-[100px] text-sm"
          maxLength={8000}
          disabled={!devisId || replyMutation.isPending}
        />
        <Button
          type="button"
          size="sm"
          variant="primary"
          disabled={!devisId || replyMutation.isPending}
          onClick={() => void sendReply()}
        >
          {replyMutation.isPending ? 'Envoi…' : 'Envoyer au client'}
        </Button>
      </div>
    </div>
  );
}

export function DevisDetailSheet({
  devisId,
  open,
  onOpenChange,
  initialTab = 'overview',
}: DevisDetailSheetProps) {
  const {
    detail,
    isLoading,
    detailTab,
    setDetailTab,
    plaquetteLinkBusy,
    sendEmailOpen,
    setSendEmailOpen,
    sendEmailMessage,
    setSendEmailMessage,
    devisPatch,
    workflowSettings,
    recipientEmail,
    canSendEmail,
    sendMutation,
    copyClientPlaquetteLink,
    openClientPlaquettePage,
    snapshot,
  } = useDevisDetailSheet({ devisId, open, initialTab });

  const lineRows = useMemo(
    () => (detail ? normalizeDevisLines(detail.lines) : []),
    [detail],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE}>
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-background shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
            Fiche devis
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
          {isLoading ? (
            <div className="p-5 text-sm text-muted-foreground">Chargement du devis…</div>
          ) : !detail ? (
            <div className="p-5 text-sm text-muted-foreground">Devis introuvable.</div>
          ) : (
            <>
              <div className="flex shrink-0 gap-3 border-b border-border px-4 py-3 bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:px-5">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold leading-tight text-foreground sm:text-lg truncate max-w-[min(100%,28rem)]">
                      {detail.title}
                    </span>
                    <Badge
                      size="sm"
                      variant={devisStatusBadgeVariant(detail.status)}
                      appearance="light"
                      className="shrink-0"
                    >
                      {DEVIS_STATUS_LABEL_FR[detail.status] ?? detail.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5">
                    <span>
                      <span className="font-semibold text-foreground tabular-nums">{detail.referenceCode}</span>
                    </span>
                    <span aria-hidden>·</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {money(detail.totalTtc, detail.currency)} TTC
                    </span>
                    {detail.validUntil ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>val. {formatShortDate(detail.validUntil)}</span>
                      </>
                    ) : null}
                    {detail.formation ? (
                      <>
                        <span aria-hidden className="hidden sm:inline">·</span>
                        <span className="hidden sm:inline truncate max-w-[200px]" title={detail.formation.name}>
                          {detail.formation.name}
                        </span>
                      </>
                    ) : null}
                  </p>
                  <DevisWorkflowStepper status={detail.status} compact className="max-w-md pt-0.5" />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0 lg:pt-0.5">
                  {(detail.status === 'DRAFT' || detail.status === 'SENT') && recipientEmail ? (
                    <Popover open={sendEmailOpen} onOpenChange={setSendEmailOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant={detail.status === 'DRAFT' ? 'primary' : 'outline'}
                          size="sm"
                          className="gap-1 h-8 text-xs"
                          disabled={!canSendEmail || sendMutation.isPending}
                        >
                          <Send className="size-3.5" />
                          {detail.status === 'DRAFT' ? 'Envoyer' : 'Renvoyer'}
                          <ChevronDown className="size-3 opacity-60" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[min(100vw-2rem,22rem)] p-3" align="end">
                        <p className="text-xs font-semibold text-foreground">E-mail au client</p>
                        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                          À <span className="font-medium text-foreground">{recipientEmail}</span> — plaquette, PDF et
                          lignes du devis.
                        </p>
                        <Textarea
                          value={sendEmailMessage}
                          onChange={(e) => setSendEmailMessage(e.target.value)}
                          placeholder="Message optionnel…"
                          className="mt-2 min-h-[72px] text-xs"
                          maxLength={2000}
                          disabled={sendMutation.isPending}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="mt-2 w-full gap-1.5"
                          disabled={!canSendEmail || sendMutation.isPending}
                          onClick={() => sendMutation.mutate(sendEmailMessage)}
                        >
                          <Send className="size-3.5" />
                          {sendMutation.isPending ? 'Envoi…' : 'Confirmer l’envoi'}
                        </Button>
                      </PopoverContent>
                    </Popover>
                  ) : null}

                  {detail.status === 'SENT' ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={devisPatch.isPending}
                      onClick={() => devisPatch.mutate({ status: 'ACCEPTED' })}
                    >
                      Accepté
                    </Button>
                  ) : null}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs">
                        Partager
                        <ChevronDown className="size-3 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem
                        onClick={() => {
                          if (!devisId) return;
                          window.open(
                            `/api/sections/administration-facturation/finance/devis/${devisId}/pdf`,
                            '_blank',
                            'noopener,noreferrer',
                          );
                        }}
                      >
                        <FileSpreadsheet className="size-4" />
                        Document en ligne
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (!devisId) return;
                          window.open(
                            `/api/sections/administration-facturation/finance/devis/${devisId}/pdf?format=pdf`,
                            '_blank',
                            'noopener,noreferrer',
                          );
                        }}
                      >
                        <Printer className="size-4" />
                        Télécharger PDF
                      </DropdownMenuItem>
                      {detail.formation && devisId ? (
                        <>
                          <DropdownMenuItem disabled={plaquetteLinkBusy} onClick={() => void openClientPlaquettePage()}>
                            <FileSpreadsheet className="size-4" />
                            Page client
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={plaquetteLinkBusy} onClick={() => void copyClientPlaquetteLink()}>
                            <Link2 className="size-4" />
                            Copier le lien client
                          </DropdownMenuItem>
                        </>
                      ) : null}
                      {detail.leadId ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`${CRM_MARKETING_LEADS_PATH}?leadId=${encodeURIComponent(detail.leadId)}`}>
                              <UserRound className="size-4" />
                              Lead d&apos;origine
                            </Link>
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {(detail.status === 'DRAFT' || detail.status === 'SENT') && !recipientEmail ? (
                <p className="shrink-0 border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-[11px] text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 lg:px-5">
                  Ajoutez un e-mail (lead ou contexte client) pour envoyer la proposition.
                </p>
              ) : null}

              <ScrollArea
                className="mx-0 flex min-h-0 flex-1 flex-col"
                viewportClassName="[&>div]:h-full [&>div>div]:h-full"
              >
                <div className="flex grow flex-wrap px-3 lg:flex-nowrap lg:px-4">
                  <div className="w-full shrink-0 py-3 lg:w-[210px] lg:pe-4 lg:py-4">
                    <DevisClientSidebar detail={detail} />
                  </div>
                  <div className="grow min-w-0 border-border py-3 lg:border-s lg:ps-4 lg:py-4">
                    <Tabs
                      value={detailTab}
                      onValueChange={(v) => setDetailTab(v as DevisDetailInitialTab)}
                      className="w-auto text-sm text-muted-foreground"
                    >
                      <TabsList className="mb-2.5 inline-flex w-auto grow-0 flex-wrap gap-1">
                        <TabsTrigger value="overview">Résumé</TabsTrigger>
                        {detail.status === 'DRAFT' ? (
                          <TabsTrigger value="edition" className="gap-1.5">
                            <Pencil className="size-3.5 opacity-70" />
                            Édition
                          </TabsTrigger>
                        ) : null}
                        <TabsTrigger value="suivi" className="gap-1.5">
                          <MessageSquare className="size-3.5 opacity-70" />
                          Suivi client
                          {(detail.plaquetteMessages?.length ?? 0) > 0 ? (
                            <span className="ms-0.5 min-w-[1.1rem] rounded-full bg-primary/15 px-1.5 py-0 text-[10px] font-semibold tabular-nums text-primary">
                              {detail.plaquetteMessages!.length}
                            </span>
                          ) : null}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-4 mt-0">
                        {detailTab === 'overview' ? (
                        <>
                        <DevisFinancialOverviewCards detail={detail} />
                        {detail.candidature || detail.formationSession ? (
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                            {detail.candidature ? (
                              <span className="flex items-center gap-1.5">
                                Candidature
                                <Badge variant="outline" className="h-5 text-[10px]">
                                  {detail.candidature.status}
                                </Badge>
                                <Link
                                  href={`${CRM_CANDIDATURES_PATH}?userId=${encodeURIComponent(detail.candidature.userId)}`}
                                  className="text-primary underline-offset-2 hover:underline"
                                >
                                  Ouvrir
                                </Link>
                              </span>
                            ) : null}
                            {detail.formationSession ? (
                              <span>
                                Session : {detail.formationSession.dateDisplayLabel} —{' '}
                                {detail.formationSession.location}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                        <Card className="shadow-none border border-border/50">
                          <CardHeader className="pb-2 border-b border-border/40">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                              <Hash className="size-4 text-muted-foreground" />
                              Détail des prestations
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <DevisLinesTable lines={lineRows} currency={detail.currency} />
                          </CardContent>
                        </Card>
                        {detail.status !== 'DRAFT' ? (
                          <DevisClientContextCard snapshot={snapshot} />
                        ) : null}
                        {detail.notes?.trim() ? (
                          <Card className="shadow-none border border-border/50">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-bold">Notes internes</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detail.notes}</p>
                            </CardContent>
                          </Card>
                        ) : null}
                        </>
                        ) : null}
                      </TabsContent>

                      <TabsContent value="edition" className="space-y-6">
                        {detailTab !== 'edition' ? null : detail.status === 'DRAFT' && devisId ? (
                          <>
                            <p className="text-xs text-muted-foreground leading-relaxed rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5">
                              Complétez les trois blocs ci-dessous, puis utilisez{' '}
                              <strong className="text-foreground">Envoyer par e-mail</strong> ou passez le statut à
                              envoyé. Les montants se recalculent à chaque enregistrement des lignes.
                            </p>
                            <DevisDraftHeaderSection detail={detail} patchMutation={devisPatch} />
                            <DevisDraftClientSection detail={detail} patchMutation={devisPatch} />
                            <DevisDraftLinesSection detail={detail} patchMutation={devisPatch} />
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            L&apos;édition n&apos;est disponible que pour les devis en brouillon.
                          </p>
                        )}
                      </TabsContent>

                      <TabsContent value="suivi" className="space-y-4 mt-0">
                        {detailTab === 'suivi' ? (
                          <>
                        {devisId ? <DevisNotesEditorSection detail={detail} patchMutation={devisPatch} /> : null}
                        <Card className="shadow-none border border-border/50">
                          <CardHeader className="pb-3 border-b border-border/40">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                              <MessageSquare className="size-4 text-muted-foreground" />
                              Messages client (page plaquette)
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <DevisPlaquetteExchangesPanel messages={detail.plaquetteMessages ?? []} devisId={devisId} />
                          </CardContent>
                        </Card>
                          </>
                        ) : null}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetBody>

        <SheetFooter className="flex flex-row flex-wrap items-center justify-end gap-2 border-t border-border p-5 pb-4 lg:gap-2">
          {detail ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" disabled={devisPatch.isPending} className="gap-1.5">
                  Actions devis
                  <ChevronDown className="size-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  disabled={detail.status === 'DRAFT' || devisPatch.isPending}
                  onClick={() => devisPatch.mutate({ status: 'DRAFT' })}
                >
                  Repasser en brouillon
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={detail.status === 'SENT' || devisPatch.isPending}
                  onClick={() => {
                    if (
                      workflowSettings.requirePlaquetteBeforeSend &&
                      !detail.formation
                    ) {
                      toast.error(
                        'Formation requise sur le devis avant envoi (paramètre plaquette activé).',
                      );
                      return;
                    }
                    devisPatch.mutate({ status: 'SENT' });
                  }}
                >
                  Marquer comme envoyé
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={detail.status === 'ACCEPTED' || devisPatch.isPending}
                  onClick={() => {
                    devisPatch.mutate(
                      { status: 'ACCEPTED' },
                      {
                        onSuccess: () => {
                          if (workflowSettings.notifyOnAccept) {
                            toast.info('Acceptation enregistrée — équipe notifiée.');
                          }
                        },
                      },
                    );
                  }}
                >
                  Marquer comme accepté
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={detail.status === 'REJECTED' || devisPatch.isPending}
                  onClick={() => devisPatch.mutate({ status: 'REJECTED' })}
                >
                  Marquer comme refusé
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={detail.status === 'EXPIRED' || devisPatch.isPending}
                  onClick={() => devisPatch.mutate({ status: 'EXPIRED' })}
                >
                  Marquer comme expiré
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {detail.status === 'ACCEPTED' ? (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/administration-facturation/finance/factures?factureId=${encodeURIComponent(detail.id)}`}
                    >
                      Voir dans Factures (devis accepté)
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    disabled={detail.status === 'REJECTED' || devisPatch.isPending}
                    onClick={() => {
                      devisPatch.mutate(
                        { status: 'ACCEPTED' },
                        {
                          onSuccess: () => {
                            toast.success(
                              'Devis accepté — le dossier apparaît dans Factures (devis ACCEPTED).',
                            );
                          },
                        },
                      );
                    }}
                  >
                    Marquer accepté → Factures
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <Button type="button" variant="mono" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
