'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { Eye, Search, ShieldAlert } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { getAvatarUrl, getInitials } from '@/lib/helpers';
import {
  fetchGlobalComplianceUsers,
  type GlobalComplianceUserRow,
} from '@/lib/governance/global-user-compliance-api';
import { SCHOOL_USER_CATEGORY_LABELS } from '@/lib/rh-school-profile-fields';
import { ConformiteUserSheet } from './conformite-user-sheet';

function complianceBadge(status: GlobalComplianceUserRow['complianceStatus']) {
  switch (status) {
    case 'COMPLIANT':
      return <Badge className="bg-success/10 text-success border-success/20 font-bold text-[10px]">Conforme</Badge>;
    case 'WARNING':
      return <Badge className="bg-warning/10 text-warning border-warning/20 font-bold text-[10px]">Alerte</Badge>;
    case 'NON_COMPLIANT':
      return <Badge variant="destructive" className="font-bold text-[10px]">Non conforme</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ConformiteGlobalList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('issues');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE,
  });
  const [selected, setSelected] = useState<GlobalComplianceUserRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const complianceStatus =
    statusFilter === 'all' || statusFilter === 'issues'
      ? 'all'
      : (statusFilter as 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT');

  const listQuery = useQuery({
    queryKey: [
      'governance-compliance-users',
      pagination.pageIndex,
      pagination.pageSize,
      search,
      statusFilter,
    ],
    queryFn: () =>
      fetchGlobalComplianceUsers({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        q: search || undefined,
        complianceStatus,
        hasIssues: statusFilter === 'issues',
      }),
  });

  const rows = listQuery.data?.data ?? [];

  const columns = useMemo<ColumnDef<GlobalComplianceUserRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Profil" />,
        cell: ({ row }) => {
          const person = row.original;
          const initials = getInitials(person.name || person.email, 2);
          return (
            <div className="flex items-center gap-3 min-w-[180px]">
              <Avatar className="size-9 shrink-0">
                {person.avatar ? (
                  <AvatarImage
                    src={getAvatarUrl(person.avatar)}
                    alt={person.name || person.email}
                  />
                ) : null}
                <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-semibold text-sm truncate">{person.name}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                  {person.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'roleName',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Rôle" />,
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] font-bold uppercase">
            {row.original.roleName}
          </Badge>
        ),
      },
      {
        accessorKey: 'userCategory',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Catégorie" />,
        cell: ({ row }) => {
          const c = row.original.userCategory;
          const label =
            c && c in SCHOOL_USER_CATEGORY_LABELS
              ? SCHOOL_USER_CATEGORY_LABELS[c as keyof typeof SCHOOL_USER_CATEGORY_LABELS]
              : c ?? '—';
          return <span className="text-xs text-muted-foreground max-w-[160px] line-clamp-2">{label}</span>;
        },
      },
      {
        accessorKey: 'complianceStatus',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Statut" />,
        cell: ({ row }) => complianceBadge(row.original.complianceStatus),
      },
      {
        accessorKey: 'complianceIssueCount',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Anomalies" />,
        cell: ({ row }) => (
          <span className="font-bold tabular-nums">{row.original.complianceIssueCount}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setSelected(row.original);
              setSheetOpen(true);
            }}
          >
            <Eye className="size-3.5" />
            Détail
          </Button>
        ),
      },
    ],
    [],
  );

  const total = listQuery.data?.pagination.total ?? 0;

  const table = useReactTable({
    data: rows,
    columns,
    pageCount: Math.ceil(total / pagination.pageSize) || 1,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  return (
    <>
      <DataGrid
        table={table}
        recordCount={total}
        isLoading={listQuery.isLoading}
        loadingMessage="Chargement de la conformité…"
        emptyMessage="Aucun profil pour ce filtre."
      >
        <Card className="border border-border/70 shadow-none">
          <CardHeader className="flex flex-col gap-3 border-b border-border/60 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="size-4 text-destructive" />
              Conformité — tous les profils école
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 w-[200px] pl-8"
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="issues">Avec anomalies</SelectItem>
                  <SelectItem value="NON_COMPLIANT">Non conformes</SelectItem>
                  <SelectItem value="WARNING">Alertes</SelectItem>
                  <SelectItem value="COMPLIANT">Conformes</SelectItem>
                  <SelectItem value="all">Tous</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardTable>
            <ScrollArea className="w-full">
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter className="border-t border-border/60 py-3">
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>

      <ConformiteUserSheet
        row={selected}
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) setSelected(null);
        }}
      />
    </>
  );
}
