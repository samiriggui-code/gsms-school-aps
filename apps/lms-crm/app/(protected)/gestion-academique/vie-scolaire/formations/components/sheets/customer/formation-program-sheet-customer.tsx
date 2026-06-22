'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { LoaderCircleIcon } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_LARGE } from '../../../../constants/sheet-shell-classes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormationOfferEditFormSchema,
  type FormationOfferEditFormValues,
  type FormationCatalogOfferPatchInput,
} from '../../../forms/formation-catalog-api-schemas';
import {
  FORMATION_PARCOURS_LABELS,
  FORMATION_TRACK_LABELS,
  type FormationVitrineItem,
} from '../../../data/formation-vitrine-catalog';
import type { FormationCatalogApiRow } from '../../../types/catalog-api';
import { formationsCatalogQueryRoot } from '../../../hooks/use-formations-catalog-query';
import { formationsStatsQueryKey } from '../../../hooks/use-formations-stats-query';
import { sessionsQueryRoot } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/sessions-manager';
import {
  formationDetailQueryKey,
  type FormationCatalogDetailTemplates,
  type FormationCatalogMergedDetail,
  useFormationDetailQuery,
} from '../../../hooks/use-formation-detail-query';
import {
  toastFormationError,
  toastFormationUpdateCancelled,
  toastFormationUpdateSuccess,
} from '../../../utils/formation-catalog-feedback';
import { buildFormationSheetViewModel } from '../../../utils/formation-catalog-sheet-view-model';
import { FormationOfferFundingPrereqPickers } from '../../formation-offer-funding-prereq-pickers';
import {
  fundingBlocksForPatchPayload,
  inferFundingKeySelection,
  inferPrerequisiteKeySelection,
  normalizeFundingBlocks,
  normalizePrerequisitesTable,
  prerequisitesTableForPatchPayload,
  setsEqual,
} from '../../../utils/formation-offer-template-helpers';
import { CustomerDetailsActivity } from './customer-details-active';
import { CustomerDetailsBilling } from './customer-details-billing';
import { CustomerDetailsInvoice } from './customer-details-invoice';
import { CustomerDetailsOrders } from './customer-details-orders';
import { CustomerDetailsOverviews } from './customer-details-overviews';
import { CustomerDetailsReviews } from './customer-details-reviews';
import { Upload } from './components/upload';
import type { FormationOverviewMetrics } from './components/statistics1';

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Active',
  ARCHIVED: 'Archivée',
} as const;

function formatTraineeCapacity(row: unknown): string | undefined {
  if (!row || typeof row !== 'object') return undefined;
  const r = row as Record<string, unknown>;
  const rawMin = r.traineesMin;
  const rawMax = r.traineesMax;
  /** `Number(null)` === 0 : sans garde on affichait « 0-0 » pour des champs absents. */
  if (rawMin == null || rawMax == null) return undefined;
  if (typeof rawMin === 'string' && rawMin.trim() === '') return undefined;
  if (typeof rawMax === 'string' && rawMax.trim() === '') return undefined;
  const nMin = Number(rawMin);
  const nMax = Number(rawMax);
  if (!Number.isFinite(nMin) || !Number.isFinite(nMax)) return undefined;
  if (nMin < 1 || nMax < 1) return undefined;
  const lo = Math.min(nMin, nMax);
  const hi = Math.max(nMin, nMax);
  return `${lo}-${hi}`;
}

function formatSuccessRatePct(row: FormationCatalogMergedDetail | undefined): string | undefined {
  if (!row) return undefined;
  const r = row as Record<string, unknown>;
  const v = r.successRate;
  if (v == null || v === '') return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return `${Math.round(n)}%`;
}

