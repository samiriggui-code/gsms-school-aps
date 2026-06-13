'use client';



import { useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import {

  Activity,

  ArrowRight,

  BookOpen,

  CalendarDays,

  CheckCircle2,

  Circle,

  FileText,

  GraduationCap,

  Loader2,

  Shield,

  Users,

} from 'lucide-react';

import { apiFetch } from '@/lib/api';

import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';

import { PortalPageHero } from '@/components/portal/layout/portal-page-hero';

import { PortalPageShell } from '@/components/portal/layout/portal-page-shell';

import { PortalStatGrid } from '@/components/portal/layout/portal-stat-grid';

import { PortalField, PortalFieldGrid, PortalSection } from '@/components/portal/layout/portal-section';

import { portalMuted } from '@/components/portal/layout/portal-ui';

import { CnapsDossierSheet } from '@/components/portal/cnaps-dossier-sheet';

import { PortalProfileCard } from '@/components/portal/portal-profile-card';

import { PortalFundingSection } from '@/components/portal/portal-funding-section';

import { RecentActivityFeed } from '@/components/portal/dossier/recent-activity-feed';

import type { FormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';

import type { FormationOverviewMetrics } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/components/statistics1';

import { formatPortalDate } from '@/lib/portal/format-portal-date';



type DossierPayload = {

  user: {

    name: string | null;

    firstName: string | null;

    lastName: string | null;

    email: string;

    phone: string | null;

    avatar: string | null;

    address: string | null;

    city: string | null;

    postalCode: string | null;

    birthDate: string | null;

    roleName: string;

    accountCreatedAt: string;

  };

  candidature: {

    statusLabel: string;

    sourceLabel: string;

    formationName: string | null;

    formationSlug: string | null;

    formationTag: string | null;

    formationDuration: string | null;

    interestedSession: {

      label: string;

      location: string;

      subtitle: string | null;

      startDate: string | null;

      endDate: string | null;

      registrationClosesAt: string | null;

    } | null;

    fundingMode: string | null;

    inscriptionAt: string;

    dossierSubmittedAt: string | null;

    cnapsSubmittedAt: string | null;

    cnapsReference: string | null;

    cnapsPrefavorable: boolean | null;

    validatedAt: string | null;

    completedAt: string | null;

    isDossierSent: boolean;

  } | null;

  formationSheet: FormationSheetViewModel | null;

  formationOverviewMetrics: FormationOverviewMetrics | null;

  devis: Array<{

    referenceCode: string;

    title: string;

    statusLabel: string;

    totalTtc: number;

    currency: string;

    fundingHint: string | null;

  }>;

  documents: { total: number; cnapsUploaded: number; cnapsVerified: number; cnapsTotal: number };

  parcours: {

    steps: Array<{ key: string; label: string; state: 'done' | 'current' | 'upcoming' }>;

  };

  sessions: Array<{

    formationName: string;

    sessionLabel: string;

    location: string;

    subtitle: string | null;

    enrolledAt: string;

    enrollmentStatusLabel: string;

    examOutcomeLabel: string;

  }>;

  lms: { tier: string; label: string; canStart?: boolean };

  recentActivity?: Array<{

    id: string;

    kind: 'admin' | 'learning' | 'announcement';

    action: string;

    target: string;

    detail?: string;

    at: string;

    href?: string;

  }>;

};



function displayUserName(user: DossierPayload['user']) {

  return (

    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||

    user.name ||

    user.email

  );

}



export function MonDossierClient({ initialCnapsOpen = false }: { initialCnapsOpen?: boolean }) {

  const [data, setData] = useState<DossierPayload | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [cnapsOpen, setCnapsOpen] = useState(initialCnapsOpen);



  const loadDossier = useCallback(async () => {

    try {

      const res = await apiFetch('/api/portal/dossier');

      const json = (await res.json()) as {

        success?: boolean;

        data?: DossierPayload;

        error?: { message?: string };

      };

      if (!res.ok || !json.success || !json.data) {

        throw new Error(json.error?.message ?? 'Impossible de charger le dossier.');

      }

      setData(json.data);

      setError(null);

    } catch (e) {

      setError(e instanceof Error ? e.message : 'Erreur inattendue');

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    void loadDossier();

  }, [loadDossier]);



  const stats = useMemo(() => {

    if (!data) return [];

    const { candidature, user, documents, lms } = data;

    const cnapsComplete =

      documents.cnapsTotal > 0 && documents.cnapsVerified >= documents.cnapsTotal;

    return [

      {

        label: 'Inscription',

        value: formatPortalDate(candidature?.inscriptionAt ?? user.accountCreatedAt),

        hint: candidature?.sourceLabel ?? 'Compte candidat',

        icon: CalendarDays,

        tone: 'default' as const,

      },

      {

        label: 'Dossier CNAPS',

        value: `${documents.cnapsVerified}/${documents.cnapsTotal}`,

        hint: cnapsComplete ? 'Pièces validées' : 'Pièces en cours',

        icon: Shield,

        tone: cnapsComplete ? ('success' as const) : ('warning' as const),

      },

      {

        label: 'Statut dossier',

        value: candidature?.statusLabel ?? '—',

        hint: candidature?.formationName ?? 'Formation visée',

        icon: FileText,

        tone: 'primary' as const,

      },

      {

        label: 'E-learning',

        value: lms.label,

        hint: lms.tier !== 'none' ? 'Accès en ligne' : 'Dossier requis',

        icon: BookOpen,

        tone: lms.tier !== 'none' ? ('success' as const) : ('default' as const),

        href: lms.tier !== 'none' ? '/e-formation' : undefined,

      },

    ];

  }, [data]);



  if (loading) {

    return (

      <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-muted-foreground">

        <Loader2 className="size-5 animate-spin" />

        Chargement de votre dossier…

      </div>

    );

  }



  if (error || !data) {

    return (

      <PortalPageShell width="narrow">

        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-[13px] text-destructive">

          {error ?? 'Dossier indisponible.'}

        </div>

      </PortalPageShell>

    );

  }



  const {

    candidature,

    parcours,

    sessions,

    lms,

    formationSheet,

    devis,

    documents,

    user,

    recentActivity = [],

  } = data;



  const cnapsComplete =

    documents.cnapsTotal > 0 && documents.cnapsVerified >= documents.cnapsTotal;

  const dossierReference = devis[0]?.referenceCode ?? null;



  return (

    <PortalPageShell width="full" className="space-y-5 lg:space-y-6">

      <PortalPageHero

        badge={candidature?.statusLabel ?? 'Sans dossier actif'}

        title={displayUserName(user)}

        description={

          candidature?.formationName

            ? `${candidature.formationName}${candidature.formationTag ? ` · ${candidature.formationTag}` : ''}${candidature.formationDuration ? ` · ${candidature.formationDuration}` : ''}`

            : 'Suivez votre parcours candidat et vos démarches administratives.'

        }

        actions={

          <>

            {formationSheet ? (

              <Button asChild size="sm" variant="primary">

                <Link href="/formation">

                  <GraduationCap className="mr-1.5 size-3.5" />

                  Ma formation

                </Link>

              </Button>

            ) : null}

            {lms.tier !== 'none' ? (

              <Button asChild size="sm" variant="outline">

                <Link href="/e-formation">

                  <BookOpen className="mr-1.5 size-3.5" />

                  E-formation

                </Link>

              </Button>

            ) : null}

            <Button type="button" variant="outline" size="sm" onClick={() => setCnapsOpen(true)}>

              <Shield className="mr-1.5 size-3.5" />

              Dossier CNAPS

            </Button>

          </>

        }

      />



      <PortalStatGrid items={stats} />



      <PortalProfileCard profile={{ ...user, name: displayUserName(user) }} />



      <div className="grid gap-4 lg:grid-cols-2">

        <PortalSection

          title="Suivi administratif"

          icon={FileText}

          action={

            <Button type="button" variant="ghost" size="sm" className="h-7 text-[12px]" onClick={() => setCnapsOpen(true)}>

              Gérer CNAPS

            </Button>

          }

        >

          <PortalFieldGrid cols={2}>

            {dossierReference ? (

              <PortalField label="Dossier n°" value={<span className="font-mono">{dossierReference}</span>} />

            ) : null}

            {candidature ? (

              <PortalField label="Statut" value={candidature.statusLabel} />

            ) : null}

            {candidature?.cnapsReference ? (

              <PortalField label="Référence CNAPS" value={candidature.cnapsReference} />

            ) : null}

            <PortalField

              label="Pièces CNAPS"

              value={

                <span className="inline-flex flex-wrap items-center gap-2">

                  {documents.cnapsUploaded}/{documents.cnapsTotal} déposées ·{' '}

                  {documents.cnapsVerified}/{documents.cnapsTotal} validées

                  <Badge variant={cnapsComplete ? 'success' : 'warning'} appearance="light" size="sm" className="text-[10px]">

                    {cnapsComplete ? 'Complet' : 'Incomplet'}

                  </Badge>

                </span>

              }

            />

            {candidature?.dossierSubmittedAt ? (

              <PortalField label="Envoi dossier" value={formatPortalDate(candidature.dossierSubmittedAt)} />

            ) : null}

            {candidature?.validatedAt ? (

              <PortalField label="Validation" value={formatPortalDate(candidature.validatedAt)} />

            ) : null}

          </PortalFieldGrid>

        </PortalSection>



        <PortalSection title="Mes sessions" icon={Users}>

          {sessions.length > 0 ? (

            <div className="space-y-2.5">

              {sessions.map((s, i) => (

                <div

                  key={`${s.sessionLabel}-${i}`}

                  className="rounded-lg border border-border/60 bg-muted/20 px-3.5 py-3 text-[13px]"

                >

                  <p className="font-medium">{s.formationName}</p>

                  <p className="text-muted-foreground">{s.sessionLabel}</p>

                  {s.location ? <p className="text-muted-foreground">{s.location}</p> : null}

                  <p className="mt-1.5 text-[11px] text-muted-foreground">

                    Inscrit le {formatPortalDate(s.enrolledAt)} · {s.enrollmentStatusLabel}

                    {s.examOutcomeLabel ? ` · ${s.examOutcomeLabel}` : ''}

                  </p>

                </div>

              ))}

            </div>

          ) : candidature?.interestedSession ? (

            <div className="rounded-lg border border-dashed bg-muted/10 px-3.5 py-3 text-[13px]">

              <p className="font-medium">{candidature.formationName ?? 'Formation'}</p>

              <p className="mt-0.5 text-muted-foreground">{candidature.interestedSession.label}</p>

              {candidature.interestedSession.location ? (

                <p className="text-muted-foreground">{candidature.interestedSession.location}</p>

              ) : null}

              <p className="mt-2 text-[11px] text-muted-foreground">

                Session souhaitée — confirmation après validation du dossier.

              </p>

            </div>

          ) : (

            <p className={portalMuted}>Aucune session associée pour le moment.</p>

          )}

        </PortalSection>

      </div>



      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">

        <PortalSection title="Parcours candidat" icon={Activity}>

          <ol className="space-y-2.5">

            {parcours.steps.map((step) => (

              <li key={step.key} className="flex items-center gap-2.5 text-[13px]">

                {step.state === 'done' ? (

                  <CheckCircle2 className="size-4 shrink-0 text-primary" />

                ) : (

                  <Circle

                    className={cn(

                      'size-4 shrink-0',

                      step.state === 'current' ? 'text-primary' : 'text-muted-foreground/35',

                    )}

                  />

                )}

                <span

                  className={cn(

                    step.state === 'current' && 'font-medium',

                    step.state === 'upcoming' && 'text-muted-foreground',

                  )}

                >

                  {step.label}

                </span>

              </li>

            ))}

          </ol>

        </PortalSection>



        {formationSheet ? (

          <PortalSection title="Accès rapide" variant="muted" contentClassName="space-y-2">

            <Button asChild variant="outline" size="sm" className="w-full justify-start text-[13px]">

              <Link href="/formation">

                <GraduationCap className="mr-2 size-3.5" />

                Fiche formation

              </Link>

            </Button>

            {lms.tier !== 'none' ? (

              <Button asChild variant="outline" size="sm" className="w-full justify-start text-[13px]">

                <Link href="/e-formation">

                  <BookOpen className="mr-2 size-3.5" />

                  E-formation

                </Link>

              </Button>

            ) : null}

          </PortalSection>

        ) : null}

      </div>



      <PortalFundingSection

        fundingMode={candidature?.fundingMode ?? null}

        sourceLabel={candidature?.sourceLabel ?? null}

        sheetModel={formationSheet}

        devis={devis}

      />



      {formationSheet ? (

        <div className="flex flex-col gap-3 rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

          <div className="min-w-0">

            <p className="text-[10px] font-medium uppercase tracking-wide text-primary">Votre parcours</p>

            <p className="mt-0.5 text-[13px] font-semibold">{candidature?.formationName ?? 'Formation visée'}</p>

            <p className={cn('mt-0.5', portalMuted)}>

              Programme, formateur et accès e-learning en ligne.

            </p>

          </div>

          <Button asChild size="sm" className="shrink-0">

            <Link href="/formation">

              Voir ma formation

              <ArrowRight className="ml-1.5 size-3.5" />

            </Link>

          </Button>

        </div>

      ) : null}



      <PortalSection title="Activité récente" icon={Activity} description="Dossier, e-learning et annonces.">

        <RecentActivityFeed items={recentActivity} />

      </PortalSection>



      <CnapsDossierSheet

        open={cnapsOpen}

        onOpenChange={(open) => {

          setCnapsOpen(open);

          if (!open) void loadDossier();

        }}

      />

    </PortalPageShell>

  );

}

