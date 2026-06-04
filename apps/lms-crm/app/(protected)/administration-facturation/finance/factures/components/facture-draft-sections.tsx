'use client';

import { useEffect, useMemo, useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, CalendarRange, Hash, ListPlus, Pencil, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FinanceCatalogLineRow } from '@/lib/finance-catalog-line-types';
import type { FinanceFactureDetail } from '../hooks/use-finance-facture-detail-query';
import { useFinanceCatalogLinesQuery } from '../hooks/use-finance-catalog-lines-query';

type Line = { label: string; quantity: string; unitPriceHt: string; vatRate: string };

function frCatalogCategory(cat: string): string {
  const m: Record<string, string> = {
    FORMATION: 'Formations (catalogue)',
    PRESTATION: 'Prestations',
    FRAIS: 'Frais et forfaits',
    AUTRE: 'Autre',
  };
  return m[cat] ?? cat;
}

function CatalogLinePicker({
  disabled,
  onPick,
}: {
  disabled: boolean;
  onPick: (row: FinanceCatalogLineRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  /** Charger dès que le bloc lignes est affiché (brouillon), pas seulement à l’ouverture du popover — évite liste vide / course avec le Sheet. */
  const { data = [], isLoading, isError, error } = useFinanceCatalogLinesQuery(!disabled);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return data;
    return data.filter(
      (r) =>
        r.label.toLowerCase().includes(qq) ||
        (r.description?.toLowerCase().includes(qq) ?? false) ||
        frCatalogCategory(r.category).toLowerCase().includes(qq),
    );
  }, [data, q]);

  const grouped = useMemo(() => {
    const m = new Map<string, FinanceCatalogLineRow[]>();
    for (const row of filtered) {
      const k = row.category || 'AUTRE';
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(row);
    }
    const preferred = ['FORMATION', 'PRESTATION', 'FRAIS', 'AUTRE'];
    const keys = [
      ...preferred.filter((c) => m.has(c)),
      ...Array.from(m.keys()).filter((c) => !preferred.includes(c)),
    ];
    return keys.map((cat) => ({ cat, rows: m.get(cat)! }));
  }, [filtered]);

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={disabled}>
          <ListPlus className="size-4" />
          Catalogue prestations
          {!isLoading && data.length > 0 ? (
            <span className="text-muted-foreground tabular-nums">({data.length})</span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[200] w-[min(440px,92vw)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="border-b p-2">
          <Input
            placeholder="Rechercher une formation ou prestation…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9"
          />
        </div>
        <ScrollArea className="h-[min(320px,50vh)]">
          <div className="space-y-3 p-2">
            {isLoading ? <p className="px-2 py-4 text-sm text-muted-foreground">Chargement du catalogue…</p> : null}
            {isError ? (
              <p className="px-2 py-2 text-sm text-destructive">
                {error instanceof Error ? error.message : 'Catalogue indisponible.'}
              </p>
            ) : null}
            {!isLoading && !isError && grouped.every((g) => g.rows.length === 0) ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">Aucune ligne catalogue.</p>
            ) : null}
            {grouped.map(({ cat, rows }) => (
              <div key={cat}>
                <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {frCatalogCategory(cat)}
                </p>
                <div className="space-y-0.5">
                  {rows.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      className="flex w-full flex-col items-start rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        onPick(row);
                        setOpen(false);
                        setQ('');
                      }}
                    >
                      <span className="font-medium text-foreground">{row.label}</span>
                      {row.description ? (
                        <span className="line-clamp-2 text-xs text-muted-foreground">{row.description}</span>
                      ) : null}
                      <span className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        {row.defaultUnitPriceHt != null
                          ? `${row.defaultUnitPriceHt.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${row.currency} HT · TVA ${row.defaultVatRate} %`
                          : `Prix unitaire à ajuster · TVA ${row.defaultVatRate} %`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

const CLIENT_FORM_KEYS = [
  'contactFirstName',
  'contactLastName',
  'contactName',
  'email',
  'phone',
  'company',
  'companySiret',
  'address',
  'postalCode',
  'city',
  'country',
  'deliveryMode',
  'traineesExpected',
  'preferredDates',
  'fundingHint',
  'vatNumber',
  'billingAddress',
  'shippingAddress',
] as const;

type ClientFormKey = (typeof CLIENT_FORM_KEYS)[number];

function initClientForm(raw: unknown): Record<ClientFormKey, string> {
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const out = {} as Record<ClientFormKey, string>;
  for (const k of CLIENT_FORM_KEYS) {
    const v = o[k];
    out[k] = v == null ? '' : typeof v === 'string' ? v : String(v);
  }
  return out;
}

function mergeClientFormIntoSnapshot(original: unknown, form: Record<ClientFormKey, string>): Record<string, unknown> {
  const prev =
    original && typeof original === 'object' && !Array.isArray(original)
      ? { ...(original as Record<string, unknown>) }
      : {};
  for (const k of CLIENT_FORM_KEYS) {
    const t = form[k].trim();
    if (t) prev[k] = t;
    else delete prev[k];
  }
  return prev;
}

function linesFromDetail(detail: FinanceFactureDetail): Line[] {
  const raw = detail.lines;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ label: '', quantity: '1', unitPriceHt: '0', vatRate: '20' }];
  }
  return raw.map((item) => {
    const o = item as Record<string, unknown>;
    return {
      label: typeof o.label === 'string' ? o.label : '',
      quantity: String(o.quantity ?? 1),
      unitPriceHt: String(o.unitPriceHt ?? 0),
      vatRate: String(o.vatRate ?? 20),
    };
  });
}

function validUntilInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

type PatchFn = UseMutationResult<unknown, Error, Record<string, unknown>, unknown>['mutate'];

export function FactureDraftHeaderSection({
  detail,
  patchMutation,
}: {
  detail: FinanceFactureDetail;
  patchMutation: { mutate: PatchFn; isPending: boolean };
}) {
  const isDraft = detail.status === 'DRAFT';
  const [title, setTitle] = useState(detail.title);
  const [validUntil, setValidUntil] = useState(() => validUntilInputValue(detail.validUntil));
  const [currency, setCurrency] = useState(detail.currency || 'EUR');

  useEffect(() => {
    setTitle(detail.title);
    setValidUntil(validUntilInputValue(detail.validUntil));
    setCurrency(detail.currency || 'EUR');
  }, [detail.id, detail.updatedAt, detail.title, detail.validUntil, detail.currency]);

  if (!isDraft) {
    return (
      <p className="text-sm text-muted-foreground">
        L’en-tête (titre, validité, devise) n’est modifiable qu’en <span className="font-medium text-foreground">brouillon</span>.
      </p>
    );
  }

  return (
    <Card className="shadow-none border border-border/60">
      <CardHeader className="pb-3 border-b border-border/40 space-y-1">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <CalendarRange className="size-4 text-muted-foreground" />
          En-tête de la proposition
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground font-normal normal-case tracking-normal">
          Titre affiché au client, date limite de validité et devise. Les montants sont calculés depuis l’onglet « Lignes
          &amp; prix ».
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="facture-h-title">Titre / objet</Label>
          <Input
            id="facture-h-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Proposition formation SST — Entreprise Dupont"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="facture-h-valid">Fin de validité</Label>
            <Input
              id="facture-h-valid"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facture-h-cur">Devise (ISO)</Label>
            <Input
              id="facture-h-cur"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
              maxLength={3}
              className="uppercase tabular-nums"
            />
          </div>
        </div>
        <Button
          type="button"
          variant="primary"
          disabled={patchMutation.isPending}
          onClick={() => {
            const cur = currency.trim().toUpperCase();
            patchMutation.mutate({
              title: title.trim() || detail.title,
              validUntil: validUntil.trim() ? `${validUntil.trim()}T23:59:59.000Z` : null,
              currency: cur.length === 3 ? cur : detail.currency,
            });
          }}
        >
          {patchMutation.isPending ? 'Enregistrement…' : 'Enregistrer l’en-tête'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function FactureDraftClientSection({
  detail,
  patchMutation,
}: {
  detail: FinanceFactureDetail;
  patchMutation: { mutate: PatchFn; isPending: boolean };
}) {
  const isDraft = detail.status === 'DRAFT';
  const [clientForm, setClientForm] = useState<Record<ClientFormKey, string>>(() => initClientForm(detail.clientSnapshot));

  useEffect(() => {
    setClientForm(initClientForm(detail.clientSnapshot));
  }, [detail.id, detail.updatedAt, detail.clientSnapshot]);

  const setClient = (key: ClientFormKey, value: string) => {
    setClientForm((prev) => ({ ...prev, [key]: value }));
  };

  if (!isDraft) {
    return (
      <p className="text-sm text-muted-foreground">
        Le contexte client est figé après envoi de la proposition. Repassez en brouillon depuis le module Devis pour le
        modifier.
      </p>
    );
  }

  return (
    <Card className="shadow-none border border-border/60">
      <CardHeader className="pb-3 border-b border-border/40 space-y-1">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground" />
          Contexte client
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground font-normal normal-case tracking-normal">
          Contact, entreprise et besoins tels qu’ils figureront sur le PDF et dans les échanges. Enregistrez depuis cet
          onglet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-4 rounded-lg border border-border/60 p-4 bg-muted/5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <p className="text-2sm font-medium text-foreground">Contact</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dcf-fn">Prénom</Label>
              <Input id="dcf-fn" value={clientForm.contactFirstName} onChange={(e) => setClient('contactFirstName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dcf-ln">Nom</Label>
              <Input id="dcf-ln" value={clientForm.contactLastName} onChange={(e) => setClient('contactLastName', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dcf-cn">Nom complet (affichage)</Label>
              <Input id="dcf-cn" value={clientForm.contactName} onChange={(e) => setClient('contactName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dcf-em">E-mail</Label>
              <Input id="dcf-em" type="email" value={clientForm.email} onChange={(e) => setClient('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dcf-ph">Téléphone</Label>
              <Input id="dcf-ph" type="tel" value={clientForm.phone} onChange={(e) => setClient('phone', e.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2 pt-2 border-t border-border/50">
              <p className="text-2sm font-medium text-foreground">Entreprise</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dcf-co">Raison sociale</Label>
              <Input id="dcf-co" value={clientForm.company} onChange={(e) => setClient('company', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dcf-siret">SIRET / SIREN</Label>
              <Input id="dcf-siret" value={clientForm.companySiret} onChange={(e) => setClient('companySiret', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dcf-tva">N° TVA intracommunautaire</Label>
              <Input id="dcf-tva" value={clientForm.vatNumber} onChange={(e) => setClient('vatNumber', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dcf-addr">Adresse</Label>
              <Input id="dcf-addr" value={clientForm.address} onChange={(e) => setClient('address', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dcf-pc">Code postal</Label>
              <Input id="dcf-pc" value={clientForm.postalCode} onChange={(e) => setClient('postalCode', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dcf-city">Ville</Label>
              <Input id="dcf-city" value={clientForm.city} onChange={(e) => setClient('city', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dcf-country">Pays</Label>
              <Input id="dcf-country" value={clientForm.country} onChange={(e) => setClient('country', e.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2 pt-2 border-t border-border/50">
              <p className="text-2sm font-medium text-foreground">Projet &amp; prestation</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dcf-del">Modalité / mode de prestation</Label>
              <Input id="dcf-del" value={clientForm.deliveryMode} onChange={(e) => setClient('deliveryMode', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dcf-train">Effectif / stagiaires prévus</Label>
              <Input id="dcf-train" value={clientForm.traineesExpected} onChange={(e) => setClient('traineesExpected', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dcf-fund">Financement envisagé</Label>
              <Input id="dcf-fund" value={clientForm.fundingHint} onChange={(e) => setClient('fundingHint', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dcf-dates">Période ou dates souhaitées</Label>
              <Textarea
                id="dcf-dates"
                rows={3}
                value={clientForm.preferredDates}
                onChange={(e) => setClient('preferredDates', e.target.value)}
                placeholder="Ex. janvier 2026, semaine du 9 au 13 mars…"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dcf-bill">Adresse de facturation (si différente)</Label>
              <Textarea id="dcf-bill" rows={2} value={clientForm.billingAddress} onChange={(e) => setClient('billingAddress', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dcf-ship">Adresse de livraison / site (si différent)</Label>
              <Textarea id="dcf-ship" rows={2} value={clientForm.shippingAddress} onChange={(e) => setClient('shippingAddress', e.target.value)} />
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="primary"
          disabled={patchMutation.isPending}
          onClick={() => {
            patchMutation.mutate({
              clientSnapshot: mergeClientFormIntoSnapshot(detail.clientSnapshot, clientForm),
            });
          }}
        >
          {patchMutation.isPending ? 'Enregistrement…' : 'Enregistrer le client'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function FactureDraftLinesSection({
  detail,
  patchMutation,
}: {
  detail: FinanceFactureDetail;
  patchMutation: { mutate: PatchFn; isPending: boolean };
}) {
  const isDraft = detail.status === 'DRAFT';
  const [lines, setLines] = useState<Line[]>(() => linesFromDetail(detail));

  useEffect(() => {
    setLines(linesFromDetail(detail));
  }, [detail.id, detail.updatedAt, detail.lines]);

  if (!isDraft) {
    return (
      <p className="text-sm text-muted-foreground">
        Les lignes ne sont modifiables qu’en <span className="font-medium text-foreground">brouillon</span>.
      </p>
    );
  }

  return (
    <Card className="shadow-none border border-border/60">
      <CardHeader className="pb-3 border-b border-border/40 space-y-1">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Hash className="size-4 text-muted-foreground" />
          Lignes &amp; montants HT
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground font-normal normal-case tracking-normal">
          Quantités, libellés, prix unitaires hors taxes et TVA. Les totaux TTC sont recalculés à l’enregistrement.
          Insérez des lignes depuis le catalogue (formations catalogue + prestations enregistrées en base).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CatalogLinePicker
            disabled={false}
            onPick={(row) => {
              setLines((prev) => [
                ...prev,
                {
                  label: row.label,
                  quantity: '1',
                  unitPriceHt: row.defaultUnitPriceHt != null ? String(row.defaultUnitPriceHt) : '0',
                  vatRate: String(row.defaultVatRate ?? 20),
                },
              ]);
            }}
          />
        </div>
        <div className="rounded-lg border border-border/60 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/50">
                <TableHead className="min-w-[200px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Libellé
                </TableHead>
                <TableHead className="w-[100px] text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Qté
                </TableHead>
                <TableHead className="w-[130px] text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  PU HT (€)
                </TableHead>
                <TableHead className="w-[100px] text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  TVA (%)
                </TableHead>
                <TableHead className="w-[52px] p-2 text-center">
                  <span className="sr-only">Supprimer</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, idx) => (
                <TableRow key={idx} className="hover:bg-muted/20">
                  <TableCell className="align-middle py-3">
                    <Input
                      aria-label={`Libellé ligne ${idx + 1}`}
                      placeholder="Ex. Formation initiale SST — 2 jours"
                      className="h-9"
                      value={line.label}
                      onChange={(e) => {
                        const next = [...lines];
                        next[idx] = { ...line, label: e.target.value };
                        setLines(next);
                      }}
                    />
                  </TableCell>
                  <TableCell className="align-middle py-3 w-[100px]">
                    <Input
                      aria-label={`Quantité ligne ${idx + 1}`}
                      className="h-9 text-right tabular-nums"
                      type="number"
                      min={0}
                      step="1"
                      inputMode="numeric"
                      value={line.quantity}
                      onChange={(e) => {
                        const next = [...lines];
                        next[idx] = { ...line, quantity: e.target.value };
                        setLines(next);
                      }}
                    />
                  </TableCell>
                  <TableCell className="align-middle py-3 w-[130px]">
                    <Input
                      aria-label={`Prix unitaire HT ligne ${idx + 1}`}
                      className="h-9 text-right tabular-nums"
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={line.unitPriceHt}
                      onChange={(e) => {
                        const next = [...lines];
                        next[idx] = { ...line, unitPriceHt: e.target.value };
                        setLines(next);
                      }}
                    />
                  </TableCell>
                  <TableCell className="align-middle py-3 w-[100px]">
                    <Input
                      aria-label={`Taux TVA ligne ${idx + 1}`}
                      className="h-9 text-right tabular-nums"
                      type="number"
                      min={0}
                      step="0.1"
                      inputMode="decimal"
                      value={line.vatRate}
                      onChange={(e) => {
                        const next = [...lines];
                        next[idx] = { ...line, vatRate: e.target.value };
                        setLines(next);
                      }}
                    />
                  </TableCell>
                  <TableCell className="align-middle py-3 w-[52px] text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="size-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={lines.length <= 1}
                      title="Retirer cette ligne"
                      aria-label={`Supprimer la ligne ${idx + 1}`}
                      onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => setLines([...lines, { label: '', quantity: '1', unitPriceHt: '0', vatRate: '20' }])}
        >
          Ajouter une ligne
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={patchMutation.isPending}
          onClick={() => {
            const payloadLines = lines.map((l) => ({
              label: l.label.trim() || 'Ligne',
              quantity: Number(l.quantity) || 0,
              unitPriceHt: Number(l.unitPriceHt) || 0,
              vatRate: Number(l.vatRate) || 0,
            }));
            patchMutation.mutate({ lines: payloadLines });
          }}
        >
          {patchMutation.isPending ? 'Enregistrement…' : 'Enregistrer les lignes'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function FactureNotesEditorSection({
  detail,
  patchMutation,
}: {
  detail: FinanceFactureDetail;
  patchMutation: { mutate: PatchFn; isPending: boolean };
}) {
  const [notes, setNotes] = useState(detail.notes ?? '');
  const [internalNotes, setInternalNotes] = useState(detail.internalNotes ?? '');

  useEffect(() => {
    setNotes(detail.notes ?? '');
    setInternalNotes(detail.internalNotes ?? '');
  }, [detail.id, detail.updatedAt, detail.notes, detail.internalNotes]);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Contexte lead (lecture seule)</p>
        <p className="whitespace-pre-wrap">{detail.lead?.notes?.trim() ? detail.lead.notes : 'Aucune note sur le lead.'}</p>
      </div>

      <Card className="shadow-none border border-border/60">
        <CardHeader className="pb-2 border-b border-border/40">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Pencil className="size-4 text-muted-foreground" />
            Notes de la proposition
          </CardTitle>
          <CardDescription className="text-xs">
            Notes visibles côté client sur le PDF (optionnel) et notes internes commerciales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="facture-notes-pub">Notes proposition (PDF / client)</Label>
            <Textarea
              id="facture-notes-pub"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Modalités, rappel du contexte commercial…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facture-notes-int">Notes internes</Label>
            <Textarea
              id="facture-notes-int"
              rows={5}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Historique interne, relances, décisions…"
            />
          </div>
          <Button
            type="button"
            variant="primary"
            disabled={patchMutation.isPending}
            onClick={() => patchMutation.mutate({ notes: notes.trim() || null, internalNotes: internalNotes.trim() || null })}
          >
            {patchMutation.isPending ? 'Enregistrement…' : 'Enregistrer les notes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
