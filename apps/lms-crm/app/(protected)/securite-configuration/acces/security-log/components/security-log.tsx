'use client';



import { useTranslation } from '@/hooks/useTranslation';

import { useCallback, useEffect, useMemo, useState } from 'react';

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

import { Search, Settings2, X } from 'lucide-react';

import { toast } from 'sonner';

import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';

import { Badge } from '@repo/ui/badge';

import { Button } from '@repo/ui/button';

import {

  Card,

  CardFooter,

  CardHeader,

  CardHeading,

  CardTable,

  CardToolbar,

} from '@repo/ui/card';

import { DataGrid, useDataGrid } from '@repo/ui/data-grid';

import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';

import { DataGridColumnVisibility } from '@repo/ui/data-grid-column-visibility';

import { DataGridPagination } from '@repo/ui/data-grid-pagination';

import {

  DataGridTable,

  DataGridTableRowSelect,

  DataGridTableRowSelectAll,

} from '@repo/ui/data-grid-table';

import { Input } from '@repo/ui/input';

import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';

import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs';

import { USER_MANAGEMENT_TABLE_LAYOUT } from '../../../components/datagrid-standards';



type LogSeverity = 'Low' | 'Medium' | 'High';

type SeverityTab = 'all' | LogSeverity;

type CategoryTab = 'all' | 'connexion' | 'iam' | 'conformite' | 'documents';



interface IData {

  id: string;

  timestamp: string;

  eventType: string;

  actionTaken: string;

  sourceIp: string;

  performedBy: string;

  severity: LogSeverity;

  category: CategoryTab | 'other';

}



const CATEGORY_TABS: { id: CategoryTab; label: string }[] = [

  { id: 'all', label: 'Tous' },

  { id: 'connexion', label: 'Connexion' },

  { id: 'iam', label: 'IAM' },

  { id: 'conformite', label: 'Conformité' },

  { id: 'documents', label: 'Documents' },

];



const SEVERITY_TABS: { id: SeverityTab; label: string }[] = [

  { id: 'all', label: 'Tous' },

  { id: 'Low', label: 'Faible' },

  { id: 'Medium', label: 'Moyen' },

  { id: 'High', label: 'Élevé' },

];



function severityLabel(severity: LogSeverity): string {

  switch (severity) {

    case 'High':

      return 'Élevé';

    case 'Medium':

      return 'Moyen';

    default:

      return 'Faible';

  }

}



function eventTypeLabel(event: string): string {

  switch (event) {

    case 'auth.sign_in':

      return 'Connexion';

    case 'auth.sign_in_failed':

      return 'Échec connexion';

    case 'auth.sign_out':

      return 'Déconnexion';

    case 'create':

      return 'Création';

    case 'update':

      return 'Modification';

    case 'delete':

      return 'Suppression';

    case 'SEED':

      return 'Données seed';

    default:

      return event;

  }

}



function resolveSeverity(event: string): LogSeverity {

  const normalized = event.toLowerCase();

  if (

    normalized === 'auth.sign_in_failed' ||

    normalized.includes('delete') ||

    normalized.includes('block')

  ) {

    return 'High';

  }

  if (normalized.includes('update') || normalized === 'auth.sign_out') {

    return 'Medium';

  }

  return 'Low';

}



interface LogsApiPayload {

  logs: Array<Record<string, unknown>>;

  pagination: { total: number; page: number; limit: number };

}



