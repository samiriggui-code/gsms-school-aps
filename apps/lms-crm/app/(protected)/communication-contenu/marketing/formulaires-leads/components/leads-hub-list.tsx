'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';

import { useMemo, useState, type ReactNode } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { Eye, Mail, Search } from 'lucide-react';
import { LANDING_PREINSCRIPTION_LEAD_SOURCE, LANDING_QUOTE_LEAD_SOURCE } from '@repo/database/browser';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { companyFromLeadNotes, formationLabelFromLeadNotes } from '@/lib/landing-lead-notes';
import { useLandingLeadsQuery, type LandingLeadRow } from '../hooks/use-landing-leads-query';
import { LEAD_STATUS_LABEL_FR, LANDING_SOURCE_SHORT_LABEL } from '../constants/source-labels';
import { formatDateTime, getInitials } from '@/lib/helpers';

export type LeadsHubListRow = {
  userId: string;
  candidatureId: string;
  /** Raison sociale (demandes devis) ou chaîne vide. */
  companyName: string | null;
  /** Libellé principal dans le tableau : entreprise si connue, sinon contact. */
  displayPrimary: string;
  /** Formation extraite des notes (préinscription / devis). */
  formationLabel: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  source: string | null;
  status: string;
  createdAt: string;
  raw: LandingLeadRow;
};

interface LeadsHubListProps {
  leaderSlot?: ReactNode;
  onOpenLead: (row: LeadsHubListRow, tab: 'overview' | 'pipeline') => void;
}

function isQuoteSource(source: string | null | undefined): boolean {
  if (!source) return false;
  return source === LANDING_QUOTE_LEAD_SOURCE || source.toLowerCase().includes('devis');
}

function isPreinscriptionSource(source: string | null | undefined): boolean {
  if (!source) return false;
  return source === LANDING_PREINSCRIPTION_LEAD_SOURCE || source.toLowerCase().includes('preinscription');
}

