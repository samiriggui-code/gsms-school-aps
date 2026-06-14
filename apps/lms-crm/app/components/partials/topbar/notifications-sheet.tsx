'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { LoaderCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDateFnsLocale } from '@/i18n/date-locale';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/providers/i18n-provider';
import { cn } from '@/lib/utils';
import {
  archiveAllNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type InAppNotificationItem,
} from '@/lib/topbar-api';
import { scopeFromPathname } from '@/lib/notifications-scope';
import type { NotificationsScope } from '@/lib/notifications-scope';
import { resolveNotificationsHubPath } from '@/lib/notifications-hub-path';
import { usePusher } from '@/hooks/use-pusher';

function NotificationRow({
  item,
  onRead,
}: {
  item: InAppNotificationItem;
  onRead: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { languageCode } = useLanguage();
  const timeLabel = formatDistanceToNow(new Date(item.createdAt), {
    addSuffix: true,
    locale: getDateFnsLocale(languageCode),
  });
  const categoryLabel = t(
    `topbar.notifications.categories.${item.category}`,
    item.category,
  );

  const content = (
    <div
      className={cn(
        'flex flex-col gap-1 px-5 py-3 transition-colors hover:bg-muted/40',
        item.unread && 'bg-primary/5',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{item.title}</span>
        <Badge variant="secondary">{categoryLabel}</Badge>
        {item.unread ? (
          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">{item.body}</p>
      <span className="text-xs text-muted-foreground">{timeLabel}</span>
    </div>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        onClick={() => {
          if (item.unread) onRead(item.id);
        }}
        className="block"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="block w-full text-start"
      onClick={() => {
        if (item.unread) onRead(item.id);
      }}
    >
      {content}
    </button>
  );
}

function NotificationsList({
  tab,
  scope,
  onRead,
}: {
  tab: 'all' | 'unread';
  scope: NotificationsScope;
  onRead: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['topbar-notifications', tab, scope],
    queryFn: () => fetchNotifications({ tab, scope, limit: 50 }),
    staleTime: 10_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <LoaderCircleIcon className="size-4 animate-spin" />
        {t('topbar.notifications.loading')}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="px-5 py-16 text-center text-sm text-muted-foreground">
        {t('topbar.notifications.loadError')}
      </p>
    );
  }

  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <p className="px-5 py-16 text-center text-sm text-muted-foreground">
        {tab === 'unread'
          ? t('topbar.notifications.emptyUnread')
          : t('topbar.notifications.empty')}
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {items.map((item) => (
        <NotificationRow key={item.id} item={item} onRead={onRead} />
      ))}
    </div>
  );
}

export function NotificationsSheet({ trigger }: { trigger: ReactNode }) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const pathname = usePathname();
  const scope = scopeFromPathname(pathname);
  const viewAllHref = resolveNotificationsHubPath(pathname);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  usePusher(session?.user?.id, () => {
    void queryClient.invalidateQueries({ queryKey: ['topbar-notifications'] });
    void queryClient.invalidateQueries({ queryKey: ['topbar-summary'] });
  });

  useEffect(() => {
    if (open) {
      void queryClient.invalidateQueries({ queryKey: ['topbar-notifications'] });
    }
  }, [open, queryClient]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['topbar-notifications'] });
    queryClient.invalidateQueries({ queryKey: ['topbar-summary'] });
  };

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidate,
  });

  const readAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(scope),
    onSuccess: () => {
      invalidate();
      toast.success(t('topbar.notifications.readAllSuccess'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveAllMutation = useMutation({
    mutationFn: () => archiveAllNotifications(scope),
    onSuccess: () => {
      invalidate();
      toast.success(t('topbar.notifications.archivedSuccess'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="p-0 gap-0 sm:w-[500px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 sm:max-w-none [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="mb-0">
          <SheetTitle className="p-3">{t('topbar.notifications.title')}</SheetTitle>
        </SheetHeader>
        <SheetBody className="p-0">
          <ScrollArea className="h-[calc(100vh-10.5rem)]">
            <Tabs defaultValue="all" className="w-full">
              <TabsList variant="line" className="w-full px-5 mb-2">
                <TabsTrigger value="all">{t('topbar.notifications.tabAll')}</TabsTrigger>
                <TabsTrigger value="unread">{t('topbar.notifications.tabUnread')}</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-0">
                <NotificationsList
                  tab="all"
                  scope={scope}
                  onRead={(id) => readMutation.mutate(id)}
                />
              </TabsContent>
              <TabsContent value="unread" className="mt-0">
                <NotificationsList
                  tab="unread"
                  scope={scope}
                  onRead={(id) => readMutation.mutate(id)}
                />
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </SheetBody>
        <SheetFooter className="border-t border-border p-5 flex flex-col gap-2.5">
          <Button variant="mono" className="w-full" asChild>
            <Link href={viewAllHref} onClick={() => setOpen(false)}>
              {t('topbar.notifications.viewAll')}
            </Link>
          </Button>
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              variant="outline"
              disabled={archiveAllMutation.isPending}
              onClick={() => archiveAllMutation.mutate()}
            >
              {t('topbar.notifications.archiveAll')}
            </Button>
            <Button
              variant="outline"
              disabled={readAllMutation.isPending}
              onClick={() => readAllMutation.mutate()}
            >
              {t('topbar.notifications.markAllRead')}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
