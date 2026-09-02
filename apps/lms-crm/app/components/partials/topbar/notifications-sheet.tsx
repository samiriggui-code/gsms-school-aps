'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Image as ImageIcon, Archive, CheckCheck, LoaderCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@repo/ui/button';
import { Card } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { ScrollArea } from '@repo/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@repo/ui/sheet';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
} from '@repo/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { getDateFnsLocale } from '@/i18n/date-locale';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/providers/i18n-provider';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/helpers';
import {
  notificationShowsUserPresence,
  resolveNotificationImageUrl,
} from '@/lib/notification-avatar';
import {
  TOPBAR_SHEET_ACTION_ROW_CLASS,
  TOPBAR_SHEET_BODY_CLASS,
  TOPBAR_SHEET_CONTENT_CLASS,
  TOPBAR_SHEET_FOOTER_CLASS,
  TOPBAR_SHEET_HEADER_CLASS,
  TOPBAR_SHEET_ROW_PADDING,
  TOPBAR_SHEET_SCROLL_CLASS,
  TOPBAR_SHEET_TABS_LIST_CLASS,
  TOPBAR_SHEET_TABS_TRIGGER_CLASS,
} from '@/lib/topbar-sheet-layout';
import {
  archiveAllNotifications,
  fetchNotifications,
  fetchUsersPresence,
  markAllNotificationsRead,
  markNotificationRead,
  replyToNotification,
  respondChatInvitation,
  type InAppNotificationItem,
} from '@/lib/topbar-api';
import { scopeFromPathname, type NotificationsScope } from '@/lib/notifications-scope';
import { usePusher } from '@/hooks/use-pusher';

type NotificationTab = 'all' | 'unread' | 'team' | 'following';

function NotificationActorAvatar({
  item,
  presence,
}: {
  item: InAppNotificationItem;
  presence?: import('@/components/common/user-presence-ui').UserPresenceStatus;
}) {
  const label = item.actorName?.trim() || item.title?.trim() || '?';
  const imageUrl = resolveNotificationImageUrl(item);
  const showPresence = notificationShowsUserPresence(item);

  return (
    <Avatar className="size-9 shrink-0">
      <AvatarImage src={imageUrl} alt={label} className="object-cover" />
      <AvatarFallback className="text-xs">{getInitials(label)}</AvatarFallback>
      {showPresence && item.actorId ? (
        <AvatarIndicator className="-end-1.5 -bottom-1.5">
          <AvatarStatus
            variant={
              presence === 'offline'
                ? 'offline'
                : presence === 'busy'
                  ? 'busy'
                  : presence === 'away'
                    ? 'away'
                    : 'online'
            }
            className="size-2.5"
          />
        </AvatarIndicator>
      ) : null}
    </Avatar>
  );
}

