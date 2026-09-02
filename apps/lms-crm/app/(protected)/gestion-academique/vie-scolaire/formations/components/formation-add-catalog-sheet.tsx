'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Badge, BadgeDot } from '@repo/ui/badge';
import { Card, CardContent } from '@repo/ui/card';
import { Separator } from '@repo/ui/separator';
import { LoaderCircleIcon, TrendingUp, UserPlus } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@repo/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/form';
import { Input } from '@repo/ui/input';
import { ScrollArea } from '@repo/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import { VIE_SCOLAIRE_SHEET_AUTO } from '../../constants/sheet-shell-classes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { z } from 'zod';
import {
  FormationCatalogOfferCreateSchema,
  formationParcoursSchema,
  type FormationCatalogOfferCreateInput,
} from '../forms/formation-catalog-api-schemas';
import {
  FORMATION_PARCOURS_LABELS,
  FORMATION_TRACK_LABELS,
  FORMATION_VITRINE_CATALOG,
  getFormationCatalogProgram,
} from '../data/formation-vitrine-catalog';
import { formationsCatalogQueryRoot } from '../hooks/use-formations-catalog-query';
import { formationsLibraryQueryKey, useFormationLibraryQuery } from '../hooks/use-formation-library-query';
import { useFormationReferenceTemplatesQuery } from '../hooks/use-formation-reference-templates-query';
import { formationsStatsQueryKey } from '../hooks/use-formations-stats-query';
import { FormationOfferFundingPrereqPickers } from './formation-offer-funding-prereq-pickers';
import {
  fundingBlocksForCreatePayload,
  fundingOptionKey,
  normalizeFundingBlocks,
  normalizePrerequisitesTable,
  prerequisiteOptionKey,
  prerequisitesTableForCreatePayload,
} from '../utils/formation-offer-template-helpers';
import {
  toastFormationCreationCancelled,
  toastFormationCreationSuccess,
  toastFormationError,
} from '../utils/formation-catalog-feedback';
import { buildFormationSheetViewModel } from '../utils/formation-catalog-sheet-view-model';
import type { FormationCatalogApiRow } from '../types/catalog-api';
import { RecentOrders } from './sheets/customer/components/resent-order';
import { LoyaltyTier } from './sheets/customer/components/loyalty-tier';
import { Upload } from './sheets/customer/components/upload';

const addFormSchema = z.object({
  formationId: z.string().uuid({ message: 'Sélectionnez une formation dans la liste.' }),
  parcoursSpecialite: formationParcoursSchema,
  priceFrom: z.string().optional(),
  currency: z.string().max(8).optional(),
});

type AddFormValues = z.infer<typeof addFormSchema>;

/** Libellé « min-max » pour la fourchette stagiaires référence (fiche métier). */
function formatEffectifFourchetteRef(row: {
  traineesMin?: unknown;
  traineesMax?: unknown;
} | null | undefined): string {
  if (!row) return '—';
  const rawMin = row.traineesMin;
  const rawMax = row.traineesMax;
  if (rawMin == null || rawMax == null) return '—';
  if (typeof rawMin === 'string' && rawMin.trim() === '') return '—';
  if (typeof rawMax === 'string' && rawMax.trim() === '') return '—';
  const nMin = Number(rawMin);
  const nMax = Number(rawMax);
  if (!Number.isFinite(nMin) || !Number.isFinite(nMax)) return '—';
  if (nMin < 1 || nMax < 1) return '—';
  const lo = Math.min(nMin, nMax);
  const hi = Math.max(nMin, nMax);
  return `${lo}-${hi}`;
}

