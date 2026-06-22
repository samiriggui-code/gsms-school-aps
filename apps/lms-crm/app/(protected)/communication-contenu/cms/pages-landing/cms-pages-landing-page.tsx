'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  DEFAULT_LANDING_SECTIONS,
  LANDING_SECTION_CATALOG,
  type LandingSectionConfig,
} from '@repo/database/browser';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MODULE_LANDING_STATS_GRID_ROW, SECTION_KPI_CARD_ACCENTS } from '@/components/common/stat-card-metric-layout';
import { cn } from '@/lib/utils';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type LandingConfigData = {
  id: string;
  enabled: boolean;
  sections: LandingSectionConfig[];
  sectionCount: number;
  updatedAt: string;
};

type SectionEditGuide = {
  type: string;
  anchor?: string;
  editPath?: string;
  editLabel?: string;
  hint: string;
};

const I18N_SECTION_HINT =
  'Texte intégré au site (i18n) — non éditable depuis le CRM pour l’instant.';

const SECTION_EDIT_GUIDE: SectionEditGuide[] = [
  {
    type: 'hero',
    editPath: '/gestion-ressources/compagnie/profil',
    editLabel: 'Profil compagnie',
    hint: 'Logo, nom de l’école et identité visuelle.',
  },
  {
    type: 'trusted-brands',
    anchor: '#trusted-brands',
    hint: I18N_SECTION_HINT,
  },
  {
    type: 'how-it-works',
    anchor: '#how-it-works',
    hint: I18N_SECTION_HINT,
  },
  {
    type: 'features',
    anchor: '#features',
    hint: I18N_SECTION_HINT,
  },
  {
    type: 'trainers',
    anchor: '#trainers',
    editPath: '/communication-contenu/cms/equipe-landing',
    editLabel: 'Équipe landing',
    hint: 'Formateurs, équipe pédagogique et RH publiés sur le site.',
  },
  {
    type: 'testimonials',
    anchor: '#testimonials',
    hint: I18N_SECTION_HINT,
  },
  {
    type: 'catalogue',
    anchor: '#pricing',
    editPath: '/gestion-academique/vie-scolaire/formations',
    editLabel: 'Catalogue formations',
    hint: 'Offres, tarifs, sessions et fiches formation.',
  },
  {
    type: 'faq',
    anchor: '#faq',
    hint: I18N_SECTION_HINT,
  },
  {
    type: 'call-to-action',
    anchor: '#call-to-action',
    hint: I18N_SECTION_HINT,
  },
  {
    type: 'contact',
    anchor: '#contact',
    editPath: '/gestion-ressources/compagnie/profil',
    editLabel: 'Profil compagnie',
    hint: 'Coordonnées, adresse et formulaire contact.',
  },
];

function guideFor(type: string): SectionEditGuide | undefined {
  return SECTION_EDIT_GUIDE.find((g) => g.type === type);
}

export default function CmsPagesLandingPage() {
  const { title, description } = usePageToolbarMeta('/communication-contenu/cms/pages-landing');
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['landing-config'] as const,
    queryFn: async (): Promise<LandingConfigData | undefined> => {
      const res = await apiFetch('/api/sections/communication-contenu/cms/landing-config');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Erreur');
      return unwrapSectionApiData<LandingConfigData>(json);
    },
  });

  const enabled = data?.enabled ?? true;
  const sections = DEFAULT_LANDING_SECTIONS;
  const landingUrl =
    (process.env.NEXT_PUBLIC_LANDING_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

  async function saveEnabled(next: boolean) {
    const res = await apiFetch('/api/sections/communication-contenu/cms/landing-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: next }),
    });
    if (!res.ok) {
      toast.error('Publication impossible');
      return;
    }
    toast.success(next ? 'Landing publiée' : 'Landing en maintenance');
    qc.invalidateQueries({ queryKey: ['landing-config'] });
  }

  const stats = [
    { label: 'Sections', value: sections.length, subtitle: 'Toujours visibles sur le site' },
    { label: 'Publication', value: enabled ? 'Active' : 'Maintenance', subtitle: 'Site public' },
    {
      label: 'Dernière MAJ',
      value: data?.updatedAt ? new Date(data.updatedAt).toLocaleDateString('fr-FR') : '—',
      subtitle: 'LandingConfig',
    },
    { label: 'SEO', value: 'Meta', subtitle: 'Titres & indexation' },
    { label: 'Site vitrine', value: 1, subtitle: 'Page unique /' },
  ];

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" asChild>
              <a href={landingUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Aperçu site
              </a>
            </Button>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              Actualiser
            </Button>
            <Button variant="outline" asChild>
              <Link href="/communication-contenu/seo/meta-indexation">
                SEO & meta
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <div className={MODULE_LANDING_STATS_GRID_ROW}>
          {stats.map((s, i) => {
            const accent = SECTION_KPI_CARD_ACCENTS[i % SECTION_KPI_CARD_ACCENTS.length];
            return (
              <div
                key={s.label}
                className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
              >
                <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.subtitle}</p>
              </div>
            );
          })}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Publication du site</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Désactive la landing publique et affiche la page maintenance. Seul interrupteur global du site
                (Formations et Équipe landing n’agissent que sur leur contenu).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={enabled} disabled={isLoading} onCheckedChange={saveEnabled} id="landing-enabled" />
              <Label htmlFor="landing-enabled">{enabled ? 'En ligne' : 'Maintenance'}</Label>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contenu des sections landing</CardTitle>
            <p className="text-sm text-muted-foreground">
              Les blocs de la page d’accueil sont toujours affichés. Modifiez le contenu métier depuis les modules
              CRM ci-dessous (logo, formateurs, formations, textes…).
            </p>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Chargement…</p>
            ) : (
              sections.map((section, index) => {
                const catalogLabel =
                  LANDING_SECTION_CATALOG.find((c) => c.type === section.type)?.label ?? section.type;
                const guide = guideFor(section.type);
                const previewHref = guide?.anchor ? `${landingUrl}${guide.anchor}` : landingUrl;

                return (
                  <div
                    key={section.type}
                    className="flex flex-col gap-3 rounded-lg border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{index + 1}.</span>
                        <span className="font-medium">{catalogLabel}</span>
                      </div>
                      {guide ? (
                        <p className="text-sm text-muted-foreground">{guide.hint}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={previewHref} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-3.5" />
                          Voir sur le site
                        </a>
                      </Button>
                      {guide?.editPath ? (
                        <Button size="sm" asChild>
                          <Link href={guide.editPath}>
                            {guide.editLabel}
                            <ChevronRight className="size-3.5" />
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
