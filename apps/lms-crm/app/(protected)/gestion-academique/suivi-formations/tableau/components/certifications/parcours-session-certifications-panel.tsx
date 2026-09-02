'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { Search, Info } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Alert, AlertDescription, AlertIcon } from '@repo/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { ModuleDataGridShell } from '@/components/common/module-data-grid-shell';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

type AttestationRow = {
  id: string;
  title: string;
  issueDate: string;
  certificateUrl: string | null;
  user: { id: string; name: string | null; email: string };
  formation: { id: string; name: string };
  session: { id: string; dateDisplayLabel: string } | null;
  candidature: { id: string; status: string } | null;
};

type EligibleRow = {
  participantId: string;
  candidatureId: string;
  sessionId: string;
  userName: string | null;
  userEmail: string;
  formationName: string;
  sessionLabel: string;
  suggestedTitle: string;
  hasAttestation: boolean;
  attestationCount: number;
};

export function ParcoursSessionCertificationsPanel({
  sessionId = null,
  embedded = false,
}: {
  sessionId?: string | null;
  embedded?: boolean;
} = {}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const [searchQuery, setSearchQuery] = useState('');
  const [listSearch, setListSearch] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [title, setTitle] = useState('');

  const { data: eligible, isLoading: eligibleLoading } = useQuery({
    queryKey: ['vie-scolaire', 'certifications', 'eligible', sessionId ?? 'all', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '40' });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (sessionId) params.set('sessionId', sessionId);
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/certifications/eligible?${params}`,
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Chargement impossible');
      return (body.data?.items ?? []) as EligibleRow[];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      'vie-scolaire',
      'certifications',
      sessionId ?? 'all',
      pagination.pageIndex,
      pagination.pageSize,
      listSearch,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
        ...(listSearch.trim() ? { q: listSearch.trim() } : {}),
        ...(sessionId ? { sessionId } : {}),
      });
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/certifications?${params}`,
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Chargement impossible');
      return body.data as { items: AttestationRow[]; pagination: { total: number } };
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: selectedParticipantId,
          title: title.trim(),
          ...(sessionId ? { sessionId } : {}),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? body.error ?? 'Création impossible');
      return body.data;
    },
    onSuccess: () => {
      toast.success(t('academic.certificationSaved'));
      setSelectedParticipantId('');
      setTitle('');
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'certifications'] });
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'certifications', 'stats'] });
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'certifications', 'eligible'] });
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'examens', 'stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedEligible = eligible?.find((e) => e.participantId === selectedParticipantId);

  const columns = useMemo<ColumnDef<AttestationRow>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('vieScolaire.certifications.columnAttestation')} column={column} />
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium truncate">{row.original.title}</p>
            {row.original.candidature ? (
              <p className="text-[10px] text-muted-foreground uppercase">{row.original.candidature.status}</p>
            ) : null}
          </div>
        ),
        size: 220,
      },
      {
        id: 'user',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('vieScolaire.common.trainee')} column={column} />
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{row.original.user.name || '—'}</p>
            <p className="text-xs text-muted-foreground truncate">{row.original.user.email}</p>
          </div>
        ),
        size: 180,
      },
      {
        id: 'formation',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('vieScolaire.common.formation')} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.formation.name}</span>
        ),
        size: 160,
      },
      {
        id: 'session',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('vieScolaire.common.session')} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.session?.dateDisplayLabel ?? '—'}
          </span>
        ),
        size: 140,
      },
      {
        accessorKey: 'issueDate',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('vieScolaire.certifications.columnIssued')} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs whitespace-nowrap">{formatDateTime(row.original.issueDate)}</span>
        ),
        size: 130,
      },
      {
        id: 'pdf',
        header: 'PDF',
        cell: ({ row }) =>
          row.original.certificateUrl ? (
            <Badge variant="success" appearance="light" size="sm">
              {t('vieScolaire.certifications.uploaded')}
            </Badge>
          ) : (
            <Badge variant="secondary" appearance="light" size="sm">
              —
            </Badge>
          ),
        size: 80,
      },
    ],
    [t],
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
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>{t('vieScolaire.certifications.deliverTitle')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('vieScolaire.certifications.deliverDesc')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="info" appearance="light">
            <AlertIcon>
              <Info className="size-4" aria-hidden />
            </AlertIcon>
            <AlertDescription>{t('vieScolaire.certifications.autoAttestationAlert')}</AlertDescription>
          </Alert>
          <div className="relative max-w-md">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('vieScolaire.certifications.searchEligible')}
              className="ps-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('vieScolaire.certifications.selectTraineeLabel')}</Label>
              <Select
                value={selectedParticipantId}
                onValueChange={(id) => {
                  setSelectedParticipantId(id);
                  const row = eligible?.find((e) => e.participantId === id);
                  if (row) setTitle(row.suggestedTitle);
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      eligibleLoading ? t('vieScolaire.common.loading') : t('vieScolaire.certifications.selectTraineePlaceholder')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(eligible ?? []).length === 0 ? (
                    <SelectItem value="__none" disabled>
                      {t('vieScolaire.certifications.noEligible')}
                    </SelectItem>
                  ) : (
                    eligible!.map((row) => (
                      <SelectItem key={row.participantId} value={row.participantId}>
                        {row.userName || row.userEmail} — {row.formationName}
                        {row.hasAttestation ? ` ${t('vieScolaire.certifications.existingAttestation')}` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedEligible ? (
                <p className="text-xs text-muted-foreground">
                  Session · {selectedEligible.sessionLabel}
                  {selectedEligible.hasAttestation
                    ? ' · Une attestation existe déjà sur ce dossier'
                    : ''}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="attestation-title">{t('vieScolaire.certifications.titleLabel')}</Label>
              <Input
                id="attestation-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('vieScolaire.certifications.titlePlaceholder')}
              />
            </div>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!selectedParticipantId || !title.trim() || createMutation.isPending}
          >
            {t('vieScolaire.certifications.deliverButton')}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border shadow-none">
        <CardHeader className="space-y-3 py-4">
          <CardTitle className="text-base">{t('vieScolaire.certifications.deliveredListTitle')}</CardTitle>
          <div className="relative max-w-md">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('vieScolaire.certifications.filterDelivered')}
              className="h-9 ps-9"
              value={listSearch}
              onChange={(e) => {
                setListSearch(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <ModuleDataGridShell
            table={table}
            recordCount={data?.pagination.total ?? 0}
            isLoading={isLoading}
            emptyMessage={t('vieScolaire.certifications.emptyDelivered')}
            cardClassName="border-0 shadow-none rounded-none"
          />
        </CardContent>
      </Card>
    </div>
  );
}
