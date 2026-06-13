'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  Lock,
  MonitorPlay,
  PlayCircle,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { E_FORMATION_BASE, eFormationModulePath } from '@/lib/portal/e-formation-paths';
import { FormationInstructorProfile } from '@/components/portal/formation-instructor-profile';
import { FormationCatalogMetaBar } from '@/components/portal/formation-catalog-meta';
import type { FormationPortalDisplayMeta } from '@/lib/portal/formation-portal-display';
import { PortalPageShell } from '@/components/portal/layout/portal-page-shell';
import { PortalStatGrid } from '@/components/portal/layout/portal-stat-grid';
import { portalMuted, portalPageTitle, portalSectionTitle } from '@/components/portal/layout/portal-ui';
import type { PortalFormationInstructor } from '@/lib/portal/portal-formation-instructor';
import { Statistics2 } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/components/statistics2';
import { DetailsOrdersTable } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/tables/details-orders';
import { SheetPrerequisitesTable } from '@/components/sheet-shared/prerequisites-table';
import type { FormationOverviewMetrics } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/components/statistics1';
import type { FormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type FormationPayload = {
  hasFormation: boolean;
  formation?: {
    id: string;
    slug: string;
    name: string;
    tag: string | null;
    duration: string | null;
    logoUrl: string | null;
    deliveryMode: string | null;
    providerName: string | null;
    providerEmail: string | null;
    providerPhone: string | null;
    cpfEligible: boolean;
    qualiopiCertified: boolean;
    clientSatisfactionRate: number | null;
  };
  sheet?: FormationSheetViewModel | null;
  metrics?: FormationOverviewMetrics | null;
  instructor?: PortalFormationInstructor | null;
  catalogDisplay?: FormationPortalDisplayMeta | null;
  lms?: {
    tier: string;
    label: string;
    canStart: boolean;
    courseId: string | null;
    progressPercent: number;
    completedChapterCount: number;
    chapterCount: number;
    nextChapterId: string | null;
    imageUrl: string | null;
  };
  sessionStartsAt?: string | null;
};

function formatPrice(metrics: FormationOverviewMetrics | null | undefined) {
  const amount = metrics?.priceAmount;
  if (amount == null || !Number.isFinite(amount)) return null;
  const curr = metrics?.priceCurrency?.trim() || 'EUR';
  const symbol = curr === 'EUR' ? '€' : curr;
  return `${Number.isInteger(amount) ? amount : amount.toFixed(2)} ${symbol}`;
}

function StartButton({
  lms,
  size = 'lg',
  className,
}: {
  lms: FormationPayload['lms'];
  size?: 'md' | 'lg';
  className?: string;
}) {
  if (!lms?.canStart) {
    return (
      <Button size={size} disabled className={className}>
        <Lock className="mr-2 size-4" />
        Dossier requis pour accéder
      </Button>
    );
  }

  const href =
    lms.courseId && lms.nextChapterId
      ? eFormationModulePath(lms.courseId, lms.nextChapterId)
      : E_FORMATION_BASE;

  const label =
    lms.progressPercent > 0 ? 'Reprendre ma formation' : 'Démarrer ma formation';

  return (
    <Button asChild size={size} className={cn('w-full font-semibold', className)}>
      <Link href={href}>
        <PlayCircle className="mr-2 size-4" />
        {label}
      </Link>
    </Button>
  );
}

export function FormationClient() {
  const [data, setData] = useState<FormationPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/portal/formation');
        const json = (await res.json()) as {
          success?: boolean;
          data?: FormationPayload;
          error?: { message?: string };
        };
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error?.message ?? 'Impossible de charger la formation.');
        }
        if (!cancelled) setData(json.data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur inattendue');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const includes = useMemo(() => {
    if (!data?.sheet) return [];
    const strip = data.sheet.programStrip;
    return [
      { icon: Clock, label: `${strip.volume} de formation` },
      { icon: BookOpen, label: `${strip.uvCount} unités de valeur (UV)` },
      { icon: MonitorPlay, label: 'Vidéos et supports en ligne' },
      { icon: CheckCircle2, label: 'Quiz de validation par UV' },
      { icon: Award, label: 'Parcours certifiant Qualiopi' },
      { icon: Smartphone, label: 'Accessible sur mobile' },
    ];
  }, [data?.sheet]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Chargement de votre formation…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error ?? 'Formation indisponible.'}
      </div>
    );
  }

  if (!data.hasFormation || !data.formation || !data.sheet) {
    return (
      <div className="container-fluid mx-auto max-w-3xl px-4 py-16 text-center">
        <GraduationCap className="mx-auto size-12 text-muted-foreground/40" />
        <h1 className="mt-4 text-xl font-semibold">Aucune formation associée</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre dossier candidat n&apos;est pas encore lié à une formation.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/mon-dossier">Retour au dossier</Link>
        </Button>
      </div>
    );
  }

  const { formation, sheet, metrics, lms, instructor, catalogDisplay } = data;
  const price = formatPrice(metrics);
  const isCnapsFormation =
    formation.slug === 'tfp-aps' ||
    formation.tag?.toUpperCase().includes('CNAPS') ||
    formation.name.toUpperCase().includes('APS');

  return (
    <div className="pb-24 lg:pb-8">
      <PortalPageShell width="full" className="space-y-5 lg:space-y-6">
        {/* En-tête */}
        <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <div className="grid lg:grid-cols-[1fr_340px]">
            <div className="space-y-4 p-5 sm:p-6">
              <nav className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <Link href="/mon-dossier" className="hover:text-primary hover:underline">
                  Mon dossier
                </Link>
                <span>/</span>
                <span className="text-foreground">Ma formation</span>
              </nav>

              <div className="flex flex-wrap items-center gap-2">
                {formation.tag ? (
                  <Badge variant="secondary" size="sm" className="text-[10px]">
                    {formation.tag}
                  </Badge>
                ) : null}
                {isCnapsFormation ? (
                  <Badge variant="outline" size="sm" className="text-[10px]">
                    CNAPS
                  </Badge>
                ) : null}
                {formation.qualiopiCertified ? (
                  <Badge variant="primary" appearance="light" size="sm" className="text-[10px]">
                    <ShieldCheck className="mr-1 size-3" />
                    Qualiopi
                  </Badge>
                ) : null}
                {formation.cpfEligible ? (
                  <Badge variant="success" appearance="light" size="sm" className="text-[10px]">
                    CPF
                  </Badge>
                ) : null}
              </div>

              <h1 className={portalPageTitle}>{formation.name}</h1>

              {sheet.presentation.body ? (
                <p className={cn('max-w-2xl', portalMuted)}>
                  {sheet.presentation.body.split('\n')[0]}
                </p>
              ) : null}

              {catalogDisplay ? (
                <FormationCatalogMetaBar
                  meta={catalogDisplay}
                  successRateDisplay={metrics?.successRateDisplay}
                  traineeCapacityDisplay={metrics?.traineeCapacityDisplay}
                />
              ) : (
                <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', portalMuted)}>
                  {metrics?.successRateDisplay ? (
                    <span>{metrics.successRateDisplay} de réussite</span>
                  ) : null}
                  {metrics?.traineeCapacityDisplay ? (
                    <span>{metrics.traineeCapacityDisplay} / session</span>
                  ) : null}
                  {instructor ? (
                    <span>
                      Formateur :{' '}
                      <span className="font-medium text-foreground">{instructor.displayName}</span>
                    </span>
                  ) : formation.providerName ? (
                    <span>
                      Référent :{' '}
                      <span className="font-medium text-foreground">{formation.providerName}</span>
                    </span>
                  ) : null}
                </div>
              )}

              {lms && lms.progressPercent > 0 ? (
                <div className="max-w-sm pt-1">
                  <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>Progression e-learning</span>
                    <span>{lms.progressPercent} %</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${lms.progressPercent}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t bg-muted/15 lg:border-l lg:border-t-0">
              <div className="relative aspect-[16/10] bg-gradient-to-br from-primary/15 to-muted lg:aspect-auto lg:min-h-[220px]">
                {lms?.imageUrl || formation.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lms?.imageUrl ?? formation.logoUrl ?? ''}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <BookOpen className="size-12 text-primary/30" />
                  </div>
                )}
              </div>
              <div className="space-y-3 border-t p-4 sm:p-5">
                {price ? (
                  <p className="text-xl font-bold tracking-tight">{price}</p>
                ) : (
                  <p className="text-[13px] text-muted-foreground">
                    Tarif selon dossier ·{' '}
                    <Link href="/mon-dossier" className="text-primary underline-offset-2 hover:underline">
                      financement
                    </Link>
                  </p>
                )}
                <StartButton lms={lms} size="md" className="rounded-lg" />
                {lms?.canStart ? (
                  <p className="text-center text-[11px] text-muted-foreground">
                    {lms.label}
                    {lms.completedChapterCount > 0
                      ? ` · ${lms.completedChapterCount}/${lms.chapterCount} UV`
                      : ''}
                  </p>
                ) : (
                  <p className="text-center text-[11px] text-amber-700 dark:text-amber-300">
                    Dossier requis ·{' '}
                    <Link href="/mon-dossier" className="font-medium underline">
                      Mon dossier
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <PortalStatGrid
          columns={4}
          items={[
            {
              label: 'Volume',
              value: sheet.programStrip.volume,
              hint: sheet.programStrip.theory,
              icon: Clock,
              tone: 'default',
            },
            {
              label: 'Unités de valeur',
              value: sheet.programStrip.uvCount,
              hint: 'Modules certifiants',
              icon: BookOpen,
              tone: 'primary',
            },
            {
              label: 'Pratique',
              value: sheet.programStrip.practice,
              hint: 'Mise en situation',
              icon: MonitorPlay,
              tone: 'default',
            },
            {
              label: 'Progression LMS',
              value: lms ? `${lms.progressPercent} %` : '—',
              hint: lms ? `${lms.completedChapterCount}/${lms.chapterCount} UV` : 'Non démarré',
              icon: PlayCircle,
              tone: lms?.canStart ? 'success' : 'warning',
              href: lms?.canStart ? '/e-formation' : undefined,
              progress: lms?.progressPercent,
            },
          ]}
        />
      </PortalPageShell>

      <PortalPageShell width="full">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
          <div className="min-w-0">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-5 h-auto w-full justify-start gap-0.5 overflow-x-auto rounded-lg border bg-muted/30 p-0.5">
                {[
                  { value: 'overview', label: 'Aperçu' },
                  { value: 'curriculum', label: 'Programme' },
                  { value: 'instructor', label: 'Formateur' },
                  { value: 'requirements', label: 'Prérequis' },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-md px-3.5 py-2 text-[13px] data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="mt-0 space-y-6">
                <section className="rounded-xl border bg-card p-5">
                  <h2 className={portalSectionTitle}>Description</h2>
                  <div className={cn('mt-3 space-y-3', portalMuted)}>
                    {sheet.presentation.body ? (
                      <p className="whitespace-pre-line">{sheet.presentation.body}</p>
                    ) : (
                      <p>Description détaillée de votre parcours de formation professionnelle.</p>
                    )}
                    {sheet.presentation.bullets.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </section>

                {sheet.presentation.bullets.length > 0 ? (
                  <section className="rounded-xl border bg-card p-5">
                    <h2 className={portalSectionTitle}>Ce que vous allez apprendre</h2>
                    <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                      {sheet.presentation.bullets.slice(0, 8).map((item, i) => (
                        <li key={i} className="flex gap-2 text-[13px]">
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <section className="rounded-xl border bg-card p-5">
                  <h2 className={portalSectionTitle}>Public visé</h2>
                  <p className={cn('mt-3', portalMuted)}>{sheet.loyalty.audience}</p>
                </section>
              </TabsContent>

              <TabsContent value="curriculum" className="mt-0 space-y-4">
                <div className="rounded-xl border bg-card p-5">
                  <h2 className={portalSectionTitle}>Programme de formation</h2>
                  <p className={cn('mt-1', portalMuted)}>
                    {sheet.programStrip.uvCount} UV · {sheet.programStrip.volume}
                  </p>
                </div>
                <Statistics2
                  uvCount={sheet.programStrip.uvCount}
                  unitsLegend="Nombre d'UV"
                  volumeLabel={sheet.programStrip.volume}
                  theoryLabel={sheet.programStrip.theory}
                  practiceLabel={sheet.programStrip.practice}
                />
                <div className="rounded-xl border bg-card p-1">
                  <DetailsOrdersTable programModules={sheet.programModules} />
                </div>
              </TabsContent>

              <TabsContent value="instructor" className="mt-0 space-y-4">
                <div className="rounded-xl border bg-card p-5">
                  <h2 className={portalSectionTitle}>Formateur référent</h2>
                  <p className={cn('mt-1', portalMuted)}>
                    Photo, parcours et domaines d&apos;expertise.
                  </p>
                </div>

                {instructor ? (
                  <FormationInstructorProfile
                    instructor={instructor}
                    organizationName={formation.providerName}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
                    <GraduationCap className="mx-auto size-10 text-muted-foreground/40" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      Formateur à confirmer
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Le formateur référent de votre session sera affiché dès son assignation dans
                      le CRM.
                    </p>
                    {formation.providerName ? (
                      <p className="mt-4 text-sm text-muted-foreground">
                        Centre :{' '}
                        <span className="font-medium text-foreground">{formation.providerName}</span>
                        {formation.providerEmail ? ` · ${formation.providerEmail}` : ''}
                      </p>
                    ) : null}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="requirements" className="mt-0 space-y-4">
                <div className="rounded-xl border bg-card p-5">
                  <h2 className={portalSectionTitle}>Prérequis & admission</h2>
                  <p className={cn('mt-1', portalMuted)}>
                    Conditions d&apos;accès et pièces attendues.
                  </p>
                </div>
                {sheet.prerequisiteRows.length > 0 ? (
                  <SheetPrerequisitesTable
                    rows={sheet.prerequisiteRows}
                    headers={{ item: 'Critère', detail: 'Détail', importance: 'Importance' }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Âge : {sheet.prereqStrip.age} · Français : {sheet.prereqStrip.french} ·{' '}
                    {sheet.prereqStrip.auth}
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar sticky — inclus */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-xl border bg-card p-4 shadow-xs">
                <p className="text-[13px] font-medium">Cette formation inclut</p>
                <div className="mt-3 space-y-2">
                  {includes.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                      <Icon className="size-3.5 shrink-0 text-foreground" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3">
                  {formation.deliveryMode ? (
                    <Badge variant="secondary" appearance="light" size="sm" className="text-[10px]">
                      {formation.deliveryMode}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </PortalPageShell>

      {/* Barre mobile flottante */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          {price ? (
            <p className="shrink-0 text-lg font-bold">{price}</p>
          ) : (
            <p className="shrink-0 text-xs text-muted-foreground">E-formation</p>
          )}
          <StartButton lms={lms} size="md" className="flex-1" />
        </div>
      </div>
    </div>
  );
}
