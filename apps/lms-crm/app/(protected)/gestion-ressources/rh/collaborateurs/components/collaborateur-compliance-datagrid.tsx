'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Inbox,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@repo/ui/card';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
import { DataGrid } from '@repo/ui/data-grid';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import { DataGridTable } from '@repo/ui/data-grid-table';
import {
  USER_MANAGEMENT_TABLE_CLASSNAMES,
  USER_MANAGEMENT_TABLE_LAYOUT,
} from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { cn } from '@/lib/utils';
import { complianceDossierGedPath } from '@/lib/governance/compliance-dossier-links';
import {
  fetchCollaborateurCompliance,
  type CollaborateurComplianceResponse,
} from '@/lib/gestion-ressources/collaborateur-compliance-api';
import type { RhComplianceDocRow } from '@/lib/gestion-ressources/rh-user-compliance-rows';

const PAGE_SIZE = 8;
const QUERY_KEY = 'collaborateur-compliance';

type FilterMode = 'non_compliant' | 'all';

function formatDate(d: string | null) {
  if (!d) return '—';
  try {
    return format(parseISO(d), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return '—';
  }
}

function statusBadge(status: RhComplianceDocRow['status']) {
  switch (status) {
    case 'VALID':
      return (
        <Badge className="bg-success/10 text-success border-success/20 font-bold text-[10px]">
          Valide
        </Badge>
      );
    case 'EXPIRING_SOON':
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20 font-bold text-[10px]">
          Expire bientôt
        </Badge>
      );
    case 'EXPIRED':
      return (
        <Badge variant="destructive" className="font-bold text-[10px]">
          Expiré
        </Badge>
      );
    case 'MISSING':
      return (
        <Badge variant="destructive" className="font-bold text-[10px]">
          Manquant
        </Badge>
      );
    case 'WARNING':
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20 font-bold text-[10px]">
          Alerte
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function CollaborateurComplianceDatagrid({
  userId,
  displayName,
  trainerContext = false,
}: {
  userId: string;
  displayName: string;
  trainerContext?: boolean;
}) {
  const [filterMode, setFilterMode] = useState<FilterMode>('non_compliant');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  const gedPath = complianceDossierGedPath(userId, displayName);

  const listQuery = useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: () => fetchCollaborateurCompliance(userId),
  });

  const data = listQuery.data;
  const rows = useMemo(() => {
    const all = data?.rows ?? [];
    if (filterMode === 'all') return all;
    return all.filter((r) => r.status !== 'VALID');
  }, [data?.rows, filterMode]);

  const columns = useMemo<ColumnDef<RhComplianceDocRow>[]>(
    () => [
      {
        id: 'label',
        accessorKey: 'label',
        header: ({ column }) => <DataGridColumnHeader title="Document" column={column} />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-semibold text-xs text-foreground truncate">{row.original.label}</p>
            {row.original.documentRef && (
              <p className="text-[10px] text-muted-foreground truncate">Réf. {row.original.documentRef}</p>
            )}
          </div>
        ),
        size: 180,
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Statut" column={column} />,
        cell: ({ row }) => statusBadge(row.original.status),
        size: 110,
      },
      {
        id: 'expiresAt',
        accessorKey: 'expiresAt',
        header: ({ column }) => <DataGridColumnHeader title="Expiration" column={column} />,
        cell: ({ row }) => (
          <span
            className={cn(
              'text-xs font-medium',
              row.original.status === 'EXPIRED' && 'text-destructive',
              row.original.status === 'EXPIRING_SOON' && 'text-yellow-700 dark:text-yellow-400',
            )}
          >
            {formatDate(row.original.expiresAt)}
          </span>
        ),
        size: 100,
      },
      {
        id: 'message',
        accessorKey: 'message',
        header: ({ column }) => <DataGridColumnHeader title="Anomalie" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground line-clamp-2">
            {row.original.message ?? '—'}
          </span>
        ),
        size: 200,
      },
      {
        id: 'file',
        header: 'Fichier',
        cell: ({ row }) => {
          const { fileUrl, fileName } = row.original;
          if (!fileUrl) {
            return <span className="text-[10px] text-muted-foreground/60 uppercase font-bold">Absent</span>;
          }
          return (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline uppercase"
              title={fileName ?? undefined}
            >
              <ExternalLink className="size-3" />
              Voir
            </a>
          );
        },
        size: 70,
      },
      {
        id: 'ged',
        header: 'GED',
        cell: () => (
          <Link
            href={gedPath}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline uppercase"
          >
            <FileText className="size-3" />
            GED
          </Link>
        ),
        size: 60,
      },
    ],
    [gedPath],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    pageCount: Math.ceil(rows.length / pagination.pageSize) || 1,
    manualPagination: false,
  });

  const summary = data?.summary;

  return (
    <div className="space-y-4">
      {/* Bandeau résumé */}
      <SummaryBanner data={data} trainerContext={trainerContext} gedPath={gedPath} />

      {/* Filtres */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={filterMode === 'non_compliant' ? 'primary' : 'outline'}
            className="h-7 text-[11px] font-bold"
            onClick={() => setFilterMode('non_compliant')}
          >
            Non conformes ({summary?.nonCompliant ?? 0})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filterMode === 'all' ? 'primary' : 'outline'}
            className="h-7 text-[11px] font-bold"
            onClick={() => setFilterMode('all')}
          >
            Tous ({summary?.total ?? 0})
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 text-[11px]"
          onClick={() => listQuery.refetch()}
          disabled={listQuery.isFetching}
        >
          <RefreshCw className={cn('size-3.5', listQuery.isFetching && 'animate-spin')} />
          Actualiser
        </Button>
      </div>

      {/* DataGrid */}
      <Card className="border-border shadow-none">
        <CardHeader className="py-2 px-3 border-b border-border">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Documents du dossier
          </p>
        </CardHeader>
        <DataGrid
          table={table}
          recordCount={rows.length}
          isLoading={listQuery.isLoading}
          emptyMessage={
            filterMode === 'non_compliant'
              ? 'Aucune anomalie documentaire — dossier conforme sur les pièces suivies.'
              : 'Aucun document suivi pour ce profil.'
          }
          tableLayout={USER_MANAGEMENT_TABLE_LAYOUT}
          tableClassNames={USER_MANAGEMENT_TABLE_CLASSNAMES}
        >
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter className="px-3 py-2 border-t border-border">
            <DataGridPagination />
          </CardFooter>
        </DataGrid>
      </Card>

      {/* Historique */}
      <ComplianceHistory events={data?.events ?? []} />
    </div>
  );
}

