'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ExternalLink, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import {
  DEFAULT_LANDING_SECTIONS,
  LANDING_SECTION_CATALOG,
  landingSectionLabel,
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

export default function CmsPagesLandingPage() {
  const { t } = useTranslation();
  const { title, description } = usePageToolbarMeta('/communication-contenu/cms/pages-landing');
  const qc = useQueryClient();
  const [enabled, setEnabled] = useState(true);
  const [sections, setSections] = useState<LandingSectionConfig[]>(DEFAULT_LANDING_SECTIONS);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['landing-config'] as const,
    queryFn: async (): Promise<LandingConfigData | undefined> => {
      const res = await apiFetch('/api/sections/communication-contenu/cms/landing-config');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Erreur');
      const payload = unwrapSectionApiData<LandingConfigData>(json);
      if (payload) {
        setEnabled(payload.enabled);
        setSections(payload.sections?.length ? payload.sections : DEFAULT_LANDING_SECTIONS);
      }
      return payload;
    },
  });

  useEffect(() => {
    if (data?.sections?.length) setSections(data.sections);
  }, [data]);

  async function saveEnabled(next: boolean) {
    setEnabled(next);
    setSaving(true);
    const res = await apiFetch('/api/sections/communication-contenu/cms/landing-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: next }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error('Publication impossible');
      setEnabled(!next);
      return;
    }
    toast.success(next ? 'Landing publiée' : 'Landing désactivée');
    qc.invalidateQueries({ queryKey: ['landing-config'] });
  }

  async function saveSections() {
    setSaving(true);
    const res = await apiFetch('/api/sections/communication-contenu/cms/landing-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error('Enregistrement impossible');
      return;
    }
    toast.success(t('cms.sectionsSaved'));
    qc.invalidateQueries({ queryKey: ['landing-config'] });
  }

  function moveSection(index: number, dir: -1 | 1) {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
  }

  function removeSection(index: number) {
    setSections(sections.filter((_, i) => i !== index));
  }

  function addSection(type: string) {
    const label = LANDING_SECTION_CATALOG.find((c) => c.type === type)?.label ?? type;
    setSections([...sections, { type, title: label, enabled: true }]);
  }

  function resetDefaults() {
    setSections(DEFAULT_LANDING_SECTIONS);
  }

  const stats = [
    { label: 'Sections', value: sections.length, subtitle: 'Blocs actifs' },
    { label: 'Publication', value: enabled ? 'Active' : 'Off', subtitle: 'Site public' },
    {
      label: 'Dernière MAJ',
      value: data?.updatedAt ? new Date(data.updatedAt).toLocaleDateString('fr-FR') : '—',
      subtitle: 'LandingConfig',
    },
    { label: 'Types de blocs', value: new Set(sections.map((s) => s.type)).size, subtitle: 'Sections distinctes' },
    { label: 'Site vitrine', value: 1, subtitle: 'Page unique' },
  ];

  const usedTypes = new Set(sections.map((s) => s.type));
  const landingUrl =
    (process.env.NEXT_PUBLIC_LANDING_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

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
            <Button onClick={saveSections} disabled={saving || isLoading}>
              <Save className="size-4" />
              Enregistrer sections
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Publication</CardTitle>
            <div className="flex items-center gap-2">
              <Switch checked={enabled} disabled={saving || isLoading} onCheckedChange={saveEnabled} id="landing-enabled" />
              <Label htmlFor="landing-enabled">{enabled ? 'En ligne' : 'Hors ligne'}</Label>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Éditeur de sections</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={resetDefaults}>
                Réinitialiser
              </Button>
              <Select key={sections.length} onValueChange={addSection}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Ajouter une section" />
                </SelectTrigger>
                <SelectContent>
                  {LANDING_SECTION_CATALOG.filter((c) => !usedTypes.has(c.type)).map((c) => (
                    <SelectItem key={c.type} value={c.type}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Chargement…</p>
            ) : sections.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucune section</p>
            ) : (
              sections.map((section, index) => (
                <div
                  key={`${section.type}-${index}`}
                  className="flex flex-col gap-3 rounded-lg border border-border/70 p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="w-8 text-sm text-muted-foreground">{index + 1}.</span>
                    <div className="min-w-[140px] text-sm font-medium">
                      {LANDING_SECTION_CATALOG.find((c) => c.type === section.type)?.label ?? section.type}
                    </div>
                    <Input
                      value={section.title ?? ''}
                      onChange={(e) => {
                        const next = [...sections];
                        next[index] = { ...section, title: e.target.value };
                        setSections(next);
                      }}
                      placeholder={landingSectionLabel(section)}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={section.enabled !== false}
                        onCheckedChange={(v) => {
                          const next = [...sections];
                          next[index] = { ...section, enabled: v };
                          setSections(next);
                        }}
                        id={`section-enabled-${index}`}
                      />
                      <Label htmlFor={`section-enabled-${index}`} className="text-xs">
                        Visible
                      </Label>
                    </div>
                  </div>
                  <div className="flex gap-1 sm:ms-auto">
                    <Button size="icon" variant="ghost" disabled={index === 0} onClick={() => moveSection(index, -1)}>
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={index === sections.length - 1}
                      onClick={() => moveSection(index, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => removeSection(index)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
