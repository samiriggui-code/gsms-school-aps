'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDateTime } from '@/lib/helpers';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { nextPublicPathPrefix } from '@/lib/next-public-path-prefix';
import {
  Banknote,
  CalendarClock,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Hash,
  Link2,
  MessageSquare,
  Pencil,
  Percent,
  Receipt,
  Building2,
  Send,
  Printer,
  UserRound,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useFinanceDevisDetailQuery, type FinanceDevisDetail } from '../hooks/use-finance-devis-detail-query';
import { useDevisPatchMutation } from '../hooks/use-devis-patch-mutation';
import { DEVIS_STATUS_LABEL_FR } from '../constants/status-labels';
import { VIE_SCOLAIRE_SHEET_LARGE } from '@/app/(protected)/gestion-academique/vie-scolaire/constants/sheet-shell-classes';
import { financeDevisDetailQueryKey, financeDevisListQueryKey } from '../constants/query-keys';
import { Upload } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/components/upload';
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

export type DevisDetailInitialTab =
  | 'overview'
  | 'edit'
  | 'client'
  | 'lines'
  | 'notes'
  | 'exchanges';

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

function strSnap(s: Record<string, unknown>, key: string): string | undefined {
  const v = s[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function formatAddressFromSnapshot(s: Record<string, unknown>): string | undefined {
  const line = strSnap(s, 'address');
  const pc = strSnap(s, 'postalCode');
  const city = strSnap(s, 'city');
  const tail = [pc, city].filter(Boolean).join(' ').trim();
  const parts = [line, tail].filter(Boolean);
  return parts.length ? parts.join(', ') : undefined;
}

function devisStatusBadgeVariant(status: string): 'success' | 'warning' | 'info' | 'destructive' | 'secondary' {
  switch (status) {
    case 'ACCEPTED':
      return 'success';
    case 'DRAFT':
      return 'warning';
    case 'SENT':
      return 'info';
    case 'REJECTED':
      return 'destructive';
    case 'EXPIRED':
      return 'secondary';
    default:
      return 'secondary';
  }
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
          Le texte est ajouté au même fil que sur la plaquette (lien magique). Pensez à prévenir le client par e-mail
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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: detail, isLoading } = useFinanceDevisDetailQuery(devisId, open && !!devisId);
  const devisPatch = useDevisPatchMutation(devisId);
  const [detailTab, setDetailTab] = useState<DevisDetailInitialTab>('overview');
  const tabSyncRef = useRef<{ devisId: string | null; initialTab: DevisDetailInitialTab }>({
    devisId: null,
    initialTab: 'overview',
  });

  useEffect(() => {
    if (!open) {
      setDetailTab('overview');
      tabSyncRef.current = { devisId: null, initialTab: 'overview' };
      return;
    }
    if (!devisId) return;

    const want = (initialTab ?? 'overview') as DevisDetailInitialTab;
    const sameIntent =
      tabSyncRef.current.devisId === devisId && tabSyncRef.current.initialTab === want;
    if (sameIntent) return;

    let next: DevisDetailInitialTab = want;
    if (next === 'edit') {
      if (!detail) return;
      if (detail.status !== 'DRAFT') next = 'overview';
    }
    tabSyncRef.current = { devisId, initialTab: want };
    setDetailTab(next);
  }, [open, devisId, initialTab, detail]);

  useEffect(() => {
    if (!open || !detail) return;
    if (detailTab === 'edit' && detail.status !== 'DRAFT') setDetailTab('overview');
  }, [open, detail, detailTab]);

  const lineRows = detail ? normalizeDevisLines(detail.lines) : [];

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!devisId) throw new Error('Devis introuvable.');
      const res = await apiFetch(`/api/sections/administration-facturation/finance/devis/${devisId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Envoi impossible.');
      }
      return unwrapSectionApiData<{ sent?: boolean }>(json);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...financeDevisDetailQueryKey, devisId] });
      void queryClient.invalidateQueries({ queryKey: [...financeDevisListQueryKey] });
      toast.success(t('devis.emailSent'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyClientPlaquetteLink = async () => {
    if (!devisId) return;
    const res = await apiFetch(
      `/api/sections/administration-facturation/finance/devis/${devisId}/plaquette-public-link`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttlDays: 60 }),
      },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((json as { error?: { message?: string } }).error?.message ?? t('devis.linkGenerateFailed'));
      return;
    }
    const payload = unwrapSectionApiData<{ url: string }>(json);
    if (!payload?.url) {
      toast.error(t('devis.unexpectedResponse'));
      return;
    }
    try {
      await navigator.clipboard.writeText(payload.url);
      toast.success(t('devis.clientLinkCopied'));
    } catch {
      toast.message(t('devis.linkGeneratedTitle'), { description: payload.url });
    }
  };

  const snapshot = (detail?.clientSnapshot ?? {}) as Record<string, unknown>;
  const companySidebar =
    strSnap(snapshot, 'company') ??
    (detail?.lead ? `${detail.lead.firstName} ${detail.lead.lastName}`.trim() : undefined);
  const emailSidebar = strSnap(snapshot, 'email') ?? detail?.lead?.email ?? undefined;
  const phoneSidebar = strSnap(snapshot, 'phone') ?? detail?.lead?.phone ?? undefined;
  const addressSidebar = formatAddressFromSnapshot(snapshot);
  const sessionLabel =
    detail?.formation?.name ??
    (detail?.title ? `Objet : ${detail.title}` : 'Proposition commerciale');

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
              <div className="flex shrink-0 flex-wrap justify-between gap-2 border-b border-border px-5 py-4 bg-background">
                <div className="flex flex-col gap-3 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-lg font-semibold leading-none text-foreground lg:text-[22px] truncate">
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
                  <div className="text-2sm flex flex-wrap items-center gap-2 text-muted-foreground">
                    <span className="font-normal">N° devis</span>
                    <span className="font-medium text-foreground tabular-nums">{detail.referenceCode}</span>
                    <BadgeDot className="size-1 bg-muted-foreground" />
                    <span className="font-normal">Créé le</span>
                    <span className="font-medium text-foreground">{formatShortDate(detail.createdAt)}</span>
                    <BadgeDot className="size-1 bg-muted-foreground" />
                    <span className="font-normal">Mis à jour</span>
                    <span className="font-medium text-foreground">{formatShortDate(detail.updatedAt)}</span>
                    <BadgeDot className="size-1 bg-muted-foreground" />
                    <span className="font-normal">Validité</span>
                    <span className="font-medium text-foreground">
                      {detail.validUntil ? formatShortDate(detail.validUntil) : 'Non définie'}
                    </span>
                    <BadgeDot className="size-1 bg-muted-foreground" />
                    <span className="font-normal">Devise</span>
                    <span className="font-medium text-foreground">{detail.currency}</span>
                    <BadgeDot className="size-1 bg-muted-foreground" />
                    <span className="font-normal">Lignes</span>
                    <span className="font-medium text-foreground tabular-nums">{lineRows.length}</span>
                    {detail.lead?.source ? (
                      <>
                        <BadgeDot className="size-1 bg-muted-foreground" />
                        <span className="font-normal">Source demande</span>
                        <span className="font-medium text-foreground max-w-[220px] truncate" title={detail.lead.source}>
                          {detail.lead.source}
                        </span>
                      </>
                    ) : null}
                    {detail.formation ? (
                      <>
                        <BadgeDot className="size-1 bg-muted-foreground" />
                        <span className="font-normal">Formation</span>
                        <span className="font-medium text-foreground max-w-[280px] truncate" title={detail.formation.name}>
                          {detail.formation.name}
                        </span>
                      </>
                    ) : null}
                    {detail.lead ? (
                      <>
                        <BadgeDot className="size-1 bg-muted-foreground" />
                        <span className="font-normal">Contact</span>
                        <span className="font-medium text-foreground">
                          {detail.lead.firstName} {detail.lead.lastName}
                        </span>
                      </>
                    ) : null}
                    {detail.leadId ? (
                      <>
                        <BadgeDot className="size-1 bg-muted-foreground" />
                        <span className="font-normal">ID lead</span>
                        <span className="font-mono text-[11px] font-medium text-foreground/80" title={detail.leadId}>
                          {detail.leadId.slice(0, 8)}…
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-5 py-2.5 bg-muted/15">
                {detail.leadId ? (
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link href={`${CRM_MARKETING_LEADS_PATH}?leadId=${encodeURIComponent(detail.leadId)}`}>
                      <UserRound className="size-3.5" />
                      Voir le lead
                    </Link>
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    if (!devisId) return;
                    window.open(
                      `/api/sections/administration-facturation/finance/devis/${devisId}/pdf`,
                      '_blank',
                      'noopener,noreferrer',
                    );
                  }}
                >
                  <Printer className="size-3.5" />
                  Aperçu imprimable
                </Button>
                {detail.formation && devisId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      const u = new URL(window.location.href);
                      const prefix = nextPublicPathPrefix();
                      const path = `${prefix}/administration-facturation/finance/devis/${devisId}/plaquette`
                        .replace(/\/{2,}/g, '/');
                      const href = new URL(
                        path.startsWith('/') ? path : `/${path}`,
                        `${u.protocol}//${u.host}`,
                      ).toString();
                      window.open(href, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <FileSpreadsheet className="size-3.5" />
                    Plaquette commerciale
                  </Button>
                ) : null}
                {detail.formation && devisId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => void copyClientPlaquetteLink()}
                  >
                    <Link2 className="size-3.5" />
                    Lien client (magique)
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="gap-1.5"
                  disabled={!detail.lead?.email || sendMutation.isPending}
                  onClick={() => sendMutation.mutate()}
                >
                  <Send className="size-3.5" />
                  {sendMutation.isPending ? 'Envoi…' : 'Envoyer au client'}
                </Button>
              </div>

              {detail.candidature || detail.formationSession ? (
                <div className="shrink-0 border-b border-border px-5 py-3 bg-background">
                  <Card className="shadow-none border border-border/50">
                    <CardHeader className="py-3 px-4 pb-2">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Liens dossier & session
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0 text-sm space-y-2">
                      {detail.candidature ? (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-muted-foreground">Candidature CRM</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{detail.candidature.status}</Badge>
                            <Button asChild variant="ghost" size="sm" className="h-auto p-0 text-primary underline-offset-4 hover:underline">
                              <Link
                                href={`${CRM_CANDIDATURES_PATH}?userId=${encodeURIComponent(detail.candidature.userId)}`}
                              >
                                Ouvrir le dossier
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ) : null}
                      {detail.formationSession ? (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-muted-foreground">Session visée</span>
                          <span className="font-medium text-right max-w-[70%]">
                            {detail.formationSession.dateDisplayLabel} — {detail.formationSession.location}
                          </span>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              <ScrollArea
                className="mx-1.5 flex min-h-0 flex-1 flex-col h-[calc(100dvh-15.8rem)] max-h-[min(560px,calc(100dvh-14rem))]"
                viewportClassName="[&>div]:h-full [&>div>div]:h-full"
              >
                <div className="flex grow flex-wrap px-3.5 lg:flex-nowrap">
                  <div className="w-full shrink-0 space-y-4 py-5 lg:w-[230px] lg:pe-5">
                    <Upload
                      allowDemoLogoFallback={false}
                      logoUrl={null}
                      companyName={companySidebar ?? ''}
                      email={emailSidebar ?? ''}
                      phone={phoneSidebar ?? ''}
                      address={addressSidebar ?? ''}
                      sessionLabel={sessionLabel || 'Contexte devis'}
                    />
                  </div>
                  <div className="grow space-y-5 border-border py-5 lg:border-s lg:ps-5 min-w-0">
                    <Tabs
                      value={detailTab}
                      onValueChange={(v) => setDetailTab(v as DevisDetailInitialTab)}
                      className="w-auto text-sm text-muted-foreground"
                    >
                      <TabsList className="mb-2.5 inline-flex w-auto grow-0 flex-wrap gap-1">
                        <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
                        {detail.status === 'DRAFT' ? (
                          <TabsTrigger value="edit" className="gap-1.5">
                            <Pencil className="size-3.5 opacity-70" />
                            En-tête
                          </TabsTrigger>
                        ) : null}
                        <TabsTrigger value="client">Client</TabsTrigger>
                        <TabsTrigger value="lines">Lignes &amp; prix</TabsTrigger>
                        <TabsTrigger value="notes">Notes</TabsTrigger>
                        <TabsTrigger value="exchanges" className="gap-1.5">
                          <MessageSquare className="size-3.5 opacity-70" />
                          Échanges plaquette
                          {(detail.plaquetteMessages?.length ?? 0) > 0 ? (
                            <span className="ms-0.5 min-w-[1.1rem] rounded-full bg-primary/15 px-1.5 py-0 text-[10px] font-semibold tabular-nums text-primary">
                              {detail.plaquetteMessages!.length}
                            </span>
                          ) : null}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-5">
                        <DevisFinancialOverviewCards detail={detail} />

                        <Card className="shadow-none border border-border/50">
                          <CardHeader className="pb-2 border-b border-border/40">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                              <FileText className="size-4 text-muted-foreground" />
                              Résumé commercial
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 space-y-3 text-sm">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="flex justify-between gap-3 border-b border-dashed border-border/50 pb-2 sm:border-0 sm:pb-0">
                                <span className="text-muted-foreground shrink-0">Référence</span>
                                <span className="font-semibold text-right tabular-nums">{detail.referenceCode}</span>
                              </div>
                              <div className="flex justify-between gap-3 border-b border-dashed border-border/50 pb-2 sm:border-0 sm:pb-0">
                                <span className="text-muted-foreground shrink-0">Objet / titre</span>
                                <span className="font-medium text-right">{detail.title}</span>
                              </div>
                              <div className="flex justify-between gap-3 border-b border-dashed border-border/50 pb-2 sm:border-0 sm:pb-0">
                                <span className="text-muted-foreground shrink-0">Création</span>
                                <span className="font-medium text-right">{formatDateTime(detail.createdAt)}</span>
                              </div>
                              <div className="flex justify-between gap-3 border-b border-dashed border-border/50 pb-2 sm:border-0 sm:pb-0">
                                <span className="text-muted-foreground shrink-0">Dernière MAJ</span>
                                <span className="font-medium text-right">{formatDateTime(detail.updatedAt)}</span>
                              </div>
                              <div className="flex justify-between gap-3 sm:col-span-2">
                                <span className="text-muted-foreground shrink-0">Montant TTC</span>
                                <span className="font-semibold text-right text-base tabular-nums">
                                  {money(detail.totalTtc, detail.currency)}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                              Vue synthétique des montants et du titre. Le détail client se modifie dans l’onglet{' '}
                              <span className="font-medium text-foreground">Client</span>, les lignes dans{' '}
                              <span className="font-medium text-foreground">Lignes &amp; prix</span>, les notes dans{' '}
                              <span className="font-medium text-foreground">Notes</span>, les échanges client
                              (plaquette) dans{' '}
                              <span className="font-medium text-foreground">Échanges plaquette</span>.
                              {detail.formation ? (
                                <>
                                  {' '}
                                  La{' '}
                                  <span className="font-medium text-foreground">plaquette commerciale</span> s’ouvre
                                  dans le layout CRM ; le bouton{' '}
                                  <span className="font-medium text-foreground">Lien client (magique)</span> copie une
                                  URL publique signée (hors CRM) pour consultation par le client.
                                </>
                              ) : null}
                              {detail.status === 'DRAFT' ? (
                                <>
                                  {' '}
                                  En brouillon, l’onglet{' '}
                                  <button
                                    type="button"
                                    className="font-medium text-primary underline-offset-2 hover:underline"
                                    onClick={() => setDetailTab('edit')}
                                  >
                                    En-tête
                                  </button>{' '}
                                  sert au titre, à la validité et à la devise.
                                </>
                              ) : null}
                            </p>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="edit" className="space-y-4">
                        {detail.status === 'DRAFT' && devisId ? (
                          <DevisDraftHeaderSection detail={detail} patchMutation={devisPatch} />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            L’en-tête (titre, validité, devise) n’est modifiable que pour les devis au statut brouillon.
                          </p>
                        )}
                      </TabsContent>

                      <TabsContent value="client" className="space-y-3">
                        {detail.status === 'DRAFT' && devisId ? (
                          <DevisDraftClientSection detail={detail} patchMutation={devisPatch} />
                        ) : (
                          <>
                            <p className="text-xs text-muted-foreground">
                              Contexte client figé sur ce devis (hors brouillon). Repassez en brouillon pour modifier.
                            </p>
                            <DevisClientContextCard snapshot={snapshot} />
                          </>
                        )}
                      </TabsContent>

                      <TabsContent value="lines" className="space-y-3">
                        {detail.status === 'DRAFT' && devisId ? (
                          <DevisDraftLinesSection detail={detail} patchMutation={devisPatch} />
                        ) : (
                          <Card className="shadow-none border">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Hash className="size-4 text-muted-foreground" />
                                Lignes du devis
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 sm:p-6 pt-0 space-y-3">
                              <DevisLinesTable lines={lineRows} currency={detail.currency} />
                            </CardContent>
                          </Card>
                        )}
                      </TabsContent>

                      <TabsContent value="notes" className="space-y-4">
                        {devisId ? <DevisNotesEditorSection detail={detail} patchMutation={devisPatch} /> : null}
                      </TabsContent>

                      <TabsContent value="exchanges" className="space-y-4">
                        <Card className="shadow-none border border-border/50">
                          <CardHeader className="pb-3 border-b border-border/40">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                              <MessageSquare className="size-4 text-muted-foreground" />
                              Échanges via la plaquette
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <DevisPlaquetteExchangesPanel messages={detail.plaquetteMessages ?? []} devisId={devisId} />
                          </CardContent>
                        </Card>
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
                  onClick={() => devisPatch.mutate({ status: 'SENT' })}
                >
                  Marquer comme envoyé
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={detail.status === 'ACCEPTED' || devisPatch.isPending}
                  onClick={() => devisPatch.mutate({ status: 'ACCEPTED' })}
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
                <DropdownMenuItem
                  onClick={() => {
                    toast.message('Facturation', {
                      description:
                        'Le module factures est en cours de finalisation. La conversion devis → facture sera disponible ici ; en attendant, vous pouvez traiter le statut du devis (accepté / envoyé) et retrouver le lead depuis Marketing.',
                    });
                  }}
                >
                  Transformer en facture…
                </DropdownMenuItem>
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
