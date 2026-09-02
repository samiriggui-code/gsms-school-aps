'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Textarea } from '@repo/ui/textarea';
import { MODULE_LANDING_STATS_GRID_ROW, SECTION_KPI_CARD_ACCENTS } from '@/components/common/stat-card-metric-layout';
import { cn } from '@/lib/utils';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type SeoMetaResponse = {
  meta: {
    name: string;
    companyCity: string;
    siret: string;
    directorFullName: string;
    mainActivityDescription: string;
  };
  landing: { enabled: boolean; updatedAt: string | null };
  siteUrl: string;
  sitemapPath: string;
  robotsPath: string;
};

export default function SeoMetaPage() {
  const { t } = useTranslation();
  const { title, description } = usePageToolbarMeta('/communication-contenu/seo/meta-indexation');
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    companyCity: '',
    siret: '',
    directorFullName: '',
    mainActivityDescription: '',
  });
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['seo-meta'] as const,
    queryFn: async (): Promise<SeoMetaResponse | undefined> => {
      const res = await apiFetch('/api/sections/communication-contenu/seo/meta');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Erreur');
      return unwrapSectionApiData<SeoMetaResponse>(json);
    },
  });

  useEffect(() => {
    if (data?.meta) setForm(data.meta);
  }, [data]);

  async function save() {
    setSaving(true);
    const res = await apiFetch('/api/sections/communication-contenu/seo/meta', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error('Enregistrement impossible');
      return;
    }
    toast.success(t('cms.metaSaved'));
    qc.invalidateQueries({ queryKey: ['seo-meta'] });
  }

  const siteBase = (data?.siteUrl ?? '').replace(/\/$/, '');
  const stats = [
    { label: 'Organisme', value: form.name || '—', subtitle: 'Title / OG' },
    { label: 'Landing', value: data?.landing.enabled ? 'En ligne' : 'Off', subtitle: 'Publication' },
    { label: 'Ville', value: form.companyCity || '—', subtitle: 'Local SEO' },
    { label: 'SIRET', value: form.siret ? 'Renseigné' : '—', subtitle: 'Identité légale' },
    { label: 'Indexation', value: 'Manuelle', subtitle: 'Sitemap / robots' },
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
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              Actualiser
            </Button>
            <Button onClick={save} disabled={saving || isLoading}>
              <Save className="size-4" />
              Enregistrer
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
                <p className="mt-1 text-2xl font-semibold truncate">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.subtitle}</p>
              </div>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meta site public</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 max-w-2xl">
            <div><Label>Nom organisme (title)</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Description activité</Label><Textarea rows={3} value={form.mainActivityDescription} onChange={(e) => setForm({ ...form, mainActivityDescription: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ville</Label><Input value={form.companyCity} onChange={(e) => setForm({ ...form, companyCity: e.target.value })} /></div>
              <div><Label>SIRET</Label><Input value={form.siret} onChange={(e) => setForm({ ...form, siret: e.target.value })} /></div>
            </div>
            <div><Label>Responsable légal</Label><Input value={form.directorFullName} onChange={(e) => setForm({ ...form, directorFullName: e.target.value })} /></div>
          </CardContent>
        </Card>

        {siteBase && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Indexation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Sitemap :</span>
                <a className="text-primary underline" href={`${siteBase}${data?.sitemapPath}`} target="_blank" rel="noreferrer">
                  {siteBase}{data?.sitemapPath}
                  <ExternalLink className="ms-1 inline size-3" />
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Robots :</span>
                <a className="text-primary underline" href={`${siteBase}${data?.robotsPath}`} target="_blank" rel="noreferrer">
                  {siteBase}{data?.robotsPath}
                  <ExternalLink className="ms-1 inline size-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </Container>
    </>
  );
}