/** Bandeau métriques : même gabarit que `Statistics1` (fiche formation), valeurs pilotées par la sélection / le formulaire. */
function AddCatalogMetricsStrip({
  durationLabel,
  effectifLabel,
  priceMain,
  currency,
}: {
  durationLabel: string;
  effectifLabel: string;
  priceMain: string;
  currency: string;
}) {
  const items = [
    {
      total: durationLabel,
      label: 'Durée indicative',
      badgeLabel: 'Réf.',
      badgeColor: 'success' as const,
      text: 'fiche métier',
      number: '',
    },
    {
      total: effectifLabel,
      label: 'Effectif / session',
      badgeLabel: 'Réf.',
      badgeColor: 'success' as const,
      text: 'indicatif fiche métier',
      number: '',
    },
    {
      total: priceMain,
      label: 'Prix catalogue',
      badgeLabel: currency || 'EUR',
      badgeColor: 'warning' as const,
      text: 'à partir de',
      number: priceMain !== '—' ? '€' : '',
    },
    {
      total: '—',
      label: 'Indicateurs vitrine',
      badgeLabel: '—',
      badgeColor: 'secondary' as const,
      text: 'après publication',
      number: '',
    },
  ];

  return (
    <Card className="mb-5 rounded-md bg-accent/70 p-1">
      <CardContent className="rounded-md border border-border bg-background p-0">
        <div className="grid md:grid-cols-4 lg:gap-5">
          {items.map((item, index) => (
            <div
              key={item.label}
              className={`flex flex-col justify-between gap-5 p-4.5 pb-3.5 ${index > 0 ? 'border-border md:border-s' : ''}`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xl font-semibold text-foreground lg:text-2xl">
                  {item.total}
                  <span className="text-xl font-semibold text-secondary-foreground/30 lg:text-2xl">
                    {item.number}
                  </span>
                </span>
                <span className="text-xs font-normal text-secondary-foreground/70">{item.label}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={item.badgeColor} size="sm" appearance="light" className="w-fit">
                  <TrendingUp className="size-3" /> {item.badgeLabel}
                </Badge>
                <span className="text-xs font-normal text-secondary-foreground">{item.text}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Même coque visuelle que `FormationProgramSheetCustomer` (fiche formation), contenu adapté à l’ajout catalogue. */
export default function FormationAddCatalogSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
  const [pendingCreateBody, setPendingCreateBody] = useState<FormationCatalogOfferCreateInput | null>(null);
  const [fundingKeys, setFundingKeys] = useState(() => new Set<string>());
  const [prerequisiteKeys, setPrerequisiteKeys] = useState(() => new Set<string>());
  const [catalogTab, setCatalogTab] = useState('overview');
  const { data: library, isLoading: libraryLoading } = useFormationLibraryQuery();

  const form = useForm<AddFormValues>({
    resolver: zodResolver(addFormSchema),
    defaultValues: {
      formationId: '',
      parcoursSpecialite: 'INITIAL',
      priceFrom: '',
      currency: 'EUR',
    },
    mode: 'onChange',
  });

  const formationId = form.watch('formationId');
  const parcoursWatch = form.watch('parcoursSpecialite');
  const priceFromWatch = form.watch('priceFrom');
  const currencyWatch = form.watch('currency');

  const libraryItems = library?.items ?? [];
  const availableLibraryItems = useMemo(
    () => libraryItems.filter((i) => !i.alreadyInCatalog),
    [libraryItems],
  );

  const selectedMeta = useMemo(
    () => libraryItems.find((x) => x.id === formationId?.trim()),
    [libraryItems, formationId],
  );

  const referenceTemplatesEnabled =
    open &&
    Boolean(formationId?.trim()) &&
    !libraryLoading &&
    Boolean(selectedMeta && !selectedMeta.alreadyInCatalog);

  const templatesQuery = useFormationReferenceTemplatesQuery(
    formationId?.trim() || null,
    referenceTemplatesEnabled,
  );

  const addCatalogOverviewModel = useMemo(() => {
    if (!selectedMeta) return buildFormationSheetViewModel(undefined, null);
    const base = FORMATION_VITRINE_CATALOG.find((i) => i.slug === selectedMeta.slug);
    if (!base) return buildFormationSheetViewModel(undefined, null);
    const rawPrice = priceFromWatch?.trim() ?? '';
    const priceNum = rawPrice === '' ? NaN : Number(rawPrice.replace(',', '.'));
    const tpl = templatesQuery.data;
    const row: FormationCatalogApiRow = {
      ...base,
      parcoursSpecialite: parcoursWatch,
      id: `preview-${selectedMeta.id}`,
      formationId: selectedMeta.id,
      catalogProgramConfig: getFormationCatalogProgram(selectedMeta.slug) ?? { sheet: 'customer' },
      status: 'DRAFT',
      priceFrom: Number.isFinite(priceNum) ? priceNum : null,
      currency: currencyWatch?.trim() || 'EUR',
      traineesMin: selectedMeta.traineesMin,
      traineesMax: selectedMeta.traineesMax,
      fundingBlocks: tpl?.fundingBlocks ?? [],
      prerequisitesTable: tpl?.prerequisitesTable ?? [],
    };
    return buildFormationSheetViewModel(undefined, row);
  }, [selectedMeta, parcoursWatch, priceFromWatch, currencyWatch, templatesQuery.data]);

  useEffect(() => {
    if (!libraryLoading && formationId?.trim() && selectedMeta?.alreadyInCatalog) {
      form.setValue('formationId', '');
    }
  }, [libraryLoading, formationId, selectedMeta?.alreadyInCatalog, form]);

  useEffect(() => {
    if (!open) {
      setCreateConfirmOpen(false);
      setPendingCreateBody(null);
      setFundingKeys(new Set());
      setPrerequisiteKeys(new Set());
      setCatalogTab('overview');
      return;
    }
    setCatalogTab('overview');
    form.reset({
      formationId: '',
      parcoursSpecialite: 'INITIAL',
      priceFrom: '',
      currency: 'EUR',
    });
  }, [open, form]);

  useEffect(() => {
    const data = templatesQuery.data;
    if (!open || !formationId?.trim() || !data?.parcoursSpecialite) return;
    form.setValue('parcoursSpecialite', data.parcoursSpecialite as AddFormValues['parcoursSpecialite']);
  }, [open, formationId, templatesQuery.data, form]);

  useEffect(() => {
    const data = templatesQuery.data;
    if (!open || !formationId?.trim() || !data) return;
    const refF = normalizeFundingBlocks(data.fundingBlocks);
    const refP = normalizePrerequisitesTable(data.prerequisitesTable);
    setFundingKeys(new Set(refF.map((_, i) => fundingOptionKey(i))));
    setPrerequisiteKeys(new Set(refP.map((_, i) => prerequisiteOptionKey(i))));
  }, [open, formationId, templatesQuery.data]);

  useEffect(() => {
    if (!formationId?.trim()) setCatalogTab('overview');
  }, [formationId]);

  const mutation = useMutation({
    mutationFn: async (body: FormationCatalogOfferCreateInput) => {
      const response = await apiFetch('/api/sections/gestion-academique/vie-scolaire/formations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? 'Ajout au catalogue impossible.');
      }
      return payload.data?.item as { name?: string } | undefined;
    },
    onSuccess: (item) => {
      toastFormationCreationSuccess(item?.name ?? selectedMeta?.name);
      queryClient.invalidateQueries({ queryKey: [...formationsCatalogQueryRoot] });
      queryClient.invalidateQueries({ queryKey: formationsStatsQueryKey });
      queryClient.invalidateQueries({ queryKey: formationsLibraryQueryKey });
      setCreateConfirmOpen(false);
      setPendingCreateBody(null);
      onOpenChange(false);
      form.reset({
        formationId: '',
        parcoursSpecialite: 'INITIAL',
        priceFrom: '',
        currency: 'EUR',
      });
    },
    onError: (error: Error) => toastFormationError(error.message),
  });

  const buildPayload = (values: AddFormValues): FormationCatalogOfferCreateInput => {
    const libRow = libraryItems.find((r) => r.id === values.formationId);
    if (libRow?.alreadyInCatalog) {
      throw new Error('Cette formation est déjà dans votre catalogue.');
    }
    if (values.formationId && templatesQuery.isLoading) {
      throw new Error('Chargement des options de la fiche formation…');
    }
    if (values.formationId && templatesQuery.error) {
      throw new Error('Impossible de charger les options définies sur la fiche formation.');
    }
    const refF = normalizeFundingBlocks(templatesQuery.data?.fundingBlocks);
    const refP = normalizePrerequisitesTable(templatesQuery.data?.prerequisitesTable);
    const fundingBlocks = fundingBlocksForCreatePayload(refF, fundingKeys);
    const prerequisitesTable = prerequisitesTableForCreatePayload(refP, prerequisiteKeys);
    const priceRaw = values.priceFrom?.trim();
    const priceFrom =
      priceRaw === '' || priceRaw === undefined ? undefined : Number(priceRaw.replace(',', '.'));
    if (priceFrom !== undefined && !Number.isFinite(priceFrom)) {
      throw new Error('Prix invalide.');
    }

    const draft = {
      formationId: values.formationId,
      catalogStatus: 'ACTIVE' as const,
      parcoursSpecialite: values.parcoursSpecialite,
      priceFrom: priceFrom === undefined ? undefined : priceFrom,
      currency: values.currency?.trim() || undefined,
      fundingBlocks: fundingBlocks === undefined ? undefined : fundingBlocks,
      prerequisitesTable: prerequisitesTable === undefined ? undefined : prerequisitesTable,
    };

    const parsed = FormationCatalogOfferCreateSchema.safeParse(draft);
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map((i) => i.message).join(' '));
    }
    return parsed.data;
  };

  const parcoursPedagoLabel =
    parcoursWatch && parcoursWatch in FORMATION_PARCOURS_LABELS
      ? FORMATION_PARCOURS_LABELS[parcoursWatch as keyof typeof FORMATION_PARCOURS_LABELS]
      : '—';

  const sheetTitle = selectedMeta?.name ?? 'Nouvelle offre catalogue';
  const voletLabel = selectedMeta ? FORMATION_TRACK_LABELS[selectedMeta.track] : '—';
  const typeLabel = selectedMeta?.tag ?? '—';
  const durationLabel = selectedMeta?.duration ?? '—';

  const priceMain = useMemo(() => {
    const raw = priceFromWatch?.trim();
    if (!raw) return '—';
    const n = Number(raw.replace(',', '.'));
    if (!Number.isFinite(n)) return '—';
    return String(n);
  }, [priceFromWatch]);

  const currencyBadge = currencyWatch?.trim() || 'EUR';

  const effectifRefLabel = useMemo(() => {
    const lib = formatEffectifFourchetteRef(selectedMeta);
    if (lib !== '—') return lib;
    return formatEffectifFourchetteRef(templatesQuery.data);
  }, [selectedMeta, templatesQuery.data]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className={VIE_SCOLAIRE_SHEET_AUTO}>
          <SheetHeader className="border-b border-border px-5 py-3.5">
            <SheetTitle className="font-medium">Ajouter au catalogue</SheetTitle>
          </SheetHeader>

          <Form {...form}>
            <form
              id="formation-add-catalog"
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={form.handleSubmit((values) => {
                try {
                  setPendingCreateBody(buildPayload(values));
                  setCreateConfirmOpen(true);
                } catch (e) {
                  toastFormationError((e as Error).message);
                }
              })}
            >
              <SheetBody className="grow p-0">
                <div className="flex flex-wrap justify-between gap-2 border-b border-border px-5 py-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-lg font-semibold leading-none text-foreground lg:text-[22px]">
                        {sheetTitle}
                      </span>
                      {selectedMeta ? (
                        <>
                          <Badge size="sm" variant="success" appearance="light">
                            Active
                          </Badge>
                          <Badge size="sm" variant="secondary" appearance="light">
                            Nouvelle offre
                          </Badge>
                        </>
                      ) : (
                        <Badge size="sm" variant="warning" appearance="light">
                          À configurer
                        </Badge>
                      )}
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
                      <span className="font-normal text-muted-foreground">Parcours pédago.</span>
                      <span className="font-medium text-foreground">{parcoursPedagoLabel}</span>
                    </div>
                  </div>
                </div>

                <ScrollArea
                  className="mx-1.5 flex h-[calc(100dvh-15.8rem)] max-h-[min(560px,calc(100dvh-14rem))] flex-col"
                  viewportClassName="[&>div]:h-full [&>div>div]:h-full"
                >
                  <div className="flex grow flex-wrap px-3.5 lg:flex-nowrap">
                    <div className="w-full shrink-0 space-y-4 py-5 lg:w-[230px] lg:pe-5">
                      <Upload />
                      <Separator className="opacity-40" />
                      <FormField
                        control={form.control}
                        name="formationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Référentiel formations</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={libraryLoading || libraryItems.length === 0}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      libraryLoading ? 'Chargement…' : 'Choisir une formation à ajouter…'
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[min(320px,70vh)]">
                                {libraryItems.map((item) => (
                                  <SelectItem
                                    key={item.id}
                                    value={item.id}
                                    disabled={item.alreadyInCatalog}
                                    textValue={`${item.name} ${FORMATION_TRACK_LABELS[item.track]} ${item.tag}`}
                                  >
                                    <span className={item.alreadyInCatalog ? 'opacity-60' : ''}>
                                      <span className="font-medium">{item.name}</span>
                                      <span className="text-muted-foreground">
                                        {' '}
                                        · {FORMATION_TRACK_LABELS[item.track]} · {item.tag}
                                      </span>
                                      {item.alreadyInCatalog ? (
                                        <span className="ms-1 text-xs font-normal text-muted-foreground">
                                          (déjà au catalogue)
                                        </span>
                                      ) : null}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!libraryLoading && libraryItems.length === 0 ? (
                              <p className="text-xs text-amber-700 dark:text-amber-400">
                                Aucune formation dans le référentiel.
                              </p>
                            ) : null}
                            {!libraryLoading && libraryItems.length > 0 && availableLibraryItems.length === 0 ? (
                              <p className="text-xs text-amber-700 dark:text-amber-400">
                                Toutes les formations du référentiel sont déjà publiées dans votre catalogue.
                              </p>
                            ) : null}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        Liste complète du référentiel : les lignes déjà présentes dans votre catalogue sont grisées.
                        Sélectionnez une formation disponible pour créer manuellement une nouvelle offre catalogue.
                      </p>
                    </div>

                    <div className="grow space-y-5 border-border py-5 lg:border-s lg:ps-5">
                      <Tabs
                        value={catalogTab}
                        onValueChange={setCatalogTab}
                        className="w-auto text-sm text-muted-foreground"
                      >
                        <TabsList className="mb-2.5 inline-flex w-auto grow-0 flex-wrap gap-1">
                          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
                          <TabsTrigger value="orders">Programme</TabsTrigger>
                          <TabsTrigger value="invoices">Prérequis</TabsTrigger>
                          <TabsTrigger value="billin" disabled={!formationId?.trim()}>
                            Financement
                          </TabsTrigger>
                          <TabsTrigger value="reviews">Sessions</TabsTrigger>
                          <TabsTrigger value="activity">Certification</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                          {!formationId?.trim() ? (
                            <p className="rounded-lg border border-dashed px-3 py-12 text-center text-sm text-muted-foreground">
                              Choisissez une formation à gauche pour prévisualiser les blocs vitrine et renseigner le
                              prix / parcours catalogue.
                            </p>
                          ) : (
                            <div className="space-y-5">
                              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                                <FormField
                                  control={form.control}
                                  name="parcoursSpecialite"
                                  render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                      <FormLabel>Type parcours affiché (init. / MAC / RAN)</FormLabel>
                                      <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Initial, MAC, RAN…" />
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
                                <FormField
                                  control={form.control}
                                  name="priceFrom"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Prix affiché (optionnel)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="ex. 2590" inputMode="decimal" {...field} />
                                      </FormControl>
                                      <p className="text-xs text-muted-foreground">Vide = valeur de la fiche référence.</p>
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
                                        <Input placeholder="EUR" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <AddCatalogMetricsStrip
                                durationLabel={durationLabel}
                                effectifLabel={effectifRefLabel}
                                priceMain={priceMain}
                                currency={currencyBadge}
                              />

                              <div className="grid items-stretch gap-5 lg:grid-cols-2">
                                <RecentOrders presentation={addCatalogOverviewModel.presentation} />
                                <LoyaltyTier loyalty={addCatalogOverviewModel.loyalty} />
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="orders" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                          <p className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                            Le programme pédagogique est celui de la fiche métier référence — consultez la fiche formation
                            détail après ajout au catalogue.
                          </p>
                        </TabsContent>

                        <TabsContent value="invoices" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                          <p className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                            Les prérequis affichés catalogue se configurent dans l&apos;onglet Financement (cases à cocher
                            issues de la référence).
                          </p>
                        </TabsContent>

                        <TabsContent value="billin" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                          {!formationId?.trim() ? (
                            <p className="rounded-lg border border-dashed px-3 py-12 text-center text-sm text-muted-foreground">
                              Sélectionnez une formation référence pour charger les modalités issues de la fiche métier.
                            </p>
                          ) : templatesQuery.isLoading ? (
                            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                              <LoaderCircleIcon className="size-4 animate-spin" />
                              Chargement des options financement / prérequis…
                            </div>
                          ) : templatesQuery.error ? (
                            <p className="text-sm text-destructive">
                              {(templatesQuery.error as Error).message}
                            </p>
                          ) : (
                            <FormationOfferFundingPrereqPickers
                              fundingTemplate={templatesQuery.data?.fundingBlocks}
                              prerequisitesTemplate={templatesQuery.data?.prerequisitesTable}
                              fundingKeys={fundingKeys}
                              prerequisiteKeys={prerequisiteKeys}
                              onFundingKeysChange={setFundingKeys}
                              onPrerequisiteKeysChange={setPrerequisiteKeys}
                            />
                          )}
                        </TabsContent>

                        <TabsContent value="reviews" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                          <p className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                            Les sessions vitrine se gèrent sur la fiche catalogue une fois l&apos;offre créée.
                          </p>
                        </TabsContent>

                        <TabsContent value="activity" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                          <p className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                            La certification affichée reprend les données du référentiel formation.
                          </p>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </ScrollArea>
              </SheetBody>

              <SheetFooter className="flex-row justify-end gap-2.5 border-t border-border p-5 pb-4 lg:gap-0">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={
                    mutation.isPending ||
                    availableLibraryItems.length === 0 ||
                    createConfirmOpen ||
                    libraryLoading ||
                    !formationId?.trim() ||
                    !selectedMeta ||
                    selectedMeta.alreadyInCatalog ||
                    (referenceTemplatesEnabled &&
                      (templatesQuery.isLoading || templatesQuery.isError || !templatesQuery.data))
                  }
                >
                  <UserPlus className="mr-2 size-4" />
                  Ajouter au catalogue
                </Button>
                <Button type="button" variant="mono" onClick={() => onOpenChange(false)}>
                  Fermer
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={createConfirmOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !mutation.isPending) {
            setCreateConfirmOpen(false);
            setPendingCreateBody(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajouter cette formation au catalogue ?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCreateBody && selectedMeta ? (
                <>
                  « {selectedMeta.name} » sera visible dans la liste avec le parcours, le prix et le financement que
                  vous avez indiqués.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  toastFormationCreationCancelled();
                  setCreateConfirmOpen(false);
                  setPendingCreateBody(null);
                }}
              >
                Annuler
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction
              variant="primary"
              disabled={mutation.isPending || !pendingCreateBody}
              onClick={(e) => {
                e.preventDefault();
                if (!pendingCreateBody) return;
                mutation.mutate(pendingCreateBody);
              }}
            >
              {mutation.isPending ? (
                <>
                  <LoaderCircleIcon className="animate-spin size-4 mr-2 inline" />
                  Ajout…
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
