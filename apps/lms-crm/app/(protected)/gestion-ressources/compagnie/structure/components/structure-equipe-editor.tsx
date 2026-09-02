'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { isFormateurRole } from '@/lib/rh-agrement';
import {
  fetchStructureStaff,
  STRUCTURE_STAFF_QUERY_KEY,
  automaticPoleLabelForUser,
  schoolServiceLabel,
  type OrgChartUser,
  type SchoolService,
} from './structure-organigramme';
import { getInitials, getAvatarUrl } from '@/lib/helpers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { Avatar, AvatarFallback, AvatarImage, AvatarIndicator, AvatarStatus } from '@repo/ui/avatar';
import { structureLoginEmail, structurePersonName } from './structure-display';

function rowName(u: OrgChartUser): string {
  return structurePersonName(u);
}

type SaveVars = {
  row: OrgChartUser;
  managerUserId?: string | null;
  schoolInternalService?: string | null;
};

async function patchStructure(
  row: OrgChartUser,
  patch: { managerUserId?: string | null; schoolInternalService?: string | null },
) {
  const slug = row.role?.slug || '';
  const body: Record<string, unknown> = {};

  if (!isFormateurRole(slug)) {
    body.managerUserId =
      patch.managerUserId !== undefined
        ? patch.managerUserId
        : row.collaborateurProfile?.managerUserId ?? null;
  }

  body.schoolInternalService =
    patch.schoolInternalService !== undefined
      ? patch.schoolInternalService
      : slug === 'formateur'
        ? row.formateurProfile?.schoolInternalService ?? null
        : row.collaborateurProfile?.schoolInternalService ?? null;

  const res = await apiFetch(
    `/api/sections/gestion-ressources/rh/collaborateurs/${row.id}/structure`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { message?: string }).message || 'Enregistrement impossible');
  }
}

export function StructureEquipeEditor() {
  const queryClient = useQueryClient();
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: STRUCTURE_STAFF_QUERY_KEY,
    queryFn: fetchStructureStaff,
    staleTime: 1000 * 60 * 2,
  });

  const sorted = useMemo(
    () => [...rows].sort((a, b) => rowName(a).localeCompare(rowName(b), 'fr')),
    [rows],
  );

  const mutation = useMutation({
    mutationFn: ({ row, managerUserId, schoolInternalService }: SaveVars) =>
      patchStructure(row, { managerUserId, schoolInternalService }),
    onMutate: ({ row }) => setSavingId(row.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...STRUCTURE_STAFF_QUERY_KEY] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
    onSettled: () => setSavingId(null),
  });

  const managerOptions = useMemo(() => {
    return sorted.map((u) => ({
      id: u.id,
      label: rowName(u),
    }));
  }, [sorted]);

  if (isLoading) {
    return (
      <Card className="border-border/70 shadow-none">
        <CardHeader className="border-b border-border/60 py-4">
          <CardTitle className="text-base">Équipe — N+1 & pôles</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Chargement…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="border-b border-border/60 py-4">
        <CardTitle className="text-base font-semibold">Équipe — N+1 & pôles</CardTitle>
        <p className="text-sm font-normal text-muted-foreground">
          Chaque liste déclenche un enregistrement immédiat.
        </p>
      </CardHeader>
      <CardContent className="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[240px]">Personne</TableHead>
                <TableHead className="min-w-[120px]">Rôle</TableHead>
                <TableHead className="min-w-[200px]">Pôle</TableHead>
                <TableHead className="min-w-[220px]">Responsable (N+1)</TableHead>
                <TableHead className="w-[72px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Aucun collaborateur à afficher. Créez des comptes dans la gestion RH.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((row) => {
                  const slug = row.role?.slug || '';
                  const formateur = isFormateurRole(slug);
                  const mgrId = row.collaborateurProfile?.managerUserId || '';
                  const poleExplicit = formateur
                    ? row.formateurProfile?.schoolInternalService || ''
                    : row.collaborateurProfile?.schoolInternalService || '';
                  const poleValue = poleExplicit || '__default__';
                  const busy = savingId === row.id && mutation.isPending;

                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex min-w-0 max-w-[320px] items-center gap-3 py-0.5">
                          <Avatar className="size-9 shrink-0 border border-border/60">
                            {row.avatar ? (
                              <AvatarImage src={getAvatarUrl(row.avatar)} alt={rowName(row)} />
                            ) : null}
                            <AvatarFallback className="text-xs font-semibold">
                              {getInitials(rowName(row))}
                            </AvatarFallback>
                            <AvatarIndicator className="-end-0.5 -top-0.5">
                              <AvatarStatus
                                variant={row.status === 'ACTIVE' ? 'online' : 'offline'}
                                className="size-2.5"
                              />
                            </AvatarIndicator>
                          </Avatar>
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate font-semibold text-sm text-foreground">
                              {rowName(row)}
                            </span>
                            {structureLoginEmail(row) ? (
                              <span className="truncate text-xs text-muted-foreground">
                                {structureLoginEmail(row)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                          {row.role?.name || slug || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          disabled={busy}
                          value={poleValue}
                          onValueChange={(v) => {
                            mutation.mutate({
                              row,
                              schoolInternalService: v === '__default__' ? null : v,
                            });
                          }}
                        >
                          <SelectTrigger className="h-9 w-full min-w-[180px] max-w-[260px]">
                            <SelectValue>
                              {poleValue === '__default__'
                                ? automaticPoleLabelForUser(row)
                                : schoolServiceLabel(poleExplicit as SchoolService)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__default__">
                              Automatique (déduit du rôle IAM)
                            </SelectItem>
                            <SelectItem value="DIRECTION">Direction de l&apos;école</SelectItem>
                            <SelectItem value="TRAINER_POOL">Équipe formateurs</SelectItem>
                            <SelectItem value="PEDAGOGICAL">Équipe pédagogique</SelectItem>
                            <SelectItem value="HR_ADMIN">RH & administration</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {formateur ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <Select
                            disabled={busy}
                            value={mgrId || '__none__'}
                            onValueChange={(v) => {
                              mutation.mutate({
                                row,
                                managerUserId: v === '__none__' ? null : v,
                              });
                            }}
                          >
                            <SelectTrigger className="h-9 w-full min-w-[200px] max-w-[280px]">
                              <SelectValue placeholder="N+1" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Aucun (racine)</SelectItem>
                              {managerOptions
                                .filter((o) => o.id !== row.id)
                                .map((o) => (
                                  <SelectItem key={o.id} value={o.id}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {busy ? <Loader2 className="mx-auto size-4 animate-spin text-muted-foreground" /> : null}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
