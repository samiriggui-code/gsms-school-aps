'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  ExternalLink,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type { CmsCatalogFormationRow } from '@/lib/cms-catalog-serialize';
import { CMS_CATALOG_TRACK_ORDER } from '@/lib/cms-catalog-serialize';
import {
  FORMATION_TRACK_LABELS,
  type FormationVitrineTrack,
} from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';
import { Button } from '@/components/ui/button';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const cmsCatalogQueryKey = ['cms-catalog-vitrine'] as const;

type CatalogTrackTab = 'all' | FormationVitrineTrack;

type CatalogPublicationState = 'landing' | 'catalog-only' | 'inactive';

type CatalogResponse = {
  stats: {
    total: number;
    landingVisible: number;
    active: number;
    draft: number;
    archived: number;
  };
  items: CmsCatalogFormationRow[];
};

async function fetchCatalog(search: string): Promise<CatalogResponse> {
  const sp = new URLSearchParams({ scope: 'all' });
  if (search.trim()) sp.set('q', search.trim());
  const res = await apiFetch(`/api/sections/communication-contenu/cms/contenus?${sp}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as { error?: { message?: string } }).error?.message ?? 'Chargement impossible',
    );
  }
  return (
    unwrapSectionApiData<CatalogResponse>(json) ?? {
      stats: { total: 0, landingVisible: 0, active: 0, draft: 0, archived: 0 },
      items: [],
    }
  );
}

type LandingCatalogListProps = {
  search: string;
};

export function LandingCatalogList({ search }: LandingCatalogListProps) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<CatalogTrackTab>('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...cmsCatalogQueryKey, search] as const,
    queryFn: () => fetchCatalog(search),
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(
        '/api/sections/communication-contenu/cms/contenus/sync-from-crm',
        { method: 'POST' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (json as { error?: { message?: string } }).error?.message ?? 'Synchronisation impossible',
        );
      }
      return unwrapSectionApiData<{ published: number }>(json) ?? { published: 0 };
    },
    onSuccess: (result) => {
      toast.success(
        result.published > 0
          ? `${result.published} formation(s) synchronisée(s) sur le landing (#pricing)`
          : 'Cache landing actualisé (aucune formation active à publier)',
      );
      void qc.invalidateQueries({ queryKey: cmsCatalogQueryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async (input: { formationId: string; active: boolean; name: string }) => {
      const res = await apiFetch(
        `/api/sections/communication-contenu/cms/contenus/${encodeURIComponent(input.formationId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: input.active }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (json as { error?: { message?: string } }).error?.message ?? 'Mise à jour impossible',
        );
      }
      return unwrapSectionApiData<{ item: CmsCatalogFormationRow; active: boolean }>(json);
    },
    onSuccess: (result, variables) => {
      const published = result?.active ?? variables.active;
      toast.success(
        published
          ? `« ${variables.name} » publiée sur le CRM et le landing`
          : `« ${variables.name} » retirée du catalogue et du landing`,
      );
      void qc.invalidateQueries({ queryKey: cmsCatalogQueryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];

  const countByTrack = (track: FormationVitrineTrack) =>
    items.filter((i) => i.track === track).length;

  const visibleItems =
    activeTab === 'all' ? items : items.filter((i) => i.track === activeTab);

  const activeTabLabel =
    activeTab === 'all'
      ? 'Toutes les spécialités'
      : (FORMATION_TRACK_LABELS[activeTab] ?? activeTab);

  const landingVisibleInTab = visibleItems.filter((i) => i.landingVisible).length;

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2 mb-4">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={syncMutation.isPending}
          onClick={() => syncMutation.mutate()}
        >
          {syncMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Synchroniser le catalogue landing
        </Button>
        <Button type="button" className="gap-2" asChild>
          <Link href="/gestion-academique/vie-scolaire/formations">
            <Plus className="size-4" />
            Gérer dans Formations
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Impossible de charger le catalogue vitrine.{' '}
            <button type="button" className="text-primary underline" onClick={() => void refetch()}>
              Réessayer
            </button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground space-y-3">
            <p>
              Aucune offre catalogue. Créez ou activez des formations dans{' '}
              <span className="font-medium text-foreground">Vie scolaire → Formations</span>, puis
              republiez sur le landing.
            </p>
            <Button type="button" variant="outline" className="gap-2" asChild>
              <Link href="/gestion-academique/vie-scolaire/formations">
                <GraduationCap className="size-4" />
                Ouvrir le module Formations
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div
            role="tablist"
            aria-label="Spécialités du catalogue vitrine"
            className="flex h-auto min-h-10 w-full min-w-0 flex-wrap justify-start gap-1 rounded-lg border border-border bg-accent p-1"
          >
            <Button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              size="sm"
              variant={activeTab === 'all' ? 'secondary' : 'ghost'}
              className="gap-1.5 text-xs sm:text-sm"
              onClick={() => setActiveTab('all')}
            >
              Toutes
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                {items.length}
              </Badge>
            </Button>
            {CMS_CATALOG_TRACK_ORDER.map((track) => {
              const count = countByTrack(track);
              return (
                <Button
                  key={track}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === track}
                  size="sm"
                  variant={activeTab === track ? 'secondary' : 'ghost'}
                  className="gap-1.5 text-xs sm:text-sm"
                  onClick={() => setActiveTab(track)}
                >
                  {FORMATION_TRACK_LABELS[track]}
                  <Badge
                    variant={count > 0 ? 'outline' : 'secondary'}
                    className="h-5 px-1.5 text-[10px] font-normal"
                  >
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex flex-wrap items-center gap-2">
                {activeTabLabel}
                <Badge variant="secondary" className="font-normal">
                  {visibleItems.length}
                </Badge>
                <span className="text-xs font-normal text-muted-foreground">
                  {landingVisibleInTab} visible(s) sur le landing
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {visibleItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Aucune formation pour ce volet.
                </p>
              ) : (
                visibleItems.map((row) => (
                  <CatalogFormationRow
                    key={row.id}
                    row={row}
                    toggling={
                      toggleMutation.isPending &&
                      toggleMutation.variables?.formationId === row.formationId
                    }
                    onToggle={(active) =>
                      toggleMutation.mutate({
                        formationId: row.formationId,
                        active,
                        name: row.name,
                      })
                    }
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function resolvePublicationState(row: CmsCatalogFormationRow): CatalogPublicationState {
  if (row.landingVisible) return 'landing';
  if (row.catalogStatus === 'ACTIVE') return 'catalog-only';
  return 'inactive';
}

const PUBLICATION_BADGE: Record<
  CatalogPublicationState,
  { label: string; variant: 'success' | 'warning' | 'secondary'; hint: string }
> = {
  landing: {
    label: 'ACTIF · LANDING',
    variant: 'success',
    hint: 'Cliquer pour retirer du CRM et du landing',
  },
  'catalog-only': {
    label: 'ACTIF · HORS LANDING',
    variant: 'warning',
    hint: 'Catalogue actif mais fiche formation inactive — cliquer pour publier sur le landing',
  },
  inactive: {
    label: 'INACTIF',
    variant: 'secondary',
    hint: 'Cliquer pour activer dans le CRM et sur le landing',
  },
};

function CatalogFormationRow({
  row,
  toggling,
  onToggle,
}: {
  row: CmsCatalogFormationRow;
  toggling: boolean;
  onToggle: (active: boolean) => void;
}) {
  const publication = resolvePublicationState(row);
  const badge = PUBLICATION_BADGE[publication];
  const isActive = publication !== 'inactive';

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{row.name}</p>
          {row.featured ? (
            <Badge variant="outline" className="text-xs">
              À la une
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {row.tag} · {row.duration}
          {row.parcoursLabel && row.parcoursLabel !== row.trackLabel
            ? ` · ${row.parcoursLabel}`
            : ''}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
          <span className="inline-flex items-center gap-1">
            <Wallet className="size-3.5 shrink-0" />
            {row.priceLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5 shrink-0" />
            {row.nextSessionLabel ?? 'Prochaine session non renseignée'}
            {row.sessionsCount > 0 ? ` (${row.sessionsCount} session${row.sessionsCount > 1 ? 's' : ''})` : ''}
          </span>
          <span className="inline-flex items-center gap-1 max-w-full">
            <span className="font-medium text-foreground/80">Financement :</span>
            <span className="truncate">{row.fundingSummary}</span>
          </span>
        </div>
        <p className="text-xs font-mono text-muted-foreground">{row.slug}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          title={badge.hint}
          disabled={toggling}
          onClick={() => onToggle(!isActive)}
          className={cn(
            badgeVariants({ variant: badge.variant, size: 'sm' }),
            'cursor-pointer select-none transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60',
          )}
        >
          {toggling ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              Mise à jour…
            </>
          ) : (
            badge.label
          )}
        </button>
        {row.catalogStatus === 'DRAFT' ? (
          <Badge variant="secondary" appearance="light">
            BROUILLON
          </Badge>
        ) : null}
      </div>

      <Button size="sm" variant="outline" className="gap-1 shrink-0" asChild>
        <Link href={row.editPath}>
          <Pencil className="size-3.5" />
          Éditer
          <ExternalLink className="size-3" />
        </Link>
      </Button>
    </div>
  );
}

type LandingCatalogToolbarProps = {
  onSearch: (q: string) => void;
};

export function LandingCatalogSearch({ onSearch }: LandingCatalogToolbarProps) {
  const [q, setQ] = useState('');

  return (
    <div className="flex max-w-md gap-2 ms-auto">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSearch(q);
        }}
        placeholder="Rechercher une formation…"
        className="flex-1"
      />
      <Button variant="secondary" type="button" onClick={() => onSearch(q)}>
        <Search className="size-4" />
      </Button>
    </div>
  );
}
