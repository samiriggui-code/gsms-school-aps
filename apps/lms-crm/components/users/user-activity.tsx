'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { History, LogIn, Settings, User as UserIcon, FileText, ShieldAlert, Wifi } from 'lucide-react';

/** Coquille identique à `CollaborateurRecentActivity` — données issues des logs IAM. */
function getRowIcon(event: string) {
  const e = event?.toLowerCase() || '';
  if (e.includes('login')) return <LogIn className="size-5 text-blue-500" />;
  if (e.includes('update')) return <Settings className="size-5 text-amber-500" />;
  if (e.includes('create')) return <UserIcon className="size-5 text-green-500" />;
  if (e.includes('permission') || e.includes('role')) return <ShieldAlert className="size-5 text-purple-500" />;
  return <FileText className="size-5 text-muted-foreground" />;
}

function getPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function summarizeLogs(rows: { event?: string }[]) {
  let createCount = 0;
  let updateCount = 0;
  let deleteCount = 0;
  for (const row of rows) {
    const e = (row.event || '').toLowerCase();
    if (e.includes('delete') || e.includes('remove')) deleteCount++;
    else if (e.includes('create') || e.includes('register') || e.includes('signup'))
      createCount++;
    else updateCount++;
  }
  const total = rows.length;
  return { createCount, updateCount, deleteCount, total };
}

export function UserActivity({ user }: { user: any }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-activity', user?.id],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/securite-configuration/acces/users/${user.id}/logs?limit=20`,
      );
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    },
    enabled: !!user?.id,
  });

  const activities = data?.data || [];
  const summary = useMemo(() => summarizeLogs(activities), [activities]);

  const createPercent = getPercent(summary.createCount, summary.total);
  const updatePercent = getPercent(summary.updateCount, summary.total);
  const deletePercent = getPercent(summary.deleteCount, summary.total);

  return (
    <div className="space-y-5">
      <Card className="min-w-0 bg-background rounded-md border border-border/60 shadow-none">
        <CardContent className="flex h-full min-w-0 flex-col p-0">
          <h3 className="py-2.5 ps-2 text-sm font-medium text-foreground">
            Journal d&apos;activité
          </h3>
          <div className="m-1 mt-0 flex h-full min-w-0 flex-col justify-between rounded-md border border-input bg-background px-3.5 py-5">
            <div className="mb-6 space-y-6">
              <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex size-[36px] shrink-0 items-center justify-center rounded-md border border-border bg-background">
                    <div className="flex size-[30px] items-center justify-center rounded-md border border-border bg-background">
                      <History className="size-5 text-foreground/70" />
                    </div>
                  </div>
                  <span className="min-w-0 text-2xl font-semibold leading-[22px]">
                    {summary.total}
                    <span className="text-2xl font-semibold text-secondary-foreground/30">
                      {' '}
                      événements
                    </span>
                  </span>
                </div>
                <Badge
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-border font-bold text-foreground/70"
                >
                  <Wifi className="mr-1 size-3" />
                  Logs IAM
                </Badge>
              </div>

              <div className="grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-3 sm:items-end sm:gap-3">
                <div className="flex min-w-0 flex-col gap-3">
                  <Progress value={createPercent} className="h-1.5 w-full bg-muted/30" />
                  <span className="text-[11px] font-medium text-foreground">
                    Création : {createPercent}%
                  </span>
                </div>
                <div className="flex min-w-0 flex-col gap-3">
                  <Progress
                    value={updatePercent}
                    className="h-1.5 w-full bg-muted/30 sm:max-w-[120px]"
                  />
                  <span className="text-[11px] font-medium text-foreground">
                    Mises à jour : {updatePercent}%
                  </span>
                </div>
                <div className="flex min-w-0 flex-col gap-3">
                  <Progress
                    value={deletePercent}
                    className="h-1.5 w-full bg-muted/30 sm:max-w-[76px]"
                  />
                  <span className="text-[11px] font-medium text-foreground">
                    Supp. : {deletePercent}%
                  </span>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-10 shrink-0 animate-pulse rounded-lg border border-border bg-muted/40" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-4 max-w-full rounded bg-muted/40 animate-pulse sm:max-w-xs" />
                        <div className="h-3 max-w-full rounded bg-muted/30 animate-pulse sm:max-w-sm" />
                      </div>
                    </div>
                    {item < 2 ? <Separator className="my-3.5" /> : null}
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-4 text-sm text-destructive">
                Impossible de charger les logs.
              </div>
            ) : activities.length === 0 ? (
              <div className="rounded-md border border-border bg-muted/10 px-3 py-4 text-sm text-muted-foreground">
                Aucun événement enregistré pour le moment.
              </div>
            ) : (
              <div className="min-w-0">
                {(activities as any[]).map((activity: any, index: number) => (
                  <div key={activity.id ?? index} className="min-w-0">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                          {getRowIcon(activity.event)}
                        </div>

                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="break-words text-left text-sm font-semibold leading-tight text-foreground">
                            {activity.description || activity.event || 'Événement'}
                          </span>
                          <span className="break-words text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="break-words text-xs text-muted-foreground/80">
                            {(activity.entityType || '—') +
                              ' • ' +
                              String(activity.entityId ?? '').substring(0, 8)}
                            {activity.entityId ? '…' : ''}
                            {' • IP: '}
                            {activity.ipAddress || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {index < activities.length - 1 ? <Separator className="my-3.5" /> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