function strFromMergedDetail(
  row: FormationCatalogMergedDetail | undefined,
  key: string,
): string | null {
  if (!row) return null;
  const v = (row as Record<string, unknown>)[key];
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

/** Ligne liste catalogue : prix / devise affichés avant la fin du GET détail (évite placeholders TFP dans Statistics1). */
function metricsFromCatalogListRow(formation: FormationVitrineItem | null): FormationOverviewMetrics {
  if (!formation) return {};
  const ext = formation as FormationVitrineItem & {
    priceFrom?: number | null;
    currency?: string | null;
    traineesMin?: number | null;
    traineesMax?: number | null;
  };
  const raw = ext.priceFrom;
  const priceAmount =
    raw != null && Number.isFinite(Number(raw)) ? Number(raw) : null;
  return {
    durationDisplay: ext.duration?.trim() || undefined,
    traineeCapacityDisplay: formatTraineeCapacity(ext),
    priceAmount,
    priceCurrency:
      typeof ext.currency === 'string' && ext.currency.trim() ? ext.currency.trim() : 'EUR',
    successRateDisplay: undefined,
  };
}

function detailToFormValues(row: FormationCatalogMergedDetail): FormationOfferEditFormValues {
  return {
    catalogStatus: (row.status as FormationOfferEditFormValues['catalogStatus']) ?? 'ACTIVE',
    priceFrom: row.priceFrom == null || Number.isNaN(Number(row.priceFrom)) ? undefined : Number(row.priceFrom),
    currency: typeof row.currency === 'string' ? row.currency : 'EUR',
    parcoursSpecialite:
      (row.parcoursSpecialite as FormationOfferEditFormValues['parcoursSpecialite']) ?? 'INITIAL',
  };
}

function buildPatchBody(
  values: FormationOfferEditFormValues,
  templates: FormationCatalogDetailTemplates,
  fundingKeys: Set<string>,
  prerequisiteKeys: Set<string>,
): FormationCatalogOfferPatchInput {
  const refF = normalizeFundingBlocks(templates.fundingBlocks);
  const refP = normalizePrerequisitesTable(templates.prerequisitesTable);
  return {
    catalogStatus: values.catalogStatus,
    priceFrom: values.priceFrom === undefined ? undefined : values.priceFrom,
    currency: values.currency?.trim() || undefined,
    parcoursSpecialite: values.parcoursSpecialite,
    fundingBlocks: fundingBlocksForPatchPayload(refF, fundingKeys),
    prerequisitesTable: prerequisitesTableForPatchPayload(refP, prerequisiteKeys),
  };
}

export type FormationProgramSheetCustomerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formation: FormationVitrineItem | null;
  mode?: 'view' | 'edit';
};

