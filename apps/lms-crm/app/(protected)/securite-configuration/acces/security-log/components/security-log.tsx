'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Eye, Filter, Search, Settings2, SquarePen, Trash, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DataGrid, useDataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { USER_MANAGEMENT_TABLE_LAYOUT } from '../../../components/datagrid-standards';

interface IData {
  id: string;
  timestamp: string;
  eventType: string;
  actionTaken: string;
  sourceIp: string;
  performedBy: string;
  severity: string;
}

const SecurityLog = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<IData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'timestamp', desc: true },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Filter by severity
      const matchesSeverity =
        !selectedSeverities?.length ||
        selectedSeverities.includes(item.severity);

      // Filter by search query (case-insensitive)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        item.timestamp.toLowerCase().includes(searchLower) ||
        item.eventType.toLowerCase().includes(searchLower) ||
        item.actionTaken.toLowerCase().includes(searchLower) ||
        item.sourceIp.toLowerCase().includes(searchLower) ||
        item.performedBy.toLowerCase().includes(searchLower);

      return matchesSeverity && matchesSearch;
    });
  }, [searchQuery, selectedSeverities]);

  const severityCounts = useMemo(() => {
    return data.reduce(
      (acc, item) => {
        const severity = item.severity;
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    }, [data]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        const response = await apiFetch('/api/sections/securite-configuration/acces/logs?page=1&limit=200');

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message =
            payload?.message || `Erreur API logs (${response.status})`;
          throw new Error(message);
        }

        const payload = await response.json();
        const logs = Array.isArray(payload?.data) ? payload.data : [];

        const mapped: IData[] = logs.map((log: any) => {
          const event = String(log?.event || 'unknown');
          const normalized = event.toUpperCase();
          const severity =
            normalized.includes('DELETE') || normalized.includes('BLOCK')
              ? 'High'
              : normalized.includes('UPDATE')
                ? 'Medium'
                : 'Low';

          return {
            id: String(log.id),
            timestamp: new Date(log.createdAt).toLocaleString('fr-FR'),
            eventType: event,
            actionTaken: String(log.description || 'Aucune description'),
            sourceIp: String(log.ipAddress || 'unknown'),
            performedBy: String(log.user?.email || log.userId || 'system'),
            severity,
          };
        });

        setData(mapped);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erreur de chargement des logs.';
        setFetchError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogs();
  }, []);

  const handleSeverityChange = (checked: boolean, value: string) => {
    setSelectedSeverities((prev = []) =>
      checked ? [...prev, value] : prev.filter((v) => v !== value),
    );
  };

  const columns = useMemo<ColumnDef<IData>[]>(
    () => [
      {
        accessorKey: 'id',
        accessorFn: (row) => row.id,
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        size: 51,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'timestamp',
        accessorFn: (row) => row.timestamp,
        header: ({ column }) => (
          <DataGridColumnHeader title="Timestamp" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-secondary-foreground font-normal">
            {row.original.timestamp}
          </span>
        ),
        enableSorting: true,
        size: 200,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'eventType',
        accessorFn: (row) => row.eventType,
        header: ({ column }) => (
          <DataGridColumnHeader title="Event Type" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="leading-none font-semibold text-secondary-foreground">
              {row.original.eventType}
            </span>
          </div>
        ),
        enableSorting: true,
        size: 200,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'actionTaken',
        accessorFn: (row) => row.actionTaken,
        header: ({ column }) => (
          <DataGridColumnHeader title="Action Taken" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-secondary-foreground font-normal">
            {row.original.actionTaken}
          </span>
        ),
        enableSorting: true,
        size: 200,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'sourceIp',
        accessorFn: (row) => row.sourceIp,
        header: ({ column }) => (
          <DataGridColumnHeader title="Source IP" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-secondary-foreground font-normal">
            {row.original.sourceIp}
          </span>
        ),
        enableSorting: true,
        size: 130,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'performedBy',
        accessorFn: (row) => row.performedBy,
        header: ({ column }) => (
          <DataGridColumnHeader title="Performed By" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-secondary-foreground font-normal">
            {row.original.performedBy}
          </span>
        ),
        enableSorting: true,
        size: 220,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'severity',
        accessorFn: (row) => row.severity,
        header: ({ column }) => (
          <DataGridColumnHeader title="Severity" column={column} />
        ),
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.severity === 'High'
                ? 'warning'
                : row.original.severity === 'Medium'
                  ? 'primary'
                  : 'success'
            }
            appearance="light"
          >
            {row.original.severity}
          </Badge>
        ),
        enableSorting: true,
        size: 110,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'actions',
        header: () => '',
        cell: () => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" mode="icon" title="Voir">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" mode="icon" title="Modifier">
              <SquarePen className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" mode="icon" title="Supprimer">
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ),
        enableSorting: false,
        size: 110,
        meta: {
          headerClassName: '',
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: IData) => row.id,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const Toolbar = () => {
    const { table } = useDataGrid();

    return (
      <CardToolbar>
        <div className="flex flex-wrap items-center gap-2.5">
          <Label htmlFor="auto-update" className="text-sm">
            Push Alerts
          </Label>
          <Switch size="sm" id="auto-update" defaultChecked />
        </div>
        <DataGridColumnVisibility
          table={table}
          trigger={
            <Button variant="outline">
              <Settings2 />
              Colonnes
            </Button>
          }
        />
      </CardToolbar>
    );
  };

   return (
     <DataGrid
       table={table}
       recordCount={filteredData?.length || 0}
       isLoading={isLoading}
       loadingMessage="Chargement des logs..."
       emptyMessage={fetchError ? `Erreur: ${fetchError}` : 'Aucun log trouve.'}
       tableLayout={USER_MANAGEMENT_TABLE_LAYOUT}
     >
       <Card>
        <CardHeader>
          <CardHeading>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder={t('datagrid.search.log')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 w-40"
                />
                {searchQuery.length > 0 && (
                  <Button
                    mode="icon"
                    variant="ghost"
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchQuery('')}
                  >
                    <X />
                  </Button>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Filter />
                    Severite
                    {selectedSeverities.length > 0 && (
                      <Badge variant="outline">
                        {selectedSeverities.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-3" align="start">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">
                      Filtres
                    </div>
                    <div className="space-y-3">
                      {Object.keys(severityCounts).map((severity) => (
                        <div
                          key={severity}
                          className="flex items-center gap-2.5"
                        >
                          <Checkbox
                            id={severity}
                            checked={selectedSeverities.includes(severity)}
                            onCheckedChange={(checked) =>
                              handleSeverityChange(checked === true, severity)
                            }
                          />
                          <Label
                            htmlFor={severity}
                            className="grow flex items-center justify-between font-normal gap-1.5"
                          >
                            {severity}
                            <span className="text-muted-foreground">
                              {severityCounts[severity]}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeading>
        </CardHeader>
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
  );
};

export { SecurityLog };