const SecurityLog = () => {

  const { t } = useTranslation();

  const [data, setData] = useState<IData[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);

  const [sorting, setSorting] = useState<SortingState>([

    { id: 'timestamp', desc: true },

  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const [severityTab, setSeverityTab] = useState<SeverityTab>('all');

  const [categoryTab, setCategoryTab] = useState<CategoryTab>('all');



  const mapLog = useCallback((log: Record<string, unknown>): IData => {

    const event = String(log?.event || 'unknown');

    const user = log.user as { email?: string } | undefined;

    const category = String(log?.category || 'other') as IData['category'];



    return {

      id: String(log.id),

      timestamp: new Date(String(log.createdAt)).toLocaleString('fr-FR'),

      eventType: eventTypeLabel(event),

      actionTaken: String(log.description || 'Aucune description'),

      sourceIp: String(log.ipAddress || '—'),

      performedBy: String(user?.email || log.userId || 'système'),

      severity: resolveSeverity(event),

      category,

    };

  }, []);



  const loadLogs = useCallback(async (category: CategoryTab) => {

    try {

      setIsLoading(true);

      setFetchError(null);



      const categoryQuery =

        category !== 'all' ? `&category=${encodeURIComponent(category)}` : '';

      const response = await apiFetch(

        `/api/sections/securite-configuration/acces/logs?page=1&limit=200${categoryQuery}`,

      );



      if (!response.ok) {

        const payload = await response.json().catch(() => ({}));

        const message =

          (payload as { error?: { message?: string } })?.error?.message ||

          (payload as { message?: string })?.message ||

          `Erreur API logs (${response.status})`;

        throw new Error(message);

      }



      const payload = await response.json();

      const apiData = unwrapSectionApiData<LogsApiPayload>(payload);

      const logs = Array.isArray(apiData?.logs) ? apiData.logs : [];



      setData(logs.map(mapLog));

    } catch (error) {

      const message =

        error instanceof Error ? error.message : 'Erreur de chargement des logs.';

      setFetchError(message);

      toast.error(message);

    } finally {

      setIsLoading(false);

    }

  }, [mapLog]);



  useEffect(() => {

    loadLogs(categoryTab);

  }, [categoryTab, loadLogs]);



  const severityCounts = useMemo(() => {

    const counts: Record<SeverityTab, number> = {

      all: data.length,

      Low: 0,

      Medium: 0,

      High: 0,

    };

    data.forEach((item) => {

      counts[item.severity] += 1;

    });

    return counts;

  }, [data]);



  const filteredData = useMemo(() => {

    return data.filter((item) => {

      const matchesSeverity = severityTab === 'all' || item.severity === severityTab;



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

  }, [data, searchQuery, severityTab]);



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

      },

      {

        id: 'timestamp',

        accessorFn: (row) => row.timestamp,

        header: ({ column }) => (

          <DataGridColumnHeader title="Horodatage" column={column} />

        ),

        cell: ({ row }) => (

          <span className="font-normal text-secondary-foreground">

            {row.original.timestamp}

          </span>

        ),

        enableSorting: true,

        size: 180,

      },

      {

        id: 'eventType',

        accessorFn: (row) => row.eventType,

        header: ({ column }) => (

          <DataGridColumnHeader title="Événement" column={column} />

        ),

        cell: ({ row }) => (

          <span className="font-semibold leading-none text-secondary-foreground">

            {row.original.eventType}

          </span>

        ),

        enableSorting: true,

        size: 140,

      },

      {

        id: 'actionTaken',

        accessorFn: (row) => row.actionTaken,

        header: ({ column }) => (

          <DataGridColumnHeader title="Action" column={column} />

        ),

        cell: ({ row }) => (

          <span className="font-normal text-secondary-foreground">

            {row.original.actionTaken}

          </span>

        ),

        enableSorting: true,

        size: 260,

      },

      {

        id: 'sourceIp',

        accessorFn: (row) => row.sourceIp,

        header: ({ column }) => (

          <DataGridColumnHeader title="IP source" column={column} />

        ),

        cell: ({ row }) => (

          <span className="font-mono text-xs text-secondary-foreground">

            {row.original.sourceIp}

          </span>

        ),

        enableSorting: true,

        size: 130,

      },

      {

        id: 'performedBy',

        accessorFn: (row) => row.performedBy,

        header: ({ column }) => (

          <DataGridColumnHeader title="Effectué par" column={column} />

        ),

        cell: ({ row }) => (

          <span className="font-normal text-secondary-foreground">

            {row.original.performedBy}

          </span>

        ),

        enableSorting: true,

        size: 200,

      },

      {

        id: 'severity',

        accessorFn: (row) => row.severity,

        header: ({ column }) => (

          <DataGridColumnHeader title="Sévérité" column={column} />

        ),

        cell: ({ row }) => (

          <Badge

            variant={

              row.original.severity === 'High'

                ? 'destructive'

                : row.original.severity === 'Medium'

                  ? 'warning'

                  : 'success'

            }

            appearance="light"

          >

            {severityLabel(row.original.severity)}

          </Badge>

        ),

        enableSorting: true,

        size: 100,

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



  const ColumnVisibilityToolbar = () => {

    const { table } = useDataGrid();

    return (

      <DataGridColumnVisibility

        table={table}

        trigger={

          <Button variant="outline" size="sm">

            <Settings2 className="size-4" />

            Colonnes

          </Button>

        }

      />

    );

  };



  return (

    <DataGrid

      table={table}

      recordCount={filteredData?.length || 0}

      isLoading={isLoading}

      loadingMessage="Chargement des logs…"

      emptyMessage={fetchError ? `Erreur : ${fetchError}` : 'Aucun log trouvé.'}

      tableLayout={USER_MANAGEMENT_TABLE_LAYOUT}

    >

      <Card>

        <CardHeader className="space-y-4 py-4">

          <CardHeading>

            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">

              <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">

                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input

                  placeholder={t('datagrid.search.log')}

                  value={searchQuery}

                  onChange={(e) => setSearchQuery(e.target.value)}

                  className="w-full ps-9"

                />

                {searchQuery.length > 0 ? (

                  <Button

                    mode="icon"

                    variant="ghost"

                    className="absolute end-1.5 top-1/2 h-6 w-6 -translate-y-1/2"

                    onClick={() => setSearchQuery('')}

                  >

                    <X />

                  </Button>

                ) : null}

              </div>

              <CardToolbar className="p-0">

                <ColumnVisibilityToolbar />

              </CardToolbar>

            </div>

          </CardHeading>



          <Tabs

            value={categoryTab}

            onValueChange={(value) => {

              setCategoryTab(value as CategoryTab);

              setPagination((prev) => ({ ...prev, pageIndex: 0 }));

            }}

            className="w-full"

          >

            <TabsList

              variant="line"

              className="inline-flex h-auto w-full max-w-full flex-wrap justify-start gap-1 border-b border-border pb-0"

            >

              {CATEGORY_TABS.map((tab) => (

                <TabsTrigger

                  key={tab.id}

                  value={tab.id}

                  className="gap-2 data-[state=active]:border-primary"

                >

                  {tab.label}

                </TabsTrigger>

              ))}

            </TabsList>

          </Tabs>



          <Tabs

            value={severityTab}

            onValueChange={(value) => {

              setSeverityTab(value as SeverityTab);

              setPagination((prev) => ({ ...prev, pageIndex: 0 }));

            }}

            className="w-full"

          >

            <TabsList

              variant="line"

              className="inline-flex h-auto w-full max-w-full flex-wrap justify-start gap-1 border-b border-border pb-0"

            >

              {SEVERITY_TABS.map((tab) => (

                <TabsTrigger

                  key={tab.id}

                  value={tab.id}

                  className="gap-2 data-[state=active]:border-primary"

                >

                  {tab.label}

                  <Badge

                    variant={severityTab === tab.id ? 'primary' : 'outline'}

                    appearance="light"

                    className="min-w-[1.5rem] justify-center px-1.5 text-[10px]"

                  >

                    {severityCounts[tab.id]}

                  </Badge>

                </TabsTrigger>

              ))}

            </TabsList>

          </Tabs>

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


