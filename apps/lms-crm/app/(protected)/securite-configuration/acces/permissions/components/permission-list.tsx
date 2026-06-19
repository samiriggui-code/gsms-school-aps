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
import { Pencil, Search, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
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
import { UserPermission, UserRole } from '@/app/models/user';
import { useSchoolRoleSelectQuery } from '../../roles/hooks/use-role-select-query';
import {
  USER_MANAGEMENT_TABLE_CLASSNAMES,
  USER_MANAGEMENT_TABLE_LAYOUT,
} from '../../../components/datagrid-standards';
import { PermissionRolesCell } from './permission-roles-cell';
import { PermissionDetailSheet } from './permission-detail-sheet';

type PermissionRow = UserPermission & { domain?: string; roles?: UserRole[] };

const PermissionList = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'slug', desc: false },
  ]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editPermission, setEditPermission] = useState<PermissionRow | null>(null);

  const { data: roleList } = useSchoolRoleSelectQuery();

  const fetchPermissions = async ({
    pageIndex,
    pageSize,
    sorting,
    searchQuery,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<PermissionRow>> => {
    const sortField = sorting?.[0]?.id || 'slug';
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';

    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      ...(sortField ? { sort: sortField, dir: sortDirection } : {}),
      ...(searchQuery ? { query: searchQuery } : {}),
      ...(selectedRole && selectedRole !== 'all'
        ? { roleId: selectedRole }
        : {}),
    });

    const response = await apiFetch(
      `/api/sections/securite-configuration/acces/permissions?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(
        'Impossible de charger le catalogue permissions. Réessayez dans un instant.',
      );
    }

    return response.json();
  };

  const { data, isLoading } = useQuery({
    queryKey: [
      'user-permissions',
      pagination,
      sorting,
      searchQuery,
      selectedRole,
    ],
    queryFn: () =>
      fetchPermissions({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        filters: [
          ...(selectedRole ? [{ id: 'role', value: selectedRole }] : []),
        ],
        searchQuery,
      }),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const handleRoleSelection = (roleId: string) => {
    setSelectedRole(roleId);
    setPagination({ ...pagination, pageIndex: 0 });
  };

  const openEdit = useCallback((permission: PermissionRow) => {
    setEditPermission(permission);
    setEditOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<PermissionRow>[]>(
    () => [
      {
        id: 'domain',
        accessorKey: 'domain',
        header: ({ column }) => (
          <DataGridColumnHeader title="Domaine" column={column} />
        ),
        cell: (info) => {
          const value = (info.getValue() as string) || '—';
          return (
            <Badge variant="outline" className="font-normal">
              {value}
            </Badge>
          );
        },
        size: 140,
        enableSorting: true,
        meta: {
          headerTitle: 'Domaine',
          skeleton: <Skeleton className="w-24 h-8" />,
        },
      },
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader title="Permission" column={column} />
        ),
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">{getValue() as string}</span>
        ),
        size: 200,
        enableSorting: true,
        enableHiding: false,
        meta: {
          headerTitle: 'Permission',
          skeleton: <Skeleton className="w-28 h-8" />,
        },
      },
      {
        id: 'slug',
        accessorKey: 'slug',
        header: ({ column }) => (
          <DataGridColumnHeader title="Slug" column={column} />
        ),
        cell: (info) => {
          const value = info.getValue() as string;
          return (
            <Badge variant="secondary" className="font-mono text-xs">
              {value}
            </Badge>
          );
        },
        size: 180,
        enableSorting: true,
        enableHiding: false,
        meta: {
          headerTitle: 'Slug',
          skeleton: <Skeleton className="w-32 h-8" />,
        },
      },
      {
        id: 'description',
        accessorKey: 'description',
        header: ({ column }) => (
          <DataGridColumnHeader title="Description" column={column} />
        ),
        cell: (info) => {
          const value = info.getValue() as string | null;
          return <div className="truncate max-w-md">{value || '—'}</div>;
        },
        size: 280,
        enableSorting: false,
        meta: {
          headerTitle: 'Description',
          skeleton: <Skeleton className="w-40 h-8" />,
        },
      },
      {
        id: 'roles',
        header: 'Rôles',
        cell: ({ row }) => <PermissionRolesCell permission={row.original} />,
        size: 180,
        maxSize: 220,
        enableSorting: false,
        meta: {
          headerTitle: 'Rôles',
          skeleton: <Skeleton className="w-64 h-16" />,
        },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataGridColumnHeader title="Créé le" column={column} />
        ),
        cell: (info) => {
          const value = info.getValue() as string;
          return new Date(value).toLocaleString('fr-FR');
        },
        enableSorting: true,
        meta: {
          headerTitle: 'Créé le',
          skeleton: <Skeleton className="w-20 h-8" />,
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            mode="icon"
            onClick={() => openEdit(row.original)}
            title="Modifier les rôles assignés"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ),
        size: 48,
        enableSorting: false,
        enableHiding: false,
        meta: { skeleton: <Skeleton className="size-5" /> },
      },
    ],
    [openEdit],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );

  const table = useReactTable({
    columns,
    data: data?.data || [],
    pageCount: Math.ceil((data?.pagination.total || 0) / pagination.pageSize),
    getRowId: (row: PermissionRow) => row.id,
    state: {
      pagination,
      sorting,
      columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
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
      <CardHeader className="py-3 min-w-0 space-y-2">
        <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground leading-0 shrink-0">
              Catalogue des permissions
            </h3>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Catalogue lecture seule. Badges = rôles assignés. Crayon pour modifier
              l&apos;assignation dans le panneau latéral.
            </p>
          </div>
          <CardToolbar className="flex min-w-0 w-full flex-wrap items-stretch gap-2 sm:w-auto sm:items-center sm:justify-end">
            <div className="relative min-w-0 flex-1 basis-full sm:basis-auto sm:flex-initial sm:min-w-[12rem]">
              <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Rechercher une permission…"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isLoading}
                className="ps-9 w-full sm:w-64"
              />
              {inputValue.length > 0 && (
                <Button
                  mode="icon"
                  variant="dim"
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={clearSearch}
                >
                  <X />
                </Button>
              )}
            </div>
            <Select
              disabled={isLoading}
              onValueChange={handleRoleSelection}
              value={selectedRole || 'all'}
              defaultValue="all"
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {roleList?.map((role: UserRole) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
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
        tableClassNames={{ ...USER_MANAGEMENT_TABLE_CLASSNAMES, base: 'min-w-[960px]' }}
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

      <PermissionDetailSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        permission={editPermission}
      />
    </>
  );
};

export default PermissionList;
