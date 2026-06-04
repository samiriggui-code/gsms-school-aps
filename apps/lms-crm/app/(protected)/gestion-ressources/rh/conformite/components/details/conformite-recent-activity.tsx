'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { History, Settings, Trash2, UserPlus, Wifi } from 'lucide-react';
import { User as Conformite } from '@/app/models/user';
import {
  ConformiteHistoryEntry,
  useConformiteHistory,
} from '../../hooks/use-conformite-history';

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

export function ConformiteRecentActivity({
  conformite,
}: {
  conformite: Conformite;
}) {
  const { entries, summary, isLoading, isError } = useConformiteHistory(
    conformite.id,
    { limit: 3 },
  );

  const createPercent = getPercent(summary.createCount, summary.total);
  const updatePercent = getPercent(summary.updateCount, summary.total);
  const deletePercent = getPercent(summary.deleteCount, summary.total);

  return (
    <Card className="bg-background rounded-md shadow-none border border-border/60">
      <CardContent className="p-0 flex flex-col h-full">
        <h3 className="text-sm font-medium text-foreground py-2.5 ps-2">
          Activites recentes
        </h3>
        <div className="bg-background rounded-md m-1 mt-0 border border-input py-5 px-3.5 flex flex-col justify-between h-full">
          <div className="space-y-6 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center rounded-md bg-background border border-border size-[36px] shrink-0">
                  <div className="flex items-center justify-center bg-background border border-border rounded-md size-[30px]">
                    <History className="w-5 h-5 text-foreground/70" />
                  </div>
                </div>
                <span className="text-2xl leading-[22px] font-semibold">
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
                className="border-border text-foreground/70 font-bold"
              >
                <Wifi className="w-3 h-3 mr-1" />
                Temps reel
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              <div className="flex flex-col gap-3 flex-1">
                <Progress value={createPercent} className="w-full h-1.5 bg-muted/30" />
                <span className="text-[11px] font-medium text-foreground">
                  Creation: {createPercent}%
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <Progress value={updatePercent} className="w-[120px] h-1.5 bg-muted/30" />
                <span className="text-[11px] font-medium text-foreground">
                  Mises a jour: {updatePercent}%
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <Progress value={deletePercent} className="w-[76px] h-1.5 bg-muted/30" />
                <span className="text-[11px] font-medium text-foreground">
                  Supp.: {deletePercent}%
                </span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-[40px] w-[40px] rounded-lg border border-border bg-muted/40 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 rounded bg-muted/40 animate-pulse" />
                      <div className="h-3 w-56 rounded bg-muted/30 animate-pulse" />
                    </div>
                  </div>
                  {item < 2 ? <Separator className="my-3.5" /> : null}
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-4 text-sm text-destructive">
              Impossible de charger les activites recentes.
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-md border border-border bg-muted/10 px-3 py-4 text-sm text-muted-foreground">
              Aucun evenement historise pour le moment.
            </div>
          ) : (
            <div>
              {entries.map((activity: ConformiteHistoryEntry, index: number) => (
                <div key={activity.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center rounded-lg bg-background h-[40px] w-[40px] border border-border shrink-0">
                        {getActionIcon(activity.action)}
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-foreground leading-tight text-left">
                          {activity.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {activity.actor?.name ? ` • ${activity.actor.name}` : ''}
                        </span>
                        <span className="text-xs text-muted-foreground/80">
                          {activity.description}
                        </span>
                      </div>
                    </div>
                  </div>
                  {index < entries.length - 1 ? (
                    <Separator className="my-3.5" />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
