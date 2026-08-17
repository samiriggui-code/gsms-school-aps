'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Pencil, Plus, Search, ShieldAlert, Trash, UserRound, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable, CardToolbar } from '@/components/ui/card';
import {
  DataGrid,
  DataGridApiFetchParams,
  DataGridApiResponse,
} from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { UserRole } from '@/app/models/user';
import {
  USER_MANAGEMENT_TABLE_CLASSNAMES,
  USER_MANAGEMENT_TABLE_LAYOUT,
} from '../../../components/datagrid-standards';
import RoleEditSheet from './role-edit-sheet';
import RoleDeleteSheet from './role-delete-sheet';
import RoleDefaultSheet from './role-default-sheet';
import { RolePermissionsCell } from './role-permissions-cell';

async function fetchRoles({
  pageIndex,
  pageSize,
  sorting,
  searchQuery,
}: DataGridApiFetchParams): Promise<DataGridApiResponse<UserRole>> {
  const sortField = sorting?.[0]?.id || 'name';
  const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';

  const params = new URLSearchParams({
    page: String(pageIndex + 1),
    limit: String(pageSize),
    sort: sortField,
    dir: sortDirection,
    ...(searchQuery ? { query: searchQuery } : {}),
  });

  const response = await apiFetch(
    `/api/sections/securite-configuration/acces/roles?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error('Impossible de charger les rôles.');
  }

  return response.json();
}

const RoleList = () => {
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'default' | 'system' | 'custom'>('all');

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [defaultOpen, setDefaultOpen] = useState(false);

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [deleteRole, setDeleteRole] = useState<UserRole | null>(null);
  const [defaultRole, setDefaultRole] = useState<UserRole | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['user-roles', pagination, sorting, searchQuery],
    queryFn: () =>
      fetchRoles({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        searchQuery,
      }),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const openCreate = useCallback(() => {
    setSelectedRole(null);
    setEditOpen(true);
  }, []);

  const openEdit = useCallback((role: UserRole) => {
    setSelectedRole(role);
    setEditOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<UserRole>[]>(
    () => [
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader title="Rôle" column={column} visibility />
        ),
        cell: ({ row, getValue }) => {
          const value = getValue() as string;
          const isProtected = row.original.isProtected;
          const isDefault = row.original.isDefault;

          return (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">{value}</span>
              {isProtected ? (
                <Badge variant="outline" className="gap-1">
                  <ShieldAlert className="size-3 text-destructive" />
                  Système
                </Badge>
              ) : null}
              {isDefault ? (
                <Badge variant="outline" className="gap-1">
                  <UserRound className="size-3 text-success" />
                  Défaut
                </Badge>
              ) : null}
            </div>
          );
        },
        size: 220,
        enableSorting: true,
        enableHiding: false,
        meta: { headerTitle: 'Rôle', skeleton: <Skeleton className="w-28 h-7" /> },
      },
      {
        accessorKey: 'slug',
        id: 'slug',
        header: ({ column }) => (
          <DataGridColumnHeader title="Slug" column={column} visibility />
        ),
        cell: (info) => (
          <Badge variant="secondary" className="font-mono text-xs">
            {info.getValue() as string}
          </Badge>
        ),
        enableSorting: true,
        meta: { headerTitle: 'Slug', skeleton: <Skeleton className="w-20 h-7" /> },
      },
      {
        id: 'permissions',
        header: 'Permissions',
        cell: ({ row }) => <RolePermissionsCell role={row.original} />,
        size: 200,
        maxSize: 220,
        enableSorting: false,
        meta: {
          headerTitle: 'Permissions',
          skeleton: <Skeleton className="w-64 h-16" />,
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const role = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                mode="icon"
                onClick={() => openEdit(role)}
                title="Modifier le rôle"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {!role.isDefault ? (
                <Button
                  variant="ghost"
                  size="sm"
                  mode="icon"
                  onClick={() => {
                    setDefaultRole(role);
                    setDefaultOpen(true);
                  }}
                  title="Définir par défaut"
                >
                  <UserRound className="h-4 w-4" />
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                mode="icon"
                disabled={!!role.isProtected}
                onClick={() => {
                  setDeleteRole(role);
                  setDeleteOpen(true);
                }}
                title="Supprimer"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          );
        },
        size: 130,
        enableSorting: false,
        meta: { skeleton: <Skeleton className="size-5" /> },
      },
    ],
    [openEdit],
  );

  const filteredData = (data?.data || []).filter((role) => {
    if (typeFilter === 'all') return true;
    if (typeFilter === 'default') return Boolean(role.isDefault);
    if (typeFilter === 'system') return Boolean(role.isProtected);
    return !role.isDefault && !role.isProtected;
  });

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((data?.pagination.total || 0) / pagination.pageSize),
    getRowId: (row: UserRole) => row.id,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const DataGridToolbar = () => {
    const [inputValue, setInputValue] = useState(searchQuery);

    const handleSearch = () => {
      setSearchQuery(inputValue);
      setPagination({ ...pagination, pageIndex: 0 });
    };

    const clearSearch = () => {
      setInputValue('');
      setSearchQuery('');
      setPagination({ ...pagination, pageIndex: 0 });
    };

    return (
      <CardHeader className="py-3 min-w-0">
        <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">Liste des rôles IAM</h3>
            <p className="text-xs text-muted-foreground">
              Badges = permissions actives. Utilisez le crayon pour modifier un rôle.
            </p>
          </div>
          <CardToolbar className="flex min-w-0 w-full flex-wrap items-stretch gap-2 sm:w-auto sm:items-center sm:justify-end">
            <div className="relative min-w-0 flex-1 basis-full sm:basis-auto sm:min-w-[12rem]">
              <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Rechercher un rôle…"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isLoading}
                className="ps-9 w-full sm:w-64"
              />
              {inputValue.length > 0 ? (
                <Button
                  mode="icon"
                  variant="dim"
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={clearSearch}
                >
                  <X />
                </Button>
              ) : null}
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) =>
                setTypeFilter(v as 'all' | 'default' | 'system' | 'custom')
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filtrer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="default">Par défaut</SelectItem>
                <SelectItem value="system">Système</SelectItem>
                <SelectItem value="custom">Personnalisés</SelectItem>
              </SelectContent>
            </Select>
            <DataGridColumnVisibility
              table={table}
              trigger={<Button variant="outline">Colonnes</Button>}
            />
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Nouveau rôle
            </Button>
          </CardToolbar>
        </div>
      </CardHeader>
    );
  };

  return (
    <>
      <Card className="mb-5 border-border shadow-none">
        <DataGridToolbar />
      </Card>
      <DataGrid
        table={table}
        recordCount={data?.pagination.total || 0}
        isLoading={isLoading}
        tableLayout={USER_MANAGEMENT_TABLE_LAYOUT}
        tableClassNames={{ ...USER_MANAGEMENT_TABLE_CLASSNAMES, base: 'min-w-[900px]' }}
      >
        <Card className="border-border shadow-sm overflow-hidden">
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>

      {editOpen ? (
        <RoleEditSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          role={selectedRole}
        />
      ) : null}

      {deleteRole ? (
        <RoleDeleteSheet
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          role={deleteRole}
        />
      ) : null}

      {defaultRole ? (
        <RoleDefaultSheet
          open={defaultOpen}
          onOpenChange={setDefaultOpen}
          role={defaultRole}
        />
      ) : null}
    </>
  );
};

export default RoleList;
