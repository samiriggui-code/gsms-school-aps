'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import { formatDateTime } from '@/lib/helpers';
import type { InAppNotificationItem } from '@/lib/topbar-api';
import { moduleHrefFromKey, moduleLabelFromKey } from '@/lib/pilotage/modules';
import { cn } from '@/lib/utils';

type Props = {
  alert: InAppNotificationItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkRead?: (id: string) => void;
};

function severityBadge(severity: InAppNotificationItem['severity']) {
  if (severity === 'CRITICAL') return { label: 'Critique', variant: 'destructive' as const };
  if (severity === 'WARNING') return { label: 'Attention', variant: 'warning' as const };
  if (severity === 'INFO') return { label: 'Info', variant: 'secondary' as const };
  return null;
}

export function PilotageAlertDetailSheet({ alert, open, onOpenChange, onMarkRead }: Props) {
  if (!alert) return null;

  const sev = severityBadge(alert.severity);
  const moduleLabel = moduleLabelFromKey(alert.moduleKey);
  const moduleHref = alert.href ?? moduleHrefFromKey(alert.moduleKey);
  const timeAgo = formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: fr });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4 text-start">
          <SheetTitle className="flex items-start gap-2 text-base leading-snug">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            {alert.title}
          </SheetTitle>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary" appearance="light" className="text-[10px] uppercase">
              {alert.category}
            </Badge>
            {sev ? (
              <Badge variant={sev.variant} appearance="light" className="text-[10px] uppercase">
                {sev.label}
              </Badge>
            ) : null}
            {alert.unread ? (
              <Badge variant="primary" appearance="light" className="text-[10px] uppercase">
                Non lue
              </Badge>
            ) : null}
          </div>
        </SheetHeader>

        <SheetBody className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</p>
            <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">{alert.body}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Module</p>
              <p className="font-medium">{moduleLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reçue</p>
              <p className="font-medium">{timeAgo}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(alert.createdAt)}</p>
            </div>
            {alert.eventType ? (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Type événement</p>
                <p className="font-mono text-xs">{alert.eventType}</p>
              </div>
            ) : null}
          </div>
        </SheetBody>

        <SheetFooter className="flex-row gap-2 border-t border-border px-5 py-4">
          {alert.unread && onMarkRead ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onMarkRead(alert.id)}
            >
              Marquer comme lue
            </Button>
          ) : null}
          <Button type="button" size="sm" className={cn('ms-auto')} asChild>
            <Link
              href={moduleHref}
              onClick={() => {
                if (alert.unread && onMarkRead) onMarkRead(alert.id);
                onOpenChange(false);
              }}
            >
              Ouvrir le module
              <ExternalLink className="ms-1 size-3.5" />
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
