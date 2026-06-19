'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ChevronRight,
  Database,
  Download,
  Eye,
  FileText,
  HardDrive,
  History,
  LoaderCircleIcon,
  Search,
  Upload,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Container } from '@/components/common/container';
import {
  kpiStatsGridClass,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { visibleTreeNodes } from '@/lib/storage-governance-tree';
import { cn } from '@/lib/utils';
import {
  folderCountBadgeClass,
  StorageAllFilesIcon,
  StorageFileIcon,
  StorageFolderIcon,
} from './storage-governance-icons';

type FileItem = {
  id: string;
  originalName: string;
  module: string;
  entityType: string;
  entityId?: string | null;
  entityDisplayName?: string | null;
  category?: string | null;
  storageKey?: string;
  mimeType: string;
  sizeLabel: string;
  status: string;
  legalHold: boolean;
  versionCount: number;
  currentVersion: number;
  previewKind: string;
  updatedAt: string;
};

type TreeNode = {
  prefix: string;
  label: string;
  displayLabel?: string;
  entityId?: string | null;
  entityKind?: string | null;
  fileCount: number;
  isSocle: boolean;
  depth: number;
  parentPrefix: string | null;
  hasChildren: boolean;
};

type DossierUser = {
  id: string;
  name: string;
  email: string;
  userCategory: string;
};

type ListResponse = {
  stats: Record<string, number | string>;
  tree: TreeNode[];
  dossierUsers: DossierUser[];
  activeDossier: DossierUser | null;
  items: FileItem[];
  pagination: { page: number; limit: number; total: number };
};

type DetailResponse = {
  asset: FileItem & {
    storageKey: string;
    archiveReason: string | null;
    retentionUntil: string | null;
  };
  versions: {
    id: string;
    versionNumber: number;
    status: string;
    changeReason: string | null;
    isCurrent: boolean;
    createdAt: string;
  }[];
};

type ExcelPreview = {
  kind: string;
  sheetName: string;
  headers: string[];
  rows: string[][];
};

const ENTITY_KIND_LABELS: Record<string, string> = {
  candidat: 'Candidat',
  collaborateur: 'Collaborateur',
  formateur: 'Formateur',
  utilisateur: 'Utilisateur',
  stagiaire: 'Stagiaire',
  equipe: 'Équipe',
  session: 'Session',
};

function formatStoragePathLabel(
  storageKey: string | undefined,
  entityDisplayName?: string | null,
  entityId?: string | null,
): string {
  if (!storageKey) return '—';
  if (!entityDisplayName || !entityId) return storageKey;
  return storageKey.replace(entityId, entityDisplayName);
}

const DEFAULT_EXPANDED = new Set(['rh', 'academique', 'portail', 'utilisateurs', 'ecole']);

export function FileManager() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [prefix, setPrefix] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(DEFAULT_EXPANDED);
  const [status, setStatus] = useState<'ACTIVE' | 'ARCHIVED' | 'ALL'>('ACTIVE');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [dossierQ, setDossierQ] = useState('');
  const [dossierSearch, setDossierSearch] = useState('');
  const [dossierId, setDossierId] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [isLgLayout, setIsLgLayout] = useState(true);
  const [legalHold, setLegalHold] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionReason, setVersionReason] = useState('');

  useEffect(() => {
    const dossierIdParam = searchParams.get('dossierId');
    const dossierQParam = searchParams.get('dossierQ');
    if (dossierIdParam) setDossierId(dossierIdParam);
    if (dossierQParam) {
      setDossierQ(dossierQParam);
      setDossierSearch(dossierQParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsLgLayout(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: [
      'gouvernance-file-manager',
      page,
      search,
      prefix,
      status,
      dossierSearch,
      dossierId,
    ] as const,
    queryFn: async (): Promise<ListResponse> => {
      const sp = new URLSearchParams({
        page: String(page),
        limit: '20',
        status,
      });
      if (search.trim()) sp.set('q', search.trim());
      if (prefix) sp.set('prefix', prefix);
      if (dossierSearch.trim()) sp.set('dossierQ', dossierSearch.trim());
      if (dossierId) sp.set('dossierId', dossierId);
      const res = await apiFetch(
        `/api/sections/securite-configuration/gouvernance-donnees/storage?${sp}`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(t('governance.fileManager.loadError'));
      return unwrapSectionApiData<ListResponse>(json)!;
    },
  });

  const visibleTree = useMemo(
    () => visibleTreeNodes(data?.tree ?? [], expanded),
    [data?.tree, expanded],
  );

  useEffect(() => {
    const id = dossierId || data?.activeDossier?.id;
    if (!id || !data?.tree?.length) return;

    const paths = data.tree
      .filter((n) => n.entityId === id || n.prefix.includes(id))
      .map((n) => n.prefix);

    const toExpand = paths.flatMap((prefix) => {
      const parts = prefix.split('/').filter(Boolean);
      return parts.map((_, i) => parts.slice(0, i + 1).join('/'));
    });

    if (toExpand.length === 0) return;
    setExpanded((prev) => new Set([...prev, ...toExpand]));
  }, [dossierId, data?.activeDossier?.id, data?.tree]);

  const kpiCards = useMemo(
    () => [
      {
        icon: FileText,
        label: t('governance.fileManager.statActive'),
        value: String(data?.stats.globalActive ?? '—'),
        hint: t('governance.fileManager.statActiveHint'),
      },
      {
        icon: Archive,
        label: t('governance.fileManager.statArchived'),
        value: String(data?.stats.archived ?? '—'),
        hint: t('governance.fileManager.statArchivedHint'),
      },
      {
        icon: HardDrive,
        label: t('governance.fileManager.statVolume'),
        value: `${data?.stats.globalSizeMb ?? 0} Mo`,
        hint: t('governance.fileManager.statVolumeHint'),
      },
      {
        icon: Database,
        label: t('governance.fileManager.statModules'),
        value: String(data?.stats.modules ?? '—'),
        hint: t('governance.fileManager.statModulesHint'),
      },
      {
        icon: UserRound,
        label: t('governance.fileManager.statDossiers'),
        value: String(data?.stats.entityDossiers ?? '—'),
        hint: t('governance.fileManager.statDossiersHint'),
      },
    ],
    [data?.stats, t],
  );

  const { data: detail } = useQuery({
    queryKey: ['gouvernance-file-detail', selectedId] as const,
    queryFn: async (): Promise<DetailResponse> => {
      const res = await apiFetch(
        `/api/sections/securite-configuration/gouvernance-donnees/storage/files/${selectedId}`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(t('governance.fileManager.detailError'));
      return unwrapSectionApiData<DetailResponse>(json)!;
    },
    enabled: !!selectedId,
  });

  const selected = useMemo(
    () => data?.items.find((i) => i.id === selectedId) ?? detail?.asset ?? null,
    [data?.items, selectedId, detail?.asset],
  );

  const previewUrl = selectedId
    ? `/api/sections/securite-configuration/gouvernance-donnees/storage/files/${selectedId}/preview`
    : null;

  const isVisualPreview =
    selected?.previewKind === 'pdf' || selected?.previewKind === 'image';

  const {
    data: previewBlobUrl,
    isError: previewIsError,
    error: previewError,
    isLoading: previewLoading,
  } = useQuery({
    queryKey: ['gouvernance-file-preview', selectedId] as const,
    queryFn: async (): Promise<string> => {
      const res = await apiFetch(previewUrl!);
      const contentType = res.headers.get('content-type') ?? '';
      if (!res.ok || contentType.includes('application/json')) {
        const json = await res.json().catch(() => ({}));
        const message =
          (json as { error?: { message?: string } }).error?.message ??
          t('governance.fileManager.previewUnavailable');
        throw new Error(message);
      }
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    },
    enabled: !!selectedId && isVisualPreview,
  });

  useEffect(() => {
    return () => {
      if (previewBlobUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  const { data: excelPreview } = useQuery({
    queryKey: ['gouvernance-file-excel', selectedId] as const,
    queryFn: async (): Promise<ExcelPreview> => {
      const res = await apiFetch(`${previewUrl}?format=json`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('Preview failed');
      return (json as { data: ExcelPreview }).data;
    },
    enabled: !!selectedId && selected?.previewKind === 'excel',
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) return;
      const res = await apiFetch(
        `/api/sections/securite-configuration/gouvernance-donnees/storage/files/${selectedId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'archive',
            reason: archiveReason,
            legalHold,
          }),
        },
      );
      if (!res.ok) throw new Error(t('governance.fileManager.archiveError'));
    },
    onSuccess: () => {
      toast.success(t('governance.fileManager.archiveSuccess'));
      setArchiveOpen(false);
      setArchiveReason('');
      void qc.invalidateQueries({ queryKey: ['gouvernance-file-manager'] });
      void qc.invalidateQueries({ queryKey: ['gouvernance-file-detail'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const versionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId || !versionFile) return;
      const fd = new FormData();
      fd.append('file', versionFile);
      fd.append('changeReason', versionReason || 'Nouvelle version');
      const res = await apiFetch(
        `/api/sections/securite-configuration/gouvernance-donnees/storage/files/${selectedId}/versions`,
        { method: 'POST', body: fd },
      );
      if (!res.ok) throw new Error(t('governance.fileManager.versionError'));
    },
    onSuccess: () => {
      toast.success(t('governance.fileManager.versionSuccess'));
      setVersionOpen(false);
      setVersionFile(null);
      setVersionReason('');
      void qc.invalidateQueries({ queryKey: ['gouvernance-file-manager'] });
      void qc.invalidateQueries({ queryKey: ['gouvernance-file-detail'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleExpand = (nodePrefix: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(nodePrefix)) next.delete(nodePrefix);
      else next.add(nodePrefix);
      return next;
    });
  };

  const clearDossier = () => {
    setDossierId('');
    setDossierSearch('');
    setDossierQ('');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil((data?.pagination.total ?? 0) / 20));

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{t('governance.fileManager.title')}</ToolbarTitle>
            <ToolbarDescription>{t('governance.fileManager.description')}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {t('crud.refresh')}
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-4 pb-8">
        <div className={kpiStatsGridClass(5)}>
          {kpiCards.map((card, index) => {
            const Icon = card.icon;
            const accent = SECTION_KPI_CARD_ACCENTS[index % SECTION_KPI_CARD_ACCENTS.length];
            return (
              <div
                key={card.label}
                className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
              >
                <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{card.value}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{card.hint}</p>
                  </div>
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-lg border',
                      accent.box,
                    )}
                  >
                    <Icon className={cn('size-5', accent.icon)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-3 border-b py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="flex-1 space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  {t('governance.fileManager.dossierSearch')}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={dossierQ}
                    onChange={(e) => setDossierQ(e.target.value)}
                    placeholder={t('governance.fileManager.dossierPlaceholder')}
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setDossierSearch(dossierQ);
                      setDossierId('');
                      setPrefix('');
                      setPage(1);
                    }}
                  >
                    <UserRound className="size-4" />
                  </Button>
                  {(dossierId || dossierSearch) && (
                    <Button variant="outline" onClick={clearDossier}>
                      {t('governance.fileManager.clearDossier')}
                    </Button>
                  )}
                </div>
                {(data?.dossierUsers.length ?? 0) > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {data!.dossierUsers.map((u) => (
                      <Button
                        key={u.id}
                        size="sm"
                        variant={dossierId === u.id || data?.activeDossier?.id === u.id ? 'mono' : 'outline'}
                        onClick={() => {
                          setDossierId(u.id);
                          setDossierSearch(dossierQ);
                          setPrefix('');
                          setPage(1);
                        }}
                      >
                        {u.name || u.email}
                        <Badge variant="secondary" className="ms-1 text-2xs">
                          {u.userCategory}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                ) : null}
                {data?.activeDossier ? (
                  <p className="text-xs text-muted-foreground">
                    {t('governance.fileManager.dossierActive', {
                      name: data.activeDossier.name || data.activeDossier.email,
                    })}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-1 gap-2">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('governance.fileManager.fileSearch')}
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch(q);
                    setPage(1);
                  }}
                >
                  <Search className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {(['ACTIVE', 'ARCHIVED', 'ALL'] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={status === s ? 'mono' : 'outline'}
                  onClick={() => {
                    setStatus(s);
                    setPage(1);
                  }}
                >
                  {t(`governance.fileManager.status.${s.toLowerCase()}`)}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ResizablePanelGroup
              key={isLgLayout ? 'file-manager-h' : 'file-manager-v'}
              direction={isLgLayout ? 'horizontal' : 'vertical'}
              autoSaveId={
                isLgLayout
                  ? 'governance-file-manager-panels-h-v2'
                  : 'governance-file-manager-panels-v-v2'
              }
              className={cn(
                'h-[min(65vh,600px)]',
                !isLgLayout && 'h-[min(75vh,720px)]',
              )}
            >
              <ResizablePanel
                defaultSize={isLgLayout ? 20 : 26}
                minSize={isLgLayout ? 14 : 18}
                maxSize={isLgLayout ? 36 : 42}
                className="min-w-0"
              >
                <div
                  className={cn(
                    'flex h-full min-h-0 flex-col',
                    isLgLayout ? 'border-e' : 'border-b',
                  )}
                >
                  <div className="shrink-0 border-b px-3 py-2.5">
                    <p className="text-sm font-semibold">{t('governance.fileManager.folders')}</p>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <button
                      type="button"
                      onClick={() => {
                        setPrefix('');
                        setPage(1);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50',
                        !prefix && !dossierId && 'bg-primary/5 font-medium',
                      )}
                    >
                      <StorageAllFilesIcon />
                      {t('governance.fileManager.allFiles')}
                    </button>
                    {visibleTree.map((node) => {
                      const isExpanded = expanded.has(node.prefix);
                      const indent = (node.depth - 1) * 12;
                      return (
                        <div
                          key={node.prefix}
                          className="flex items-center"
                          style={{ paddingLeft: `${8 + indent}px` }}
                        >
                          {node.hasChildren ? (
                            <button
                              type="button"
                              className="flex size-6 shrink-0 items-center justify-center rounded hover:bg-muted/50"
                              onClick={() => toggleExpand(node.prefix)}
                              aria-label={isExpanded ? 'Réduire' : 'Déplier'}
                            >
                              <ChevronRight
                                className={cn(
                                  'size-3.5 text-muted-foreground transition-transform',
                                  isExpanded && 'rotate-90',
                                )}
                              />
                            </button>
                          ) : (
                            <span className="size-6 shrink-0" />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setPrefix(node.prefix);
                              setPage(1);
                              if (node.entityId) {
                                setDossierId(node.entityId);
                                if (node.displayLabel) setDossierSearch(node.displayLabel);
                              }
                              if (node.hasChildren && !isExpanded) toggleExpand(node.prefix);
                            }}
                            className={cn(
                              'flex min-w-0 flex-1 items-center justify-between gap-2 py-2 pe-3 text-left text-sm hover:bg-muted/50',
                              prefix === node.prefix && 'bg-primary/5 font-medium',
                              node.entityId &&
                                (dossierId === node.entityId ||
                                  data?.activeDossier?.id === node.entityId) &&
                                'ring-1 ring-inset ring-primary/30',
                            )}
                            title={node.prefix}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <StorageFolderIcon
                                prefix={node.prefix}
                                open={prefix === node.prefix}
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-medium">
                                  {node.displayLabel ?? node.label}
                                </span>
                                {node.entityKind ? (
                                  <span className="text-2xs text-muted-foreground">
                                    {ENTITY_KIND_LABELS[node.entityKind] ?? node.entityKind}
                                  </span>
                                ) : null}
                              </span>
                            </span>
                            {node.fileCount > 0 ? (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'shrink-0 border text-2xs font-semibold',
                                  folderCountBadgeClass(node.prefix),
                                )}
                              >
                                {node.fileCount}
                              </Badge>
                            ) : null}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-border" />

              <ResizablePanel
                defaultSize={isLgLayout ? 30 : 34}
                minSize={isLgLayout ? 20 : 22}
                className="min-w-0"
              >
                <div
                  className={cn(
                    'flex h-full min-h-0 flex-col',
                    isLgLayout ? 'border-e' : 'border-b',
                  )}
                >
                  <div className="shrink-0 border-b px-3 py-2.5">
                    <p className="text-sm font-semibold">
                      {t('governance.fileManager.fileList', { defaultValue: 'Fichiers' })}
                    </p>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center gap-2 px-3 py-12 text-muted-foreground">
                        <LoaderCircleIcon className="size-5 animate-spin" />
                        {t('crud.loading')}
                      </div>
                    ) : (data?.items.length ?? 0) === 0 ? (
                      <p className="px-3 py-12 text-center text-sm text-muted-foreground">
                        {t('crud.empty')}
                      </p>
                    ) : (
                      data!.items.map((row) => (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => setSelectedId(row.id)}
                          className={cn(
                            'flex w-full items-center gap-2.5 border-b px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/20',
                            selectedId === row.id && 'bg-primary/5',
                          )}
                        >
                          <StorageFileIcon
                            previewKind={row.previewKind}
                            mimeType={row.mimeType}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{row.originalName}</span>
                            {row.category ? (
                              <span className="text-2xs text-muted-foreground">{row.category}</span>
                            ) : null}
                          </span>
                          <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">
                            {row.sizeLabel}
                          </span>
                          {row.legalHold ? (
                            <Badge variant="warning" className="shrink-0 text-2xs">
                              {t('governance.fileManager.legalHold')}
                            </Badge>
                          ) : null}
                        </button>
                      ))
                    )}
                  </div>
                  {(data?.pagination.total ?? 0) > 20 ? (
                    <div className="flex shrink-0 items-center justify-between border-t px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        {t('crud.page', { page, total: totalPages })}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          {t('crud.prev')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={page >= totalPages}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          {t('crud.next')}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-border" />

              <ResizablePanel
                defaultSize={isLgLayout ? 50 : 40}
                minSize={isLgLayout ? 32 : 28}
                maxSize={isLgLayout ? 62 : 55}
                className="min-w-0"
              >
                <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 border-b px-3 py-2.5">
                <p className="text-sm font-semibold">{t('governance.fileManager.preview')}</p>
              </div>
              <div className="relative min-h-0 flex-1">
              <ScrollArea className="h-full">
              <div className="space-y-3 p-3">
                {!selected ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t('governance.fileManager.selectFile')}
                  </p>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <StorageFileIcon
                        previewKind={selected.previewKind}
                        mimeType={selected.mimeType}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">{selected.originalName}</p>
                        <p className="text-xs text-muted-foreground">{selected.mimeType}</p>
                      </div>
                    </div>

                    <dl className="grid grid-cols-[minmax(5rem,auto)_1fr] gap-x-3 gap-y-1.5 rounded-lg border bg-muted/15 p-3 text-xs">
                      <dt className="text-muted-foreground">{t('governance.fileManager.colSize')}</dt>
                      <dd className="font-medium">{selected.sizeLabel}</dd>
                      <dt className="text-muted-foreground">{t('governance.fileManager.colVersion')}</dt>
                      <dd className="font-medium">v{selected.currentVersion}</dd>
                      <dt className="text-muted-foreground">{t('governance.fileManager.colModule')}</dt>
                      <dd className="truncate font-medium">{selected.module}</dd>
                      {selected.entityDisplayName ? (
                        <>
                          <dt className="text-muted-foreground">{t('governance.fileManager.colEntity')}</dt>
                          <dd className="truncate font-medium text-primary">
                            {selected.entityDisplayName}
                          </dd>
                        </>
                      ) : null}
                      <dt className="text-muted-foreground">{t('governance.fileManager.colStatus')}</dt>
                      <dd className="font-medium">
                        {t(`governance.fileManager.fileStatus.${selected.status.toLowerCase()}`)}
                      </dd>
                      {selected.storageKey ? (
                        <>
                          <dt className="text-muted-foreground">{t('governance.fileManager.colPath')}</dt>
                          <dd className="break-all font-mono text-2xs leading-relaxed text-muted-foreground">
                            {formatStoragePathLabel(
                              selected.storageKey,
                              selected.entityDisplayName,
                              selected.entityId,
                            )}
                          </dd>
                        </>
                      ) : null}
                    </dl>

                    <div className="flex flex-wrap gap-2">
                      {selected.previewKind === 'pdf' || selected.previewKind === 'image' ? (
                        <Button size="sm" variant="outline" asChild disabled={!previewBlobUrl}>
                          <a
                            href={previewBlobUrl ?? previewUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Eye className="size-4" /> {t('governance.open')}
                          </a>
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" asChild>
                        <a href={previewUrl!} download={selected.originalName}>
                          <Download className="size-4" /> {t('governance.fileManager.download')}
                        </a>
                      </Button>
                      {selected.status === 'ACTIVE' ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setVersionOpen(true)}>
                            <Upload className="size-4" /> {t('governance.fileManager.newVersion')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setArchiveOpen(true)}>
                            <Archive className="size-4" /> {t('governance.fileManager.archive')}
                          </Button>
                        </>
                      ) : null}
                    </div>

                    {selected.previewKind === 'pdf' && previewUrl ? (
                      previewLoading ? (
                        <div className="flex h-64 items-center justify-center rounded-md border bg-muted/20">
                          <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : previewIsError ? (
                        <div className="rounded-md border border-dashed border-destructive/30 bg-destructive/5 px-3 py-4 text-sm text-destructive">
                          {previewError instanceof Error
                            ? previewError.message
                            : t('governance.fileManager.previewUnavailable')}
                        </div>
                      ) : previewBlobUrl ? (
                        <iframe
                          title={selected.originalName}
                          src={previewBlobUrl}
                          className="h-[min(36vh,420px)] min-h-[220px] w-full rounded-md border bg-muted/20"
                        />
                      ) : null
                    ) : null}

                    {selected.previewKind === 'image' && previewUrl ? (
                      previewLoading ? (
                        <div className="flex h-64 items-center justify-center rounded-md border bg-muted/20">
                          <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : previewIsError ? (
                        <div className="rounded-md border border-dashed border-destructive/30 bg-destructive/5 px-3 py-4 text-sm text-destructive">
                          {previewError instanceof Error
                            ? previewError.message
                            : t('governance.fileManager.previewUnavailable')}
                        </div>
                      ) : previewBlobUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewBlobUrl}
                          alt={selected.originalName}
                          className="max-h-[min(36vh,420px)] min-h-[220px] w-full rounded-md border object-contain"
                        />
                      ) : null
                    ) : null}

                    {(selected.previewKind === 'excel' || selected.previewKind === 'csv') &&
                    excelPreview ? (
                      <ScrollArea className="h-64 rounded-md border">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/40">
                              {excelPreview.headers.map((h) => (
                                <th key={h} className="border px-2 py-1 text-left font-medium">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {excelPreview.rows.map((row, i) => (
                              <tr key={i} className="border-t">
                                {row.map((cell, j) => (
                                  <td key={j} className="border px-2 py-1">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </ScrollArea>
                    ) : null}

                    {detail?.versions?.length ? (
                      <div className="space-y-2 border-t pt-3">
                        <p className="flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
                          <History className="size-3.5" />
                          {t('governance.fileManager.versions')}
                        </p>
                        <ul className="space-y-1 text-xs">
                          {detail.versions.map((v) => (
                            <li
                              key={v.id}
                              className={cn(
                                'rounded-md border px-2 py-1.5',
                                v.isCurrent && 'border-primary/40 bg-primary/5',
                              )}
                            >
                              <span className="font-medium">v{v.versionNumber}</span>
                              <span className="text-muted-foreground"> — {v.status}</span>
                              {v.changeReason ? (
                                <p className="text-muted-foreground">{v.changeReason}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
              </ScrollArea>
              </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </CardContent>
        </Card>
      </Container>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('governance.fileManager.archiveTitle')}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <div className="space-y-2">
              <Label>{t('governance.fileManager.archiveReason')}</Label>
              <Textarea value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={legalHold}
                onChange={(e) => setLegalHold(e.target.checked)}
              />
              {t('governance.fileManager.legalHoldLabel')}
            </label>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveOpen(false)}>
              {t('common.buttons.cancel')}
            </Button>
            <Button
              variant="mono"
              disabled={archiveMutation.isPending}
              onClick={() => archiveMutation.mutate()}
            >
              {t('governance.fileManager.archiveConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={versionOpen} onOpenChange={setVersionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('governance.fileManager.versionTitle')}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <div className="space-y-2">
              <Label>{t('governance.fileManager.versionFile')}</Label>
              <Input type="file" onChange={(e) => setVersionFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-2">
              <Label>{t('governance.fileManager.versionReason')}</Label>
              <Input value={versionReason} onChange={(e) => setVersionReason(e.target.value)} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVersionOpen(false)}>
              {t('common.buttons.cancel')}
            </Button>
            <Button
              variant="mono"
              disabled={!versionFile || versionMutation.isPending}
              onClick={() => versionMutation.mutate()}
            >
              {t('governance.fileManager.versionSubmit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
