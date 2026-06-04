'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { History, Settings, Trash2, UserPlus, Wifi } from 'lucide-react';
import { User as Collaborateur } from '@/app/models/user';
import { useCollaborateurHistory } from '../../../hooks/use-collaborateur-history';

function getActionIcon(action: string) {
  switch (action) {
    case 'create':
      return <UserPlus className="size-5 text-green-500" />;
    case 'update':
      return <Settings className="size-5 text-orange-500" />;
    case 'delete':
      return <Trash2 className="size-5 text-red-500" />;
    default:
      return <History className="size-5 text-muted-foreground" />;
  }
}

function getPercent(value: number, total: number) {
  if (!total) {
    return 0;
  }
  return Math.round((value / total) * 100);
}

/**
 * Même squelette que les autres onglets fiche (`space-y-5`, cartes pleine largeur du volet droit),
 * bloc synthèse façon `CollaborateurAccessStats` puis carte détail comme les autres `Card` RH.
 */
export function ActivityPage({ collaborateur }: { collaborateur: Collaborateur }) {
  const { entries, summary, isLoading, isError } = useCollaborateurHistory(
    collaborateur.id,
    { limit: 20 },
  );

  const mixTotal =
    summary.createCount + summary.updateCount + summary.deleteCount;
  const createPercent = getPercent(summary.createCount, mixTotal);
  const updatePercent = getPercent(summary.updateCount, mixTotal);
  const deletePercent = getPercent(summary.deleteCount, mixTotal);

  return (
    <div className="min-w-0 space-y-5">
      <Card className="rounded-md border-0 bg-accent/70 p-1 shadow-none">
        <CardContent className="rounded-md border border-border bg-background p-0">
          <div className="flex min-w-0 flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                <div className="flex size-[36px] shrink-0 items-center justify-center rounded-md border border-border bg-background">
                  <div className="flex size-[30px] items-center justify-center rounded-md border border-border bg-background">
                    <History className="size-5 text-foreground/70" />
                  </div>
                </div>
                <span className="min-w-0 text-2xl font-semibold leading-[22px]">
                  {summary.total}
                  <span className="text-2xl font-semibold text-secondary-foreground/30">
                    {' '}
                    actions
                  </span>
                </span>
              </div>
              <Badge
                variant="outline"
                size="sm"
                className="w-fit shrink-0 border-border font-bold text-foreground/70"
              >
                <Wifi className="mr-1 size-3" />
                Temps réel
              </Badge>
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-4">
              <div className="flex min-w-0 flex-col gap-3">
                <Progress value={createPercent} className="h-1.5 w-full max-w-full bg-muted/30" />
                <span className="text-[11px] font-medium text-foreground">
                  Création : {createPercent}%
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-3 sm:border-s sm:border-border sm:ps-4">
                <Progress value={updatePercent} className="h-1.5 w-full max-w-full bg-muted/30" />
                <span className="text-[11px] font-medium text-foreground">
                  Mises à jour : {updatePercent}%
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-3 sm:border-s sm:border-border sm:ps-4">
                <Progress value={deletePercent} className="h-1.5 w-full max-w-full bg-muted/30" />
                <span className="text-[11px] font-medium text-foreground">
                  Supp. : {deletePercent}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 border border-border/60 bg-background shadow-none">
        <CardHeader className="border-b border-border/50 bg-background px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
          <CardTitle className="flex flex-wrap items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-foreground">
            <div className="rounded-lg border border-border bg-background p-2">
              <History className="size-4 text-foreground/70" />
            </div>
            Journal d&apos;activité
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 p-4 sm:p-6">
          <div className="mb-4 flex min-w-0 items-center gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-foreground/30" />
            <h4 className="min-w-0 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Derniers événements (20 max.)
            </h4>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="space-y-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="size-10 shrink-0 animate-pulse rounded-lg border border-border bg-muted/40" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 max-w-full rounded bg-muted/40 animate-pulse" />
                      <div className="h-3 max-w-full rounded bg-muted/30 animate-pulse" />
                    </div>
                  </div>
                  {item < 2 ? <Separator className="my-3.5" /> : null}
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-4 text-sm text-destructive">
              Impossible de charger l&apos;historique.
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-md border border-border bg-muted/10 px-3 py-4 text-sm text-muted-foreground">
              Aucun événement historisé pour le moment.
            </div>
          ) : (
            <div className="min-w-0">
              {entries.map((activity, index) => (
                <div key={activity.id} className="min-w-0">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                        {getActionIcon(activity.action)}
                      </div>

                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="break-words text-left text-sm font-semibold leading-tight text-foreground">
                          {activity.label}
                        </span>
                        <span className="break-words text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {activity.actor?.name ? ` • ${activity.actor.name}` : ''}
                        </span>
                        <span className="break-words text-xs text-muted-foreground/80">
                          {activity.description}
                        </span>
                      </div>
                    </div>
                  </div>
                  {index < entries.length - 1 ? <Separator className="my-3.5" /> : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
