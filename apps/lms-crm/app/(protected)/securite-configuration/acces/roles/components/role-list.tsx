'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  RowSelectionState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Eye,
  Plus,
  Search,
  ShieldAlert,
  SquarePen,
  Trash,
  UserRound,
  X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable, CardToolbar } from '@/components/ui/card';
import {
  DataGrid,
  DataGridApiFetchParams,
  DataGridApiResponse,
  useDataGrid,
} from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from '@/components/ui/data-grid-table';
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
import { Separator } from '@/components/ui/separator';
import { UserRole } from '@/app/models/user';
import {
  USER_MANAGEMENT_TABLE_CLASSNAMES,
  USER_MANAGEMENT_TABLE_LAYOUT,
} from '../../../components/datagrid-standards';
import RoleDefaultDialog from './role-default-dialog';
import RoleDeleteDialog from './role-delete-dialog';
import RoleEditDialog from './role-edit-dialog';

const RoleList = () => {
  const { t } = useTranslation();
  // List state management
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Form state management
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [defaultDialogOpen, setDefaultDialogOpen] = useState(false);

  const [editRole, setEditRole] = useState<UserRole | null>(null);
  const [deleteRole, setDeleteRole] = useState<UserRole | null>(null);
  const [defaultRole, setDefaultRole] = useState<UserRole | null>(null);

  // Query state management
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'default' | 'system' | 'custom'>('all');

  // Role list
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
    gcTime: 1000 * 60 * 60, // 60 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  // Fetch roles from the server API
  const fetchRoles = async ({
    pageIndex,
    pageSize,
    sorting,
    filters,
    searchQuery,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<UserRole>> => {
    const sortField = sorting?.[0]?.id || '';
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';

    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      ...(sortField ? { sort: sortField, dir: sortDirection } : {}),
      ...(searchQuery ? { query: searchQuery } : {}),
      ...Object.fromEntries(
        (filters || []).map((f) => [f.id, String(f.value)]),
      ),
    });

    const response = await apiFetch(
      `/api/sections/securite-configuration/acces/roles?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(
        'Oops! Something didn’t go as planned. Please try again in a moment.',
      );
    }

    return response.json();
  };

  // Table settings
  const columns = useMemo<ColumnDef<UserRole>[]>(
    () => [
      {
        id: 'id',
        accessorKey: 'id',
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        size: 27,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        meta: {
          skeleton: <Skeleton className="size-5" />,
        },
      },
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader title="Role" column={column} visibility />
        ),
        cell: ({ row, getValue }) => {
          const value = getValue() as string;
          const isProtected = row.original.isProtected;
          const isDefault = row.original.isDefault;

          return (
            <div className="flex items-center flex-wrap gap-2">
              {value}
              {isProtected && (
                <Badge variant="outline">
                  <ShieldAlert className="text-destructive" />
                  system
                </Badge>
              )}
              {isDefault && (
                <Badge variant="outline">
                  <UserRound className="text-success" />
                  default
                </Badge>
              )}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: false,
        meta: {
          headerTitle: 'Role',
          skeleton: <Skeleton className="w-28 h-7" />,
        },
      },
      {
        accessorKey: 'slug',
        id: 'slug',
        header: ({ column }) => (
          <DataGridColumnHeader title="Slug" column={column} visibility />
        ),
        size: 125,
        cell: (info) => {
          const value = info.getValue() as string;

          return <Badge variant="outline">{value}</Badge>;
        },
        enableSorting: true,
        enableHiding: true,
        meta: {
          headerTitle: 'slug',
          skeleton: <Skeleton className="w-14 h-7" />,
        },
      },
      {
        accessorKey: 'permissions',
        id: 'permissions',
        header: 'Permissions',
        cell: (info) => {
          const permissions = info.getValue() as { slug: string }[] | undefined;

          if (!permissions || permissions.length === 0) {
            return <span>-</span>;
          }

          const displayedPermissions = permissions.slice(0, 3);
          const extraPermissionsCount =
            permissions.length - displayedPermissions.length;

          return (
            <div className="flex items-center gap-1 flex-wrap">
              {displayedPermissions.map((permission, index) => (
                <Badge key={index} variant="outline">
                  {permission.slug}
                </Badge>
              ))}
              {extraPermissionsCount > 0 && (
                <span className="text-muted-foreground text-xs ms-1">{`${extraPermissionsCount} more`}</span>
              )}
            </div>
          );
        },
        minSize: 350,
        enableSorting: false,
        enableHiding: true,
        meta: {
          headerTitle: 'Permissions',
          skeleton: <Skeleton className="w-44 h-7" />,
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              mode="icon"
              onClick={() => {
                setEditRole(row.original);
                setEditDialogOpen(true);
              }}
              title="Voir le role"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              mode="icon"
              onClick={() => {
                setEditRole(row.original);
                setEditDialogOpen(true);
              }}
              title="Modifier"
            >
              <SquarePen className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              mode="icon"
              disabled={row.original.isProtected}
              onClick={() => {
                setDeleteRole(row.original);
                setDeleteDialogOpen(true);
              }}
              title="Supprimer"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ),
        size: 75,
        enableSorting: false,
        enableResizing: false,
        meta: {
          skeleton: <Skeleton className="size-5" />,
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data: (data?.data || []).filter((role) => {
      if (typeFilter === 'all') return true;
      if (typeFilter === 'default') return Boolean(role.isDefault);
      if (typeFilter === 'system') return Boolean(role.isProtected);
      return !role.isDefault && !role.isProtected;
    }),
    pageCount: Math.ceil((data?.pagination.total || 0) / pagination.pageSize),
    getRowId: (row: UserRole) => row.id,
    state: {
      pagination,
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
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
    const { table } = useDataGrid();
    const [inputValue, setInputValue] = useState(searchQuery);

    const handleSearch = () => {
      setSearchQuery(inputValue);
      setPagination({ ...pagination, pageIndex: 0 });
    };

    return (
      <CardHeader className="py-3 min-w-0">
        <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold text-foreground leading-0 shrink-0">
            Liste des roles
          </h3>
          <CardToolbar className="flex min-w-0 w-full flex-wrap items-stretch gap-2 sm:w-auto sm:items-center sm:justify-end">
            <div className="relative min-w-0 flex-1 basis-full sm:basis-auto sm:flex-initial sm:min-w-[12rem]">
              <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder={t('datagrid.search.role')}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isLoading}
                className="ps-9 w-full md:w-64"
              />
              {searchQuery.length > 0 && (
                <Button
                  mode="icon"
                  variant="dim"
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery('')}
                >
                  <X />
                </Button>
              )}
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(value as 'all' | 'default' | 'system' | 'custom')
              }
            >
              <SelectTrigger className="w-full min-w-0 sm:w-44">
                <SelectValue placeholder="Filtrer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les roles</SelectItem>
                <SelectItem value="default">Par defaut</SelectItem>
                <SelectItem value="system">Systeme</SelectItem>
                <SelectItem value="custom">Personnalises</SelectItem>
              </SelectContent>
            </Select>
            <DataGridColumnVisibility
              table={table}
              trigger={<Button variant="outline">Colonnes</Button>}
            />
          </CardToolbar>
        </div>
      </CardHeader>
    );
  };

  const selectedRowsCount = Object.keys(rowSelection).length;
  const totalRowsCount = data?.data?.length || 0;

  const BottomActionBar = () => {
    if (selectedRowsCount === 0) return null;

    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300">
        <div className="dark bg-zinc-950 text-white rounded-xl px-2 py-1 shadow-lg border">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium ps-3 pe-1">
              {selectedRowsCount} sur {totalRowsCount} selectionnes
            </span>
            <Separator className="h-10" orientation="vertical" />
            <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
              Effacer la selection
            </Button>
          </div>
        </div>
      </div>
    );
  };

   return (
     <>
       <DataGrid
         table={table}
         recordCount={data?.pagination.total || 0}
         isLoading={isLoading}
         tableLayout={USER_MANAGEMENT_TABLE_LAYOUT}
         tableClassNames={USER_MANAGEMENT_TABLE_CLASSNAMES}
       >
         <Card>
          <DataGridToolbar />
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

      <BottomActionBar />

      <RoleEditDialog
        open={editDialogOpen}
        closeDialog={() => {
          setEditDialogOpen(false);
        }}
        role={editRole}
      />

      {deleteRole && (
        <RoleDeleteDialog
          open={deleteDialogOpen}
          closeDialog={() => setDeleteDialogOpen(false)}
          role={deleteRole}
        />
      )}

      {defaultRole && (
        <RoleDefaultDialog
          open={defaultDialogOpen}
          closeDialog={() => setDefaultDialogOpen(false)}
          role={defaultRole}
        />
      )}
    </>
  );
};

export default RoleList;
