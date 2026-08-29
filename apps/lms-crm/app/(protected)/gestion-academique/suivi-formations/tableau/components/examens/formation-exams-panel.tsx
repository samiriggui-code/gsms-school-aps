'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { CalendarDays, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import {
  formationExamStatusBadgeVariant,
  formationExamStatusLabel,
} from '@/lib/vie-scolaire/formation-exam-labels';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ModuleDataGridShell } from '@/components/common/module-data-grid-shell';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { FormationExamApiRow } from '@/lib/vie-scolaire/formation-exam-api-types';
import { FormationExamDetailSheet } from './formation-exam-detail-sheet';
import { FormationExamRowActions } from './formation-exam-row-actions';
import { FormationExamQuickEdit } from './formation-exam-quick-edit';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

export function FormationExamsPanel({
  sessionId = null,
  embedded = false,
}: {
  sessionId?: string | null;
  embedded?: boolean;
} = {}) {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const [listSearch, setListSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetInitialTab, setSheetInitialTab] = useState('documents');
  const [cancelExamId, setCancelExamId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [
      'vie-scolaire',
      'formation-exams',
      sessionId ?? 'all',
      pagination.pageIndex,
      pagination.pageSize,
      listSearch,
      statusFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
        ...(listSearch.trim() ? { q: listSearch.trim() } : {}),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(sessionId ? { sessionId } : {}),
      });
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/formation-exams?${params}`,
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Chargement impossible');
      return body.data as { items: FormationExamApiRow[]; pagination: { total: number } };
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (examId: string) => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/formation-exams/${examId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CANCELLED' }),
        },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Annulation impossible');
      return body.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'formation-exams'] });
      toast.success('Examen annulé');
      setCancelExamId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openDetail = (examId: string, tab = 'documents') => {
    setSelectedExamId(examId);
    setSheetInitialTab(tab);
    setSheetOpen(true);
  };

  const columns = useMemo<ColumnDef<FormationExamApiRow>[]>(
    () => [
      {
        id: 'formation',
        header: ({ column }) => <DataGridColumnHeader title="Formation" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.session.formation?.name ?? '—'}</span>
        ),
        size: 170,
      },
      {
        id: 'session',
        header: ({ column }) => <DataGridColumnHeader title="Session" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.session.dateDisplayLabel}</span>
        ),
        size: 130,
      },
      {
        id: 'scheduledAt',
        header: ({ column }) => <DataGridColumnHeader title="Date examen" column={column} />,
        cell: ({ row }) => (
          <FormationExamQuickEdit
            examId={row.original.id}
            field="scheduledAt"
            value={row.original.scheduledAt}
          />
        ),
        size: 150,
      },
      {
        id: 'examiner',
        header: ({ column }) => <DataGridColumnHeader title="Examinateur" column={column} />,
        cell: ({ row }) => (
          <FormationExamQuickEdit
            examId={row.original.id}
            field="juryPresidentName"
            value={row.original.juryPresidentName}
          />
        ),
        size: 140,
      },
      {
        id: 'venue',
        header: ({ column }) => <DataGridColumnHeader title="Salle" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs">
            {row.original.venueRoom?.name ?? '—'}
            {row.original.venueRoom?.shortCode ? (
              <span className="text-muted-foreground"> ({row.original.venueRoom.shortCode})</span>
            ) : null}
          </span>
        ),
        size: 90,
      },
      {
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Statut" column={column} />,
        cell: ({ row }) => (
          <Badge
            variant={formationExamStatusBadgeVariant(row.original.status)}
            appearance="outline"
            size="sm"
          >
            {formationExamStatusLabel(row.original.status)}
          </Badge>
        ),
        size: 100,
      },
      {
        id: 'candidates',
        header: ({ column }) => <DataGridColumnHeader title="Candidats" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs tabular-nums">
            {row.original.outcomeCounts.passed}/{row.original.participantCount} réussis
          </span>
        ),
        size: 90,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <FormationExamRowActions
            examId={row.original.id}
            status={row.original.status}
            onView={() => openDetail(row.original.id, 'documents')}
            onEdit={() => openDetail(row.original.id, 'jury')}
            onCancel={() => setCancelExamId(row.original.id)}
          />
        ),
        size: 140,
        enableSorting: false,
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data: data?.items ?? [],
    pageCount: Math.max(1, Math.ceil((data?.pagination.total ?? 0) / pagination.pageSize)),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    getRowId: (r) => r.id,
  });

  return (
    <>
      <Card className="border-border shadow-none">
        <CardHeader className="space-y-3 py-4">
          <div className="flex items-start gap-2">
            <CalendarDays className="size-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <CardTitle className="text-base">Examens planifiés</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Un examen est créé pour chaque session avec épreuve finale. Cliquez une ligne pour la fiche
                complète, ou utilisez les raccourcis pour éditer la date, l&apos;examinateur et les PDF.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher formation, salle…"
                className="h-9 ps-9"
                value={listSearch}
                onChange={(e) => {
                  setListSearch(e.target.value);
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
              <SelectTrigger className="h-9 w-full sm:w-44">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {STATUS_OPTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {formationExamStatusLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <ModuleDataGridShell
            table={table}
            recordCount={data?.pagination.total ?? 0}
            isLoading={isLoading}
            emptyMessage="Aucun examen planifié. Créez une session avec épreuve finale et date d'examen."
            cardClassName="border-0 shadow-none rounded-none"
            onRowClick={(row) => openDetail(row.id, 'documents')}
          />
        </CardContent>
      </Card>

      <FormationExamDetailSheet
        examId={selectedExamId}
        open={sheetOpen}
        initialTab={sheetInitialTab}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedExamId(null);
        }}
      />

      <AlertDialog open={Boolean(cancelExamId)} onOpenChange={(open) => !open && setCancelExamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cet examen ?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;examen sera marqué comme annulé. Les documents PDF restent accessibles depuis la fiche.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancelExamId && cancelMutation.mutate(cancelExamId)}
            >
              Annuler l&apos;examen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