export function FormationProgramSheetCustomer({
  open,
  onOpenChange,
  formation,
  mode = 'view',
}: FormationProgramSheetCustomerProps) {
  const queryClient = useQueryClient();
  const slug = formation?.slug ?? null;
  const detailFetchEnabled = Boolean(open && slug);

  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [pendingPatchBody, setPendingPatchBody] = useState<FormationCatalogOfferPatchInput | null>(null);

  const [fundingKeys, setFundingKeys] = useState(() => new Set<string>());
  const [prerequisiteKeys, setPrerequisiteKeys] = useState(() => new Set<string>());
  const initialFundingKeysRef = useRef<Set<string>>(new Set());
  const initialPrerequisiteKeysRef = useRef<Set<string>>(new Set());
  /** Évite de réinitialiser le formulaire à chaque refetch tant que slug + offre catalogue sont les mêmes (sinon perte des changements / isDirty). */
  const catalogHydrationKeyRef = useRef<string | null>(null);

  const detailQuery = useFormationDetailQuery(slug, detailFetchEnabled);

  const form = useForm<FormationOfferEditFormValues>({
    resolver: zodResolver(FormationOfferEditFormSchema),
    defaultValues: {
      catalogStatus: 'ACTIVE',
      currency: 'EUR',
      parcoursSpecialite: 'INITIAL',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (!open) {
      catalogHydrationKeyRef.current = null;
      setSaveConfirmOpen(false);
      setPendingPatchBody(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || mode !== 'edit' || !slug) return;

    const payload = detailQuery.data;
    const row = payload?.item;
    const tpl = payload?.templates;
    if (!row || !tpl) return;

    const offerId =
      row && typeof row === 'object' && 'catalogOfferId' in row && row.catalogOfferId != null
        ? String(row.catalogOfferId)
        : '';
    const hydrationKey = `${slug}:${offerId}`;

    if (catalogHydrationKeyRef.current === hydrationKey) return;

    catalogHydrationKeyRef.current = hydrationKey;
    form.reset(detailToFormValues(row));
    const refF = normalizeFundingBlocks(tpl.fundingBlocks);
    const refP = normalizePrerequisitesTable(tpl.prerequisitesTable);
    const fk = inferFundingKeySelection(refF, row.fundingBlocks);
    const pk = inferPrerequisiteKeySelection(refP, row.prerequisitesTable);
    setFundingKeys(fk);
    setPrerequisiteKeys(pk);
    initialFundingKeysRef.current = new Set(fk);
    initialPrerequisiteKeysRef.current = new Set(pk);
  }, [detailQuery.data, open, mode, slug, form]);

  const pickersDirty = useMemo(
    () =>
      !setsEqual(fundingKeys, initialFundingKeysRef.current) ||
      !setsEqual(prerequisiteKeys, initialPrerequisiteKeysRef.current),
    [fundingKeys, prerequisiteKeys],
  );

  const patchMutation = useMutation({
    mutationFn: async (body: FormationCatalogOfferPatchInput) => {
      const response = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/formations/${encodeURIComponent(slug!)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? 'Enregistrement impossible.');
      }
      return payload.data?.item as FormationCatalogMergedDetail | undefined;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [...formationsCatalogQueryRoot] });
      queryClient.invalidateQueries({ queryKey: formationsStatsQueryKey });
      queryClient.invalidateQueries({ queryKey: [...sessionsQueryRoot] });
      if (slug) queryClient.invalidateQueries({ queryKey: formationDetailQueryKey(slug) });
      toastFormationUpdateSuccess(
        typeof updated?.name === 'string' ? updated.name : formation?.name,
      );
      const tpl = detailQuery.data?.templates;
      if (updated) {
        form.reset(detailToFormValues(updated));
        if (tpl) {
          const refF = normalizeFundingBlocks(tpl.fundingBlocks);
          const refP = normalizePrerequisitesTable(tpl.prerequisitesTable);
          const fk = inferFundingKeySelection(refF, updated.fundingBlocks);
          const pk = inferPrerequisiteKeySelection(refP, updated.prerequisitesTable);
          setFundingKeys(fk);
          setPrerequisiteKeys(pk);
          initialFundingKeysRef.current = new Set(fk);
          initialPrerequisiteKeysRef.current = new Set(pk);
        }
      }
    },
    onError: (error: Error) => toastFormationError(error.message),
  });

  const detailRow = detailQuery.data?.item;
  const listCatalogRow = formation as FormationCatalogApiRow | null;
  const sheetModel = useMemo(
    () => buildFormationSheetViewModel(detailRow, listCatalogRow),
    [detailRow, listCatalogRow],
  );
  const headerRow = detailRow ?? formation;

  const title =
    headerRow && typeof headerRow === 'object' && 'name' in headerRow && headerRow.name
      ? String(headerRow.name)
      : 'Fiche formation';

  const voletLabel =
    headerRow && typeof headerRow === 'object' && 'track' in headerRow && headerRow.track
      ? FORMATION_TRACK_LABELS[headerRow.track as keyof typeof FORMATION_TRACK_LABELS]
      : '—';

  const typeLabel =
    headerRow && typeof headerRow === 'object' && 'tag' in headerRow && headerRow.tag
      ? String(headerRow.tag)
      : '—';

  const durationLabel =
    headerRow && typeof headerRow === 'object' && 'duration' in headerRow && headerRow.duration
      ? String(headerRow.duration)
      : '—';

  const parcoursPedago =
    headerRow &&
    typeof headerRow === 'object' &&
    'parcoursSpecialite' in headerRow &&
    headerRow.parcoursSpecialite
      ? FORMATION_PARCOURS_LABELS[
          headerRow.parcoursSpecialite as keyof typeof FORMATION_PARCOURS_LABELS
        ]
      : '—';

  const statusKey =
    headerRow && typeof headerRow === 'object' && 'status' in headerRow && headerRow.status
      ? (headerRow.status as keyof typeof STATUS_LABELS)
      : 'ACTIVE';
  const statusLabel = STATUS_LABELS[statusKey] ?? STATUS_LABELS.ACTIVE;

  const watchedParcoursForBand = mode === 'edit' ? form.watch('parcoursSpecialite') : undefined;
  const watchedCatalogStatusForBand = mode === 'edit' ? form.watch('catalogStatus') : undefined;

  const parcoursPedagoDisplay =
    mode === 'edit' &&
    watchedParcoursForBand &&
    watchedParcoursForBand in FORMATION_PARCOURS_LABELS
      ? FORMATION_PARCOURS_LABELS[watchedParcoursForBand as keyof typeof FORMATION_PARCOURS_LABELS]
      : parcoursPedago;

  const statusKeyDisplay =
    mode === 'edit' &&
    watchedCatalogStatusForBand &&
    watchedCatalogStatusForBand in STATUS_LABELS
      ? (watchedCatalogStatusForBand as keyof typeof STATUS_LABELS)
      : statusKey;
  const statusLabelDisplay = STATUS_LABELS[statusKeyDisplay] ?? STATUS_LABELS.ACTIVE;

  const watchedPriceForOverview = mode === 'edit' ? form.watch('priceFrom') : undefined;
  const watchedCurrencyForOverview = mode === 'edit' ? form.watch('currency') : undefined;

  const savedPriceNum =
    detailRow != null &&
    detailRow.priceFrom != null &&
    Number.isFinite(Number(detailRow.priceFrom))
      ? Number(detailRow.priceFrom)
      : NaN;
  const savedPriceFinite = Number.isFinite(savedPriceNum);

  const overviewPriceAmount =
    mode === 'edit' && typeof watchedPriceForOverview === 'number' && !Number.isNaN(watchedPriceForOverview)
      ? watchedPriceForOverview
      : savedPriceFinite
        ? savedPriceNum
        : null;

  const overviewCurrency =
    mode === 'edit' &&
    typeof watchedCurrencyForOverview === 'string' &&
    watchedCurrencyForOverview.trim()
      ? watchedCurrencyForOverview.trim()
      : typeof detailRow?.currency === 'string' && detailRow.currency.trim()
        ? detailRow.currency.trim()
        : 'EUR';

  const formationOverviewMetrics: FormationOverviewMetrics =
    detailRow != null
      ? {
          durationDisplay:
            durationLabel !== '—'
              ? durationLabel
              : formation?.duration
                ? formation.duration
                : undefined,
          traineeCapacityDisplay: formatTraineeCapacity(detailRow),
          priceAmount: overviewPriceAmount,
          priceCurrency: overviewCurrency,
          successRateDisplay: formatSuccessRatePct(detailRow),
        }
      : metricsFromCatalogListRow(formation);

  const editBlocked =
    mode !== 'edit' ||
    !slug ||
    detailQuery.isLoading ||
    Boolean(detailQuery.error) ||
    !detailQuery.data?.item ||
    !detailQuery.data?.templates;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE}>
          <SheetHeader className="shrink-0 border-b border-border px-5 py-3.5">
            {mode === 'edit' ? (
              <div className="space-y-1 pe-8">
                <SheetTitle className="font-semibold leading-none text-foreground lg:text-[22px]">
                  {detailQuery.isLoading ? 'Chargement…' : title}
                </SheetTitle>
                <p className="text-xs font-medium text-muted-foreground">
                  Modifier l&apos;offre catalogue
                </p>
              </div>
            ) : (
              <SheetTitle className="font-medium">Fiche formation</SheetTitle>
            )}
          </SheetHeader>

          <SheetBody className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
            {mode === 'edit' && slug && !detailQuery.isLoading && !detailQuery.error && detailRow ? (
              <div className="shrink-0 border-b border-border px-5 py-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge
                    size="sm"
                    variant={
                      statusKeyDisplay === 'ACTIVE'
                        ? 'success'
                        : statusKeyDisplay === 'DRAFT'
                          ? 'warning'
                          : 'secondary'
                    }
                    appearance="light"
                  >
                    {statusLabelDisplay}
                  </Badge>
                  <Badge size="sm" variant="warning" appearance="light">
                    Édition offre
                  </Badge>
                </div>
                <div className="text-2sm mt-2 flex flex-wrap items-center gap-2">
                  <span className="font-normal text-muted-foreground">Parcours:</span>
                  <span className="font-medium text-foreground">{voletLabel}</span>
                  <BadgeDot className="size-1 bg-muted-foreground" />
                  <span className="font-normal text-muted-foreground">Type</span>
                  <span className="font-medium text-foreground">{typeLabel}</span>
                  <BadgeDot className="size-1 bg-muted-foreground" />
                  <span className="font-normal text-muted-foreground">Durée</span>
                  <span className="font-medium text-foreground">{durationLabel}</span>
                  <BadgeDot className="size-1 bg-muted-foreground" />
                  <span className="font-normal text-muted-foreground">Parcours pédago.</span>
                  <span className="font-medium text-foreground">{parcoursPedagoDisplay}</span>
                </div>
              </div>
            ) : null}

            {mode === 'edit' && slug ? (
              <ScrollArea
                className="min-h-0 flex-1"
                viewportClassName="[&>div]:!block [&>div>div]:!block"
              >
                <div className="space-y-4 border-b border-border px-5 py-4">
                <p className="text-xs text-muted-foreground">
                  Le nom, la durée, la{' '}
                  <span className="font-medium text-foreground">fourchette d&apos;effectif par session (indicatif)</span>{' '}
                  et le programme détaillé viennent de la{' '}
                  <span className="font-medium text-foreground">fiche métier référence</span> (à faire évoluer côté
                  données référentiel / seed). Sur cet écran vous mettez à jour uniquement{' '}
                  <span className="font-medium text-foreground">l&apos;offre catalogue</span> : statut, prix affiché,
                  parcours vitrine, financement et prérequis visibles.
                </p>
                {detailRow && !detailQuery.isLoading && !detailQuery.error ? (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Rappel effectif référence : </span>
                    {formatTraineeCapacity(detailRow) ?? 'non renseigné sur la fiche métier — à compléter dans le référentiel.'}
                  </p>
                ) : null}
                {detailQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    Chargement…
                  </div>
                ) : detailQuery.error ? (
                  <p className="text-sm text-destructive">
                    {(detailQuery.error as Error).message}
                  </p>
                ) : (
                  <Form {...form}>
                    <form
                      id="formation-catalog-edit"
                      className="grid grid-cols-2 gap-4 sm:grid-cols-2"
                      onSubmit={form.handleSubmit((values) => {
                        const tpl = detailQuery.data?.templates;
                        if (!tpl) {
                          toastFormationError('Impossible de charger les gabarits de la fiche formation.');
                          return;
                        }
                        try {
                          const body = buildPatchBody(values, tpl, fundingKeys, prerequisiteKeys);
                          setPendingPatchBody(body);
                          setSaveConfirmOpen(true);
                        } catch (e) {
                          toastFormationError((e as Error).message);
                        }
                      })}
                    >
                      <FormField
                        control={form.control}
                        name="catalogStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Statut catalogue</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="DRAFT">Brouillon</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="ARCHIVED">Suspendue (archivée)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="priceFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prix affiché</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v === '') {
                                    field.onChange(undefined);
                                    return;
                                  }
                                  const n = Number(v);
                                  field.onChange(Number.isFinite(n) ? n : undefined);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Devise</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="parcoursSpecialite"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type parcours affiché (init. / MAC / RAN)</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="INITIAL">
                                  {FORMATION_PARCOURS_LABELS.INITIAL}
                                </SelectItem>
                                <SelectItem value="MAC">{FORMATION_PARCOURS_LABELS.MAC}</SelectItem>
                                <SelectItem value="RAN">{FORMATION_PARCOURS_LABELS.RAN}</SelectItem>
                                <SelectItem value="AUTRE">{FORMATION_PARCOURS_LABELS.AUTRE}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormationOfferFundingPrereqPickers
                        fundingTemplate={detailQuery.data?.templates?.fundingBlocks}
                        prerequisitesTemplate={detailQuery.data?.templates?.prerequisitesTable}
                        fundingKeys={fundingKeys}
                        prerequisiteKeys={prerequisiteKeys}
                        onFundingKeysChange={setFundingKeys}
                        onPrerequisiteKeysChange={setPrerequisiteKeys}
                        disabled={detailQuery.isLoading}
                      />
                    </form>
                  </Form>
                )}
                <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    En édition, seuls le statut catalogue, le prix, le parcours affiché et les lignes financement /
                    prérequis sont modifiables ici. La vue détaillée vitrine (cartes, onglets Programme…) reste
                    disponible en ouvrant la fiche en{' '}
                    <span className="font-medium text-foreground">consultation</span> depuis la liste.
                  </p>
                </div>
                </div>
              </ScrollArea>
            ) : null}

            {mode !== 'edit' ? (
              <div className="flex flex-wrap justify-between gap-2 border-b border-border px-5 py-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-lg font-semibold leading-none text-foreground lg:text-[22px]">
                      {title}
                    </span>
                    <Badge
                      size="sm"
                      variant={
                        statusKeyDisplay === 'ACTIVE'
                          ? 'success'
                          : statusKeyDisplay === 'DRAFT'
                            ? 'warning'
                            : 'secondary'
                      }
                      appearance="light"
                    >
                      {statusLabelDisplay}
                    </Badge>
                  </div>
                  <div className="text-2sm flex flex-wrap items-center gap-2">
                    <span className="font-normal text-muted-foreground">Parcours:</span>
                    <span className="font-medium text-foreground">{voletLabel}</span>
                    <BadgeDot className="size-1 bg-muted-foreground" />
                    <span className="font-normal text-muted-foreground">Type</span>
                    <span className="font-medium text-foreground">{typeLabel}</span>
                    <BadgeDot className="size-1 bg-muted-foreground" />
                    <span className="font-normal text-muted-foreground">Durée</span>
                    <span className="font-medium text-foreground">{durationLabel}</span>
                    <BadgeDot className="size-1 bg-muted-foreground" />
                    <span className="font-normal text-muted-foreground">Effectif (indicatif)</span>
                    <span className="font-medium text-foreground">
                      {formatTraineeCapacity(detailRow ?? formation) ?? '—'}
                    </span>
                    <BadgeDot className="size-1 bg-muted-foreground" />
                    <span className="font-normal text-muted-foreground">Parcours pédago.</span>
                    <span className="font-medium text-foreground">{parcoursPedagoDisplay}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {mode !== 'edit' ? (
            <ScrollArea
              className="mx-1.5 min-h-0 flex-1 flex-col"
              viewportClassName="[&>div]:h-full [&>div>div]:h-full"
            >
              <div className="flex grow flex-wrap px-3.5 lg:flex-nowrap">
                <div className="w-full shrink-0 space-y-4 py-5 lg:w-[230px] lg:pe-5">
                  <Upload
                    allowDemoLogoFallback={false}
                    logoUrl={
                      strFromMergedDetail(detailRow, 'logoUrl') ?? listCatalogRow?.logoUrl ?? undefined
                    }
                    companyName={
                      strFromMergedDetail(detailRow, 'providerName') ??
                      listCatalogRow?.providerName ??
                      undefined
                    }
                    email={
                      strFromMergedDetail(detailRow, 'providerEmail') ??
                      listCatalogRow?.providerEmail ??
                      undefined
                    }
                    phone={
                      strFromMergedDetail(detailRow, 'providerPhone') ??
                      listCatalogRow?.providerPhone ??
                      undefined
                    }
                    address={
                      strFromMergedDetail(detailRow, 'providerAddress') ??
                      listCatalogRow?.providerAddress ??
                      undefined
                    }
                    sessionLabel={
                      strFromMergedDetail(detailRow, 'nextSessionLabel') ??
                      listCatalogRow?.nextSessionLabel ??
                      undefined
                    }
                  />
                </div>
                <div className="grow space-y-5 border-border py-5 lg:border-s lg:ps-5">
                  <Tabs defaultValue="overview" className="w-auto text-sm text-muted-foreground">
                    <TabsList className="mb-2.5 inline-flex w-auto grow-0 flex-wrap gap-1">
                      <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
                      <TabsTrigger value="orders">Programme</TabsTrigger>
                      <TabsTrigger value="invoices">Prérequis</TabsTrigger>
                      <TabsTrigger value="billin">Financement</TabsTrigger>
                      <TabsTrigger value="reviews">Sessions</TabsTrigger>
                      <TabsTrigger value="activity">Certification</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview">
                      <CustomerDetailsOverviews
                        formationOverviewMetrics={formationOverviewMetrics}
                        presentation={sheetModel.presentation}
                        loyalty={sheetModel.loyalty}
                      />
                    </TabsContent>
                    <TabsContent value="orders">
                      <CustomerDetailsOrders sheetModel={sheetModel} />
                    </TabsContent>
                    <TabsContent value="invoices">
                      <CustomerDetailsInvoice sheetModel={sheetModel} />
                    </TabsContent>
                    <TabsContent value="billin">
                      <CustomerDetailsBilling sheetModel={sheetModel} />
                    </TabsContent>
                    <TabsContent value="reviews">
                      <CustomerDetailsReviews formationSlug={slug} />
                    </TabsContent>
                    <TabsContent value="activity">
                      <CustomerDetailsActivity certificationSteps={sheetModel.certificationSteps} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </ScrollArea>
            ) : null}
          </SheetBody>

          <SheetFooter className="shrink-0 flex-row justify-end gap-2.5 border-t border-border p-5 pb-4 lg:gap-0">
            {mode === 'edit' ? (
              <Button
                type="submit"
                form="formation-catalog-edit"
                variant="primary"
                disabled={
                  editBlocked ||
                  patchMutation.isPending ||
                  (!form.formState.isDirty && !pickersDirty) ||
                  saveConfirmOpen
                }
              >
                {patchMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            ) : null}
            <Button variant="mono" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={saveConfirmOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !patchMutation.isPending) {
            setSaveConfirmOpen(false);
            setPendingPatchBody(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enregistrer les modifications ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les surcharges (prix, financement, prérequis, statut catalogue) seront enregistrées pour «{' '}
              {title} ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  toastFormationUpdateCancelled();
                  setSaveConfirmOpen(false);
                  setPendingPatchBody(null);
                }}
              >
                Annuler
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction
              variant="primary"
              disabled={patchMutation.isPending || !pendingPatchBody}
              onClick={(e) => {
                e.preventDefault();
                if (!pendingPatchBody || !slug) return;
                patchMutation.mutate(pendingPatchBody, {
                  onSuccess: () => {
                    setSaveConfirmOpen(false);
                    setPendingPatchBody(null);
                  },
                });
              }}
            >
              {patchMutation.isPending ? (
                <>
                  <LoaderCircleIcon className="animate-spin size-4 mr-2 inline" />
                  Envoi…
                </>
              ) : (
                'Confirmer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