function MentionReplyBox({
  item,
  onReplied,
}: {
  item: InAppNotificationItem;
  onReplied: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');

  const replyMutation = useMutation({
    mutationFn: (text: string) => replyToNotification(item.id, text),
    onSuccess: () => {
      setDraft('');
      onReplied();
      toast.success(t('topbar.notifications.replySent'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="rounded-lg border-0 bg-muted/70 p-3 shadow-none">
      {item.mentionQuote ? (
        <p className="mb-2 text-sm text-secondary-foreground">{item.mentionQuote}</p>
      ) : (
        <p className="mb-2 text-sm text-secondary-foreground">{item.body}</p>
      )}
      <div className="relative">
        <ImageIcon className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('topbar.notifications.replyPlaceholder')}
          className="pe-10"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const text = draft.trim();
              if (text && !replyMutation.isPending) replyMutation.mutate(text);
            }
          }}
        />
      </div>
    </Card>
  );
}

function NotificationRow({
  item,
  presence,
  onRead,
  onInvitationHandled,
}: {
  item: InAppNotificationItem;
  presence?: import('@/components/common/user-presence-ui').UserPresenceStatus;
  onRead: (id: string) => void;
  onInvitationHandled: () => void;
}) {
  const { t } = useTranslation();
  const { languageCode } = useLanguage();
  const dateLocale = getDateFnsLocale(languageCode);
  const queryClient = useQueryClient();

  const timeLabel = formatDistanceToNow(new Date(item.createdAt), {
    addSuffix: true,
    locale: dateLocale,
  });
  const categoryLabel = t(
    `topbar.notifications.categories.${item.category}`,
    item.category,
  );
  const isChatInvitation =
    item.actionType === 'chat_invitation' &&
    !!item.invitationId &&
    item.unread;
  const isMention = item.actionType === 'mention' && item.unread;

  const respondMutation = useMutation({
    mutationFn: (action: 'accept' | 'decline') =>
      respondChatInvitation(item.invitationId!, action),
    onSuccess: (_result, action) => {
      onRead(item.id);
      void queryClient.invalidateQueries({ queryKey: ['topbar-notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['topbar-chat-conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['topbar-chat-invitations'] });
      void queryClient.invalidateQueries({ queryKey: ['topbar-summary'] });
      onInvitationHandled();
      toast.success(
        action === 'accept'
          ? t('topbar.chat.invitationAccepted')
          : t('topbar.chat.invitationDeclined'),
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const actorName =
    item.actorName ?? item.title.split(' ')[0] ?? t('topbar.notifications.someone');

  const body = (
    <div className={cn('flex grow gap-2.5', TOPBAR_SHEET_ROW_PADDING, item.unread && 'bg-primary/5')}>
      <NotificationActorAvatar item={item} presence={presence} />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex flex-col gap-1">
          {isChatInvitation ? (
            <p className="text-sm font-medium leading-snug">
              <span className="font-semibold text-foreground">{actorName}</span>{' '}
              <span className="text-muted-foreground">
                {t('topbar.notifications.chatInviteAction')}
              </span>{' '}
              <span className="font-semibold text-primary">
                {item.conversationTitle ?? t('topbar.chat.defaultConversation')}
              </span>
            </p>
          ) : isMention ? (
            <p className="text-sm font-medium leading-snug">
              <span className="font-semibold text-foreground">{actorName}</span>{' '}
              <span className="text-muted-foreground">
                {t('topbar.notifications.mentionAction')}
              </span>{' '}
              {item.mentionTopicHref ? (
                <Link
                  href={item.mentionTopicHref}
                  className="font-semibold text-primary hover:underline"
                  onClick={() => item.unread && onRead(item.id)}
                >
                  {item.mentionTopic ?? item.mentionTopicHref}
                </Link>
              ) : (
                <span className="font-semibold text-primary">
                  {item.mentionTopic ?? t('topbar.notifications.mentionTopic')}
                </span>
              )}
            </p>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{item.body}</p>
            </>
          )}
          <span className="flex items-center text-xs font-medium text-muted-foreground">
            {timeLabel}
            <span className="mx-1.5 size-1 rounded-full bg-foreground/30" />
            {item.contextLabel ?? item.teamName ?? categoryLabel}
          </span>
        </div>

        {isChatInvitation ? (
          <>
            <Card className="rounded-lg border-0 bg-muted/70 p-3 shadow-none">
              <p className="text-sm text-secondary-foreground">{item.body}</p>
              {item.teamName ? (
                <p className="mt-1 text-xs text-muted-foreground">{item.teamName}</p>
              ) : null}
            </Card>
            <div className={TOPBAR_SHEET_ACTION_ROW_CLASS}>
              <Button
                size="sm"
                variant="outline"
                className="h-10 sm:h-9"
                disabled={respondMutation.isPending}
                onClick={() => respondMutation.mutate('decline')}
              >
                {t('topbar.chat.invitationDecline')}
              </Button>
              <Button
                size="sm"
                variant="mono"
                className="h-10 sm:h-9"
                disabled={respondMutation.isPending}
                onClick={() => respondMutation.mutate('accept')}
              >
                {t('topbar.chat.invitationAccept')}
              </Button>
            </div>
          </>
        ) : null}

        {isMention ? (
          <MentionReplyBox
            item={item}
            onReplied={() => {
              onRead(item.id);
              void queryClient.invalidateQueries({ queryKey: ['topbar-notifications'] });
              void queryClient.invalidateQueries({ queryKey: ['topbar-chat-conversations'] });
              void queryClient.invalidateQueries({ queryKey: ['topbar-summary'] });
            }}
          />
        ) : null}
      </div>
    </div>
  );

  if (!isChatInvitation && !isMention && item.href) {
    return (
      <Link
        href={item.href}
        onClick={() => {
          if (item.unread) onRead(item.id);
        }}
        className="block transition-colors hover:bg-muted/30"
      >
        {body}
      </Link>
    );
  }

  if (!isChatInvitation && !isMention) {
    return (
      <button
        type="button"
        className="block w-full text-start transition-colors hover:bg-muted/30"
        onClick={() => {
          if (item.unread) onRead(item.id);
        }}
      >
        {body}
      </button>
    );
  }

  return <div className="border-b border-border last:border-b-0">{body}</div>;
}

function NotificationsList({
  tab,
  scope,
  onRead,
}: {
  tab: NotificationTab;
  scope: NotificationsScope;
  onRead: (id: string) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['topbar-notifications', tab, scope],
    queryFn: () => fetchNotifications({ tab, scope, limit: 50 }),
    staleTime: 10_000,
  });

  const items = data?.items ?? [];
  const actorIds = useMemo(
    () =>
      [
        ...new Set(
          items
            .filter((i) => notificationShowsUserPresence(i) && i.actorId)
            .map((i) => i.actorId as string),
        ),
      ],
    [items],
  );

  const { data: presences = {} } = useQuery({
    queryKey: ['topbar-notification-presences', actorIds.join(',')],
    queryFn: () => fetchUsersPresence(actorIds),
    enabled: actorIds.length > 0,
    staleTime: 20_000,
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
      <p className="px-3 py-16 text-center text-sm text-muted-foreground sm:px-4">
        {t('topbar.notifications.loadError')}
      </p>
    );
  }

  if (items.length === 0) {
    const emptyKey =
      tab === 'unread'
        ? 'emptyUnread'
        : tab === 'team'
          ? 'emptyTeam'
          : tab === 'following'
            ? 'emptyFollowing'
            : 'empty';
    return (
      <p className="px-3 py-16 text-center text-sm text-muted-foreground sm:px-4">
        {t(`topbar.notifications.${emptyKey}`)}
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {items.map((item) => (
        <NotificationRow
          key={item.id}
          item={item}
          presence={item.actorId ? presences[item.actorId] : undefined}
          onRead={onRead}
          onInvitationHandled={() => {
            void queryClient.invalidateQueries({ queryKey: ['topbar-notifications'] });
          }}
        />
      ))}
    </div>
  );
}

export function NotificationsSheet({ trigger }: { trigger: ReactNode }) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const pathname = usePathname();
  const scope = scopeFromPathname(pathname);
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

  const { data: unreadData } = useQuery({
    queryKey: ['topbar-notifications-unread-count', scope],
    queryFn: () => fetchNotifications({ tab: 'unread', scope, limit: 1 }),
    enabled: open,
    staleTime: 15_000,
  });
  const hasUnread = (unreadData?.unreadCount ?? 0) > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className={TOPBAR_SHEET_CONTENT_CLASS} close>
        <SheetHeader className={TOPBAR_SHEET_HEADER_CLASS}>
          <SheetTitle className="text-base">{t('topbar.notifications.title')}</SheetTitle>
        </SheetHeader>

        <SheetBody className={TOPBAR_SHEET_BODY_CLASS}>
          <Tabs defaultValue="all" className="flex h-full min-h-0 flex-col">
            <TabsList variant="line" className={TOPBAR_SHEET_TABS_LIST_CLASS}>
              <TabsTrigger value="all" className={TOPBAR_SHEET_TABS_TRIGGER_CLASS}>
                {t('topbar.notifications.tabAll')}
              </TabsTrigger>
              <TabsTrigger value="unread" className={cn(TOPBAR_SHEET_TABS_TRIGGER_CLASS, 'relative')}>
                {t('topbar.notifications.tabInbox')}
                {hasUnread ? (
                  <span className="ms-1.5 size-1.5 rounded-full bg-primary" aria-hidden />
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="team" className={TOPBAR_SHEET_TABS_TRIGGER_CLASS}>
                {t('topbar.notifications.tabTeam')}
              </TabsTrigger>
              <TabsTrigger value="following" className={TOPBAR_SHEET_TABS_TRIGGER_CLASS}>
                {t('topbar.notifications.tabFollowing')}
              </TabsTrigger>
            </TabsList>
            <ScrollArea className={TOPBAR_SHEET_SCROLL_CLASS}>
              <TabsContent value="all" className="mt-0 pb-2">
                <NotificationsList
                  tab="all"
                  scope={scope}
                  onRead={(id) => readMutation.mutate(id)}
                />
              </TabsContent>
              <TabsContent value="unread" className="mt-0 pb-2">
                <NotificationsList
                  tab="unread"
                  scope={scope}
                  onRead={(id) => readMutation.mutate(id)}
                />
              </TabsContent>
              <TabsContent value="team" className="mt-0 pb-2">
                <NotificationsList
                  tab="team"
                  scope={scope}
                  onRead={(id) => readMutation.mutate(id)}
                />
              </TabsContent>
              <TabsContent value="following" className="mt-0 pb-2">
                <NotificationsList
                  tab="following"
                  scope={scope}
                  onRead={(id) => readMutation.mutate(id)}
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </SheetBody>

        <SheetFooter className={TOPBAR_SHEET_FOOTER_CLASS}>
          <div className="grid w-full grid-cols-2 gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full gap-2 px-3 text-sm font-medium"
              disabled={archiveAllMutation.isPending}
              title={t('topbar.notifications.archiveAllHint')}
              onClick={() => archiveAllMutation.mutate()}
            >
              {archiveAllMutation.isPending ? (
                <LoaderCircleIcon className="size-4 shrink-0 animate-spin" />
              ) : (
                <Archive className="size-4 shrink-0" />
              )}
              <span className="truncate">{t('topbar.notifications.footerArchive')}</span>
            </Button>
            <Button
              type="button"
              variant="mono"
              className="h-11 w-full gap-2 px-3 text-sm font-medium"
              disabled={readAllMutation.isPending}
              title={t('topbar.notifications.markAllReadHint')}
              onClick={() => readAllMutation.mutate()}
            >
              {readAllMutation.isPending ? (
                <LoaderCircleIcon className="size-4 shrink-0 animate-spin" />
              ) : (
                <CheckCheck className="size-4 shrink-0" />
              )}
              <span className="truncate">{t('topbar.notifications.footerMarkRead')}</span>
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
