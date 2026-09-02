'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { apiFetch } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/card';
import { Skeleton } from '@repo/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/table';

type LogActor = {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
};

type SystemLogRow = {
  id: string;
  userId: string;
  createdAt: string;
  entityId: string | null;
  entityType: string | null;
  event: string | null;
  description: string | null;
  ipAddress: string | null;
  meta: string | null;
  user: LogActor;
};

type LogsApiResponse = {
  data: SystemLogRow[];
  pagination: { total: number; page: number; limit: number };
};

export function UserIamSystemLogs({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const limit = 50;

  const query = useQuery({
    queryKey: ['user-activity-logs', userId, page, limit],
    queryFn: async (): Promise<LogsApiResponse> => {
      const res = await apiFetch(
        `/api/sections/securite-configuration/acces/users/${userId}/logs?page=${page}&limit=${limit}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          typeof body.message === 'string' ? body.message : 'Erreur chargement',
        );
      }
      return res.json() as Promise<LogsApiResponse>;
    },
    staleTime: 30_000,
  });

  const logs = query.data?.data ?? [];
  const pagination = query.data?.pagination;
  const totalPages =
    pagination && pagination.limit > 0
      ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
      : 1;

  if (query.isPending) {
    return (
      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 max-w-md" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (query.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Impossible de charger les journaux</AlertTitle>
        <AlertDescription>{(query.error as Error).message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Journal système</CardTitle>
        <CardDescription>
          Entrées <code className="text-xs">SystemLog</code> liées à{' '}
          <code className="text-xs">userId</code> /{' '}
          <code className="text-xs">entityId</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucune entrée de journal pour cet utilisateur.
          </p>
        ) : (
          <div className="w-full min-w-0 -mx-1 sm:mx-0">
            <div className="overflow-x-auto rounded-md border">
              <Table className="min-w-[720px]">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[180px] whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Événement</TableHead>
                    <TableHead className="min-w-[200px]">Description</TableHead>
                    <TableHead className="whitespace-nowrap">Type d&apos;entité</TableHead>
                    <TableHead className="w-[200px] min-w-[140px]">Acteur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(row.createdAt), 'PPp', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {row.event ?
                          <Badge variant="secondary" className="max-w-[200px] truncate">
                            {row.event}
                          </Badge>
                        : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="max-w-md text-sm break-words align-top">
                        {row.description ?? '—'}
                      </TableCell>
                      <TableCell className="break-words text-sm align-top">
                        {row.entityType ?? '—'}
                      </TableCell>
                      <TableCell className="break-all text-sm align-top">
                        {row.user.name ?? row.user.email}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {pagination && totalPages > 1 ?
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
            <p className="text-muted-foreground text-sm">
              {pagination.total} entrée{pagination.total === 1 ? '' : 's'} · page{' '}
              {page} / {totalPages}
            </p>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => (p >= totalPages ? p : p + 1))}
              >
                Suivant
              </Button>
            </div>
          </div>
        : null}
      </CardContent>
    </Card>
  );
}
