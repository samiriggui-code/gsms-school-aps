'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Search } from 'lucide-react';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MODULE_LANDING_STATS_GRID_ROW, SECTION_KPI_CARD_ACCENTS } from '@/components/common/stat-card-metric-layout';
import { cn } from '@/lib/utils';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type ContenuRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  catalogStatus: string | null;
  updatedAt: string;
  editPath: string;
};

type ContenusResponse = {
  stats: { total: number; active: number; catalogActive: number; draft: number };
  items: ContenuRow[];
  pagination: { page: number; limit: number; total: number };
};

export default function CmsContenusPage() {
  const { t } = useTranslation();
  const { title, description } = usePageToolbarMeta('/communication-contenu/cms/contenus');
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cms-contenus', page, search] as const,
    queryFn: async (): Promise<ContenusResponse | undefined> => {
      const sp = new URLSearchParams({ page: String(page), limit: '20' });
      if (search.trim()) sp.set('q', search.trim());
      const res = await apiFetch(`/api/sections/communication-contenu/cms/contenus?${sp}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Erreur');
      return unwrapSectionApiData<ContenusResponse>(json);
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.pagination.total ?? 0) / 20));

  const stats = [
    { label: 'Formations', value: data?.stats.total ?? 0, subtitle: 'Fiches catalogue' },
    { label: 'Actives', value: data?.stats.active ?? 0, subtitle: 'Publiables' },
    { label: 'Landing', value: data?.stats.catalogActive ?? 0, subtitle: 'Visibles vitrine' },
    { label: 'Brouillons', value: data?.stats.draft ?? 0, subtitle: 'Hors ligne' },
    { label: 'Couverture', value: data?.stats.total ?? 0, subtitle: 'Fiches suivies' },
  ];

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
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
          <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Actualiser
            </Button>
            <div className="flex max-w-md flex-1 gap-2 sm:ms-auto">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('datagrid.search.generic')} className="flex-1" />
              <Button variant="secondary" onClick={() => { setSearch(q); setPage(1); }}>
                <Search className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Formation</th>
                    <th className="px-4 py-3 text-left font-medium">Slug</th>
                    <th className="px-4 py-3 text-left font-medium">Statut</th>
                    <th className="px-4 py-3 text-left font-medium">Catalogue</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Chargement…</td></tr>
                  ) : (data?.items.length ?? 0) === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Aucune fiche</td></tr>
                  ) : (
                    data!.items.map((row) => (
                      <tr key={row.id} className="border-b hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3 font-mono text-xs">{row.slug}</td>
                        <td className="px-4 py-3"><Badge variant="secondary">{row.status}</Badge></td>
                        <td className="px-4 py-3">{row.catalogStatus ?? '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={row.editPath}>
                              Éditer
                              <ExternalLink className="ms-1 size-3" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {(data?.pagination.total ?? 0) > 20 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <span className="text-xs text-muted-foreground">Page {page} / {totalPages}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Préc.</Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Suiv.</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