function SummaryBanner({
  data,
  trainerContext,
  gedPath,
}: {
  data: CollaborateurComplianceResponse | undefined;
  trainerContext: boolean;
  gedPath: string;
}) {
  const summary = data?.summary;
  if (!summary) return null;

  const globalIcon =
    summary.globalStatus === 'COMPLIANT' ? (
      <CheckCircle2 className="size-4 text-green-600" />
    ) : summary.globalStatus === 'WARNING' ? (
      <AlertTriangle className="size-4 text-yellow-600" />
    ) : (
      <ShieldAlert className="size-4 text-destructive" />
    );

  const globalColor =
    summary.globalStatus === 'COMPLIANT'
      ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
      : summary.globalStatus === 'WARNING'
        ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
        : 'border-destructive/30 bg-destructive/5';

  return (
    <>
      <div className={cn('flex items-center justify-between rounded-lg border px-4 py-3', globalColor)}>
        <div className="flex items-center gap-2.5">
          {globalIcon}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest">
              {summary.globalStatus === 'COMPLIANT'
                ? 'Dossier conforme'
                : summary.globalStatus === 'WARNING'
                  ? 'Attention — expiration proche'
                  : 'Dossier non conforme'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {summary.valid} valide{summary.valid > 1 ? 's' : ''}
              {summary.expiringSoon > 0 ? ` · ${summary.expiringSoon} expire bientôt` : ''}
              {summary.expired > 0 ? ` · ${summary.expired} expiré${summary.expired > 1 ? 's' : ''}` : ''}
              {summary.missing > 0 ? ` · ${summary.missing} manquant${summary.missing > 1 ? 's' : ''}` : ''}
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px] font-bold" asChild>
          <Link href={gedPath}>
            <ExternalLink className="size-3" />
            Voir dans la GED
          </Link>
        </Button>
      </div>

      {trainerContext && summary.globalStatus !== 'COMPLIANT' && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
          <ShieldAlert className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-destructive">
            Ce formateur ne peut pas être désigné sur des sessions tant que les documents critiques ne sont pas à jour.
          </p>
        </div>
      )}
    </>
  );
}

const EVENT_LABELS: Record<string, string> = {
  ITEM_UPLOADED: 'Document chargé',
  ITEM_VALIDATED: 'Document validé',
  ITEM_REJECTED: 'Document rejeté',
  ITEM_EXPIRED: 'Document expiré',
  ITEM_EXPIRING_SOON: 'Expiration imminente',
  ITEM_MISSING_NOTIFIED: 'Relance envoyée',
  DOSSIER_CREATED: 'Dossier créé',
  DOSSIER_COMPLETED: 'Dossier complété',
  ITEM_META_UPDATED: 'Métadonnées mises à jour',
};

function ComplianceHistory({
  events,
}: {
  events: CollaborateurComplianceResponse['events'];
}) {
  if (!events.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Clock className="size-3.5 text-muted-foreground" />
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Historique de conformité
        </h4>
      </div>
      <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
        {events.map((ev) => (
          <div key={ev.id} className="flex items-start gap-3 px-3 py-2 text-xs bg-background">
            <Inbox className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold text-foreground">
                {EVENT_LABELS[ev.eventType] ?? ev.eventType}
                {ev.dossierItem ? ` — ${ev.dossierItem.label}` : ''}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {ev.actor
                  ? [ev.actor.firstName, ev.actor.lastName].filter(Boolean).join(' ') || ev.actor.email
                  : 'Système'}{' '}
                · {formatDate(ev.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