function leadStatusBadgeVariant(status: string): 'primary' | 'info' | 'success' | 'destructive' | 'secondary' {
  switch (status) {
    case 'NEW':
      return 'primary';
    case 'CONTACTED':
      return 'info';
    case 'QUALIFIED':
      return 'success';
    case 'CONVERTED':
      return 'success';
    case 'LOST':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function LeadsHubList({ leaderSlot, onOpenLead }: LeadsHubListProps) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<'all' | 'quote' | 'preinscription'>('all');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE,
  });

  const { data, isLoading } = useLandingLeadsQuery({
    kind,
    q,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const rows = useMemo(
    () =>
      (data?.items ?? []).map((lead) => {
        const fullName = `${lead.firstName} ${lead.lastName}`.trim();
        const companyName = companyFromLeadNotes(lead.notes);
        const formationLabel = formationLabelFromLeadNotes(lead.notes);
        const pre = isPreinscriptionSource(lead.source);
        const displayPrimary =
          (companyName?.trim() ? companyName : null) ??
          (pre && formationLabel ? formationLabel : null) ??
          (fullName.trim() || lead.email);
        return {
          userId: lead.candidature?.userId ?? lead.id,
          candidatureId: lead.id,
          companyName,
          displayPrimary,
          formationLabel: formationLabel?.trim() || null,
          fullName,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: lead.status,
          createdAt: lead.createdAt,
          raw: lead,
        };
      }),
    [data?.items],
  );

  const columns = useMemo<ColumnDef<LeadsHubListRow>[]>(
    () => [
      {
        accessorKey: 'displayPrimary',
        id: 'displayPrimary',
        header: ({ column }) => <DataGridColumnHeader title="Entreprise / contact" column={column} />,
        cell: ({ row }) => {
          const r = row.original;
          const initials = getInitials(r.displayPrimary || r.email);
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <button
                  type="button"
                  className="truncate text-left text-sm font-semibold text-foreground hover:text-primary"
                  onClick={() => onOpenLead(r, 'overview')}
                >
                  {r.displayPrimary || '—'}
                </button>
                {r.companyName ? (
                  <div className="truncate text-xs text-muted-foreground">
                    {r.fullName}
                    {r.email ? ` · ${r.email}` : null}
                  </div>
                ) : isPreinscriptionSource(r.source) && r.formationLabel ? (
                  <div className="truncate text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">Préinscription</span>
                    {r.fullName ? ` · ${r.fullName}` : null}
                    {r.email ? ` · ${r.email}` : null}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="size-3 shrink-0" />
                    <span className="truncate">{r.email}</span>
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: 'source',
        accessorKey: 'source',
        header: ({ column }) => <DataGridColumnHeader title="Source" column={column} />,
        cell: ({ row }) => {
          const src = row.original.source;
          const label = src ? LANDING_SOURCE_SHORT_LABEL[src] ?? src : '—';
          const variant = isQuoteSource(src) ? 'info' : isPreinscriptionSource(src) ? 'warning' : 'secondary';
          return (
            <Badge variant={variant} appearance="light" className="font-semibold uppercase text-[10px]">
              {label}
            </Badge>
          );
        },
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.status')} column={column} />,
        cell: ({ row }) => (
          <Badge variant={leadStatusBadgeVariant(row.original.status)} appearance="light" className="font-semibold uppercase text-[10px]">
            {LEAD_STATUS_LABEL_FR[row.original.status] ?? row.original.status}
          </Badge>
        ),
      },
      {
        id: 'phone',
        accessorKey: 'phone',
        header: ({ column }) => <DataGridColumnHeader title="Téléphone" column={column} />,
        cell: ({ row }) => <span className="text-sm">{row.original.phone ?? '—'}</span>,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => <DataGridColumnHeader title="Reçu le" column={column} />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-0.5 pe-2">
            <Button
              type="button"
              variant="ghost"
              mode="icon"
              className="size-8"
              title="Voir le détail du lead"
              aria-label="Voir le détail du lead"
              onClick={() => onOpenLead(row.original, 'overview')}
            >
              <Eye className="size-4 text-muted-foreground" />
            </Button>
          </div>
        ),
      },
    ],
    [onOpenLead],
  );

  const table = useReactTable({
    columns,
    data: rows,
    pageCount: Math.max(1, Math.ceil((data?.pagination.total ?? 0) / pagination.pageSize)),
    state: { pagination },
    onPaginationChange: setPagination,
    getRowId: (r) => r.candidatureId,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  return (
    <>
      <Card className="mb-5 border-border shadow-none">
        <CardHeader className="space-y-4 py-4">
          {leaderSlot}

          <div className="relative w-full">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setPagination((p) => ({ ...p, pageIndex: 0 }));
                setQ(e.target.value);
              }}
              placeholder={t('datagrid.search.lead')}
              className="h-10 ps-9"
            />
          </div>

          <div
            role="tablist"
            aria-label="Filtrer par type de demande"
            className="flex h-auto min-h-10 w-full min-w-0 flex-wrap justify-start gap-1 rounded-lg border border-border bg-accent p-1 lg:inline-flex lg:w-auto lg:max-w-full"
          >
            <Button
              type="button"
              role="tab"
              aria-selected={kind === 'all'}
              size="sm"
              variant={kind === 'all' ? 'secondary' : 'ghost'}
              className="text-xs sm:text-sm"
              onClick={() => {
                setPagination((p) => ({ ...p, pageIndex: 0 }));
                setKind('all');
              }}
            >
              Tous
            </Button>
            <Button
              type="button"
              role="tab"
              aria-selected={kind === 'quote'}
              size="sm"
              variant={kind === 'quote' ? 'secondary' : 'ghost'}
              className="text-xs sm:text-sm"
              onClick={() => {
                setPagination((p) => ({ ...p, pageIndex: 0 }));
                setKind('quote');
              }}
            >
              Devis
            </Button>
            <Button
              type="button"
              role="tab"
              aria-selected={kind === 'preinscription'}
              size="sm"
              variant={kind === 'preinscription' ? 'secondary' : 'ghost'}
              className="text-xs sm:text-sm"
              onClick={() => {
                setPagination((p) => ({ ...p, pageIndex: 0 }));
                setKind('preinscription');
              }}
            >
              Préinscription
            </Button>
          </div>
        </CardHeader>
      </Card>

      <DataGrid
        table={table}
        recordCount={data?.pagination.total ?? 0}
        isLoading={isLoading}
        tableLayout={{
          columnsResizable: true,
          columnsPinnable: true,
          columnsMovable: true,
          columnsVisibility: true,
          width: 'auto',
        }}
      >
        <Card className="border-border shadow-none">
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter className="border-t border-border">
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>
    </>
  );
}
