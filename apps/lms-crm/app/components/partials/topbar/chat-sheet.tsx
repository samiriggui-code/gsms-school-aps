'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  CheckCheck,
  LoaderCircleIcon,
  MessageSquarePlus,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAvatarUrl, getInitials } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import {
  TOPBAR_SHEET_ACTION_ROW_CLASS,
  TOPBAR_SHEET_BODY_CLASS,
  TOPBAR_SHEET_CONTENT_CLASS,
  TOPBAR_SHEET_FOOTER_CLASS,
  TOPBAR_SHEET_HEADER_CLASS,
  TOPBAR_SHEET_ROW_PADDING,
  TOPBAR_SHEET_SCROLL_CLASS,
  TOPBAR_SHEET_THREAD_CLASS,
  TOPBAR_CHAT_SPLIT_CLASS,
  TOPBAR_CHAT_LIST_PANE_CLASS,
  TOPBAR_CHAT_THREAD_PANE_CLASS,
} from '@/lib/topbar-sheet-layout';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
} from '@repo/ui/avatar';
import { Button } from '@repo/ui/button';
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
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/dialog';
import { getDateFnsLocale } from '@/i18n/date-locale';
import { useTranslation } from '@/hooks/useTranslation';
import { usePusher, isPusherClientConfigured } from '@/hooks/use-pusher';
import { useLanguage } from '@/providers/i18n-provider';
import {
  createChatConversation,
  createChatInvitations,
  fetchChatConversations,
  fetchChatInvitations,
  fetchChatMessages,
  fetchChatParticipantOptions,
  fetchUsersPresence,
  respondChatInvitation,
  sendChatMessage,
  type ChatConversationItem,
  type ChatInvitationItem,
  type ChatMessageItem,
  type ChatParticipantOption,
} from '@/lib/topbar-api';
import { Label } from '@repo/ui/label';
import { presenceDotClass } from '@/components/common/user-presence-ui';

function ParticipantAvatarStack({
  participants,
  participantCount,
  max = 3,
  size = 'size-8',
}: {
  participants: { id: string; name: string; avatar: string | null }[];
  participantCount: number;
  max?: number;
  size?: string;
}) {
  const visible = participants.slice(0, max);
  const extra = Math.max(0, participantCount - 1 - visible.length);

  return (
    <div className="flex shrink-0 -space-x-2">
      {visible.map((p) => (
        <Avatar key={p.id} className={cn(size, 'border-2 border-background')}>
          {p.avatar ? (
            <AvatarImage src={getAvatarUrl(p.avatar)} alt={p.name} />
          ) : null}
          <AvatarFallback className="text-[10px]">{getInitials(p.name)}</AvatarFallback>
        </Avatar>
      ))}
      {extra > 0 ? (
        <span
          className={cn(
            size,
            'flex items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground',
          )}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

function ChatUserPickerList({
  users,
  selectedIds,
  onToggle,
  excludeIds,
  isLoading,
}: {
  users: ChatParticipantOption[];
  selectedIds: string[];
  onToggle: (userId: string, checked: boolean) => void;
  excludeIds: string[];
  isLoading?: boolean;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => !excludeIds.includes(u.id))
      .filter((u) => {
        if (!q) return true;
        const name = (u.name ?? '').toLowerCase();
        return name.includes(q) || u.email.toLowerCase().includes(q);
      });
  }, [users, excludeIds, search]);

  const userIds = useMemo(() => filtered.map((u) => u.id), [filtered]);
  const { data: presences = {} } = useQuery({
    queryKey: ['chat-picker-presences', userIds.join(',')],
    queryFn: () => fetchUsersPresence(userIds),
    enabled: userIds.length > 0,
    staleTime: 20_000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('topbar.chat.inviteSearchPlaceholder')}
          className="ps-9"
        />
      </div>
      <ScrollArea className="h-56 rounded-md border border-border">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {t('topbar.chat.inviteNoUsers')}
          </p>
        ) : (
          <div className="flex flex-col p-1">
            {filtered.map((user) => {
              const checked = selectedIds.includes(user.id);
              const label = user.name?.trim() || user.email;
              return (
                <label
                  key={user.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50',
                    checked && 'bg-muted/60',
                  )}
                >
                  <input
                    type="checkbox"
                    className="size-4 shrink-0 accent-primary"
                    checked={checked}
                    onChange={(e) => onToggle(user.id, e.target.checked)}
                  />
                  <Avatar className="size-9 shrink-0">
                    {user.avatar ? (
                      <AvatarImage src={getAvatarUrl(user.avatar)} alt={label} />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {getInitials(label)}
                    </AvatarFallback>
                    <AvatarIndicator className="-end-1 -bottom-1">
                      <AvatarStatus
                        variant={
                          presences[user.id] === 'offline'
                            ? 'offline'
                            : presences[user.id] === 'busy'
                              ? 'busy'
                              : presences[user.id] === 'away'
                                ? 'away'
                                : 'online'
                        }
                        className={cn(
                          'size-2',
                          presenceDotClass(presences[user.id] ?? 'online'),
                        )}
                      />
                    </AvatarIndicator>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{label}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </ScrollArea>
      {selectedIds.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {t('topbar.chat.selectedCount', { count: selectedIds.length })}
        </p>
      ) : null}
    </div>
  );
}

function ChatPendingInvitations({
  enabled,
  onAccepted,
}: {
  enabled: boolean;
  onAccepted: (conversationId: string) => void;
}) {
  const { t } = useTranslation();
  const { languageCode } = useLanguage();
  const dateLocale = getDateFnsLocale(languageCode);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['topbar-chat-invitations'],
    queryFn: fetchChatInvitations,
    enabled,
    staleTime: 10_000,
  });

  const respondMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: 'accept' | 'decline';
    }) => respondChatInvitation(id, action),
    onSuccess: (result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['topbar-chat-invitations'] });
      void queryClient.invalidateQueries({ queryKey: ['topbar-chat-conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['topbar-summary'] });
      if (variables.action === 'accept') {
        toast.success(t('topbar.chat.invitationAccepted'));
        if (result.conversationId) onAccepted(result.conversationId);
      } else {
        toast.success(t('topbar.chat.invitationDeclined'));
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invitations = data?.invitations ?? [];
  if (isLoading || invitations.length === 0) return null;

  return (
    <div className="border-b border-border bg-accent/30">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-4">
        {t('topbar.chat.invitationsPending')}
      </div>
      <div className="flex flex-col divide-y divide-border">
        {invitations.map((invitation: ChatInvitationItem) => (
          <div
            key={invitation.id}
            className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:px-4"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <Avatar className="size-9 shrink-0">
                <AvatarImage src={getAvatarUrl(invitation.invitedBy.avatar, undefined)} />
                <AvatarFallback className="text-xs">
                  {getInitials(invitation.invitedBy.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">
                  <span className="font-semibold">{invitation.invitedBy.name}</span>{' '}
                  <span className="text-muted-foreground">
                    {t('topbar.chat.invitationWantsToJoin')}
                  </span>{' '}
                  <span className="font-medium">{invitation.conversation.title}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(invitation.createdAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                  {invitation.conversation.teamName
                    ? ` · ${invitation.conversation.teamName}`
                    : ''}
                </p>
              </div>
            </div>
            <div className={cn(TOPBAR_SHEET_ACTION_ROW_CLASS, 'sm:shrink-0')}>
              <Button
                variant="outline"
                size="sm"
                className="h-10 sm:h-9"
                disabled={respondMutation.isPending}
                onClick={() =>
                  respondMutation.mutate({ id: invitation.id, action: 'decline' })
                }
              >
                {t('topbar.chat.invitationDecline')}
              </Button>
              <Button
                variant="mono"
                size="sm"
                className="h-10 sm:h-9"
                disabled={respondMutation.isPending}
                onClick={() =>
                  respondMutation.mutate({ id: invitation.id, action: 'accept' })
                }
              >
                {t('topbar.chat.invitationAccept')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatInviteDialog({
  open,
  onOpenChange,
  conversation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: ChatConversationItem;
}) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['chat-participant-options'],
    queryFn: fetchChatParticipantOptions,
    enabled: open,
    staleTime: 60_000,
  });

  const excludeIds = useMemo(
    () => [
      session?.user?.id ?? '',
      ...conversation.participants.map((p) => p.id),
    ].filter(Boolean),
    [session?.user?.id, conversation.participants],
  );

  useEffect(() => {
    if (!open) setSelectedIds([]);
  }, [open]);

  const inviteMutation = useMutation({
    mutationFn: () =>
      createChatInvitations({
        conversationId: conversation.id,
        userIds: selectedIds,
      }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['topbar-chat-invitations'] });
      toast.success(
        t('topbar.chat.inviteSuccess', { count: result.created }),
      );
      onOpenChange(false);
    },
    onError: (e: Error) =>
      toast.error(e.message || t('topbar.chat.inviteError')),
  });

  const toggleUser = (userId: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, userId] : prev.filter((id) => id !== userId),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-sm:max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('topbar.chat.inviteUsersTitle')}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="mb-4 text-sm text-muted-foreground">
            {t('topbar.chat.inviteUsersHint')}
          </p>
          <ChatUserPickerList
            users={users}
            selectedIds={selectedIds}
            onToggle={toggleUser}
            excludeIds={excludeIds}
            isLoading={isLoading}
          />
        </DialogBody>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.buttons.cancel')}
          </Button>
          <Button
            variant="mono"
            disabled={selectedIds.length === 0 || inviteMutation.isPending}
            onClick={() => inviteMutation.mutate()}
          >
            {inviteMutation.isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="size-4 me-1" />
                {t('topbar.chat.inviteUsers')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConversationList({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: ChatConversationItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col divide-y divide-border">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          type="button"
          onClick={() => onSelect(conv.id)}
          className={cn(
            'flex items-center gap-3 text-start transition-colors hover:bg-muted/40',
            TOPBAR_SHEET_ROW_PADDING,
            activeId === conv.id && 'bg-muted/60',
          )}
        >
          <ParticipantAvatarStack
            participants={conv.participants}
            participantCount={conv.participantCount}
            max={3}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold">{conv.title}</span>
              {conv.unread ? (
                <span className="size-2 shrink-0 rounded-full bg-primary" />
              ) : null}
            </div>
            {conv.lastMessage ? (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {conv.lastMessage.isMine ? t('topbar.chat.youPrefix') : ''}
                {conv.lastMessage.body}
              </p>
            ) : (
              <p className="text-xs italic text-muted-foreground">
                {t('topbar.chat.noMessages')}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function MessageThread({
  conversation,
  currentUserAvatar,
}: {
  conversation: ChatConversationItem;
  currentUserAvatar?: string | null;
}) {
  const { t } = useTranslation();
  const { languageCode } = useLanguage();
  const dateLocale = getDateFnsLocale(languageCode);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const queryClient = useQueryClient();
  const conversationId = conversation.id;

  const { data, isLoading } = useQuery({
    queryKey: ['topbar-chat-messages', conversationId],
    queryFn: () => fetchChatMessages(conversationId),
    refetchInterval: isPusherClientConfigured() ? 60_000 : 15_000,
  });

  usePusher(
    undefined,
    () => {
      void queryClient.invalidateQueries({
        queryKey: ['topbar-chat-messages', conversationId],
      });
      void queryClient.invalidateQueries({ queryKey: ['topbar-chat-conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['topbar-summary'] });
    },
    { channelName: `chat-${conversationId}`, eventName: 'chat.message' },
  );

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendChatMessage(conversationId, body),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({
        queryKey: ['topbar-chat-messages', conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ['topbar-chat-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['topbar-summary'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const messages = data?.messages ?? [];

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  return (
    <div className={TOPBAR_SHEET_THREAD_CLASS}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <ParticipantAvatarStack
            participants={conversation.participants}
            participantCount={conversation.participantCount}
            max={4}
          />
          <span className="truncate text-xs text-muted-foreground">
            {t('topbar.chat.memberCount', { count: conversation.participants.length })}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-10 shrink-0 px-2 sm:h-9 sm:px-3"
          onClick={() => setInviteOpen(true)}
        >
          <Users className="size-4 sm:me-1" />
          <span className="hidden sm:inline">{t('topbar.chat.inviteUsers')}</span>
        </Button>
      </div>

      <ChatInviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        conversation={conversation}
      />

      <SheetBody className={TOPBAR_SHEET_BODY_CLASS}>
        <ScrollArea className={TOPBAR_SHEET_SCROLL_CLASS}>
          <div ref={scrollRef} className="flex flex-col gap-3.5 py-4">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <p className="px-3 text-center text-sm text-muted-foreground sm:px-4">
                {t('topbar.chat.startConversation')}
              </p>
            ) : (
              messages.map((message: ChatMessageItem) =>
                message.isMine ? (
                  <div
                    key={message.id}
                    className="flex items-end justify-end gap-2 px-3 sm:px-4"
                  >
                    <div className="flex max-w-[85%] flex-col items-end gap-1">
                      <div className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-xs">
                        {message.body}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {format(new Date(message.createdAt), 'HH:mm', { locale: dateLocale })}
                        <CheckCheck className="size-3.5 text-green-500" />
                      </div>
                    </div>
                    <Avatar className="size-8 shrink-0">
                      <AvatarImage src={getAvatarUrl(currentUserAvatar, undefined)} />
                      <AvatarFallback>{t('topbar.chat.me')}</AvatarFallback>
                    </Avatar>
                  </div>
                ) : (
                  <div key={message.id} className="flex items-end gap-2 px-3 sm:px-4">
                    <Avatar className="size-8 shrink-0">
                      <AvatarImage
                        src={getAvatarUrl(message.sender.avatar, undefined)}
                      />
                      <AvatarFallback>
                        {getInitials(message.sender.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex max-w-[85%] flex-col gap-1">
                      <span className="text-2xs font-medium text-muted-foreground">
                        {message.sender.name}
                      </span>
                      <div className="rounded-lg bg-accent/60 px-3 py-2 text-sm text-secondary-foreground shadow-xs">
                        {message.body}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.createdAt), 'HH:mm', { locale: dateLocale })}
                      </span>
                    </div>
                  </div>
                ),
              )
            )}
          </div>
        </ScrollArea>
      </SheetBody>
      <SheetFooter className={TOPBAR_SHEET_FOOTER_CLASS}>
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('topbar.chat.placeholder')}
            className="h-11 min-h-11 flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            variant="mono"
            size="sm"
            className="h-11 shrink-0 px-4 sm:h-9"
            disabled={!draft.trim() || sendMutation.isPending}
            onClick={handleSend}
          >
            {sendMutation.isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              t('topbar.chat.send')
            )}
          </Button>
        </div>
      </SheetFooter>
    </div>
  );
}

function NewConversationForm({
  onCreated,
  onCancel,
}: {
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['chat-participant-options'],
    queryFn: fetchChatParticipantOptions,
    staleTime: 60_000,
  });

  const excludeIds = useMemo(
    () => (session?.user?.id ? [session.user.id] : []),
    [session?.user?.id],
  );

  const createMutation = useMutation({
    mutationFn: () =>
      createChatConversation({
        type: 'GROUP',
        title,
        participantIds: selectedIds,
      }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['topbar-chat-conversations'] });
      toast.success(t('topbar.chat.createSuccess'));
      onCreated(result.id);
    },
    onError: (err: Error) => {
      toast.error(err.message || t('topbar.chat.createError'));
    },
  });

  const canSubmit = title.trim().length > 0 && selectedIds.length > 0;

  const toggleUser = (userId: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, userId] : prev.filter((id) => id !== userId),
    );
  };

  return (
    <div className="space-y-4 px-3 py-6 sm:px-4">
      <div className="space-y-2">
        <Label htmlFor="chat-new-title">{t('topbar.chat.newTitle')}</Label>
        <Input
          id="chat-new-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('topbar.chat.newTitlePlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('topbar.chat.newParticipants')}</Label>
        <ChatUserPickerList
          users={users}
          selectedIds={selectedIds}
          onToggle={toggleUser}
          excludeIds={excludeIds}
          isLoading={usersLoading}
        />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>
          {t('common.buttons.cancel')}
        </Button>
        <Button
          variant="mono"
          size="sm"
          disabled={!canSubmit || createMutation.isPending}
          onClick={() => {
            if (!canSubmit) {
              toast.error(t('topbar.chat.createValidation'));
              return;
            }
            createMutation.mutate();
          }}
        >
          {createMutation.isPending ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            t('topbar.chat.create')
          )}
        </Button>
      </div>
    </div>
  );
}

export function ChatSheet({
  trigger,
  userAvatar,
}: {
  trigger: ReactNode;
  userAvatar?: string | null;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['topbar-chat-conversations'],
    queryFn: fetchChatConversations,
    enabled: open,
    refetchInterval: open ? (isPusherClientConfigured() ? 60_000 : 20_000) : false,
  });

  const conversations = data?.conversations ?? [];
  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    if (!open) {
      setActiveId(null);
      setShowNew(false);
      return;
    }
    if (!activeId && !showNew && conversations.length === 1) {
      setActiveId(conversations[0].id);
    }
  }, [open, activeId, conversations, showNew]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className={TOPBAR_SHEET_CONTENT_CLASS} close>
        <SheetHeader className={cn(TOPBAR_SHEET_HEADER_CLASS, 'space-y-0 p-0')}>
          <div className="flex items-center gap-2 px-3 pe-11 py-3 sm:px-4 sm:pe-12">
            {activeConversation ? (
              <Button
                variant="ghost"
                mode="icon"
                size="sm"
                className="shrink-0"
                onClick={() => setActiveId(null)}
              >
                <ArrowLeft className="size-4" />
              </Button>
            ) : showNew ? (
              <Button
                variant="ghost"
                mode="icon"
                size="sm"
                className="shrink-0"
                onClick={() => setShowNew(false)}
              >
                <ArrowLeft className="size-4" />
              </Button>
            ) : null}
            <SheetTitle className="flex-1 truncate">
              {showNew
                ? t('topbar.chat.newConversation')
                : activeConversation?.title ?? t('topbar.chat.title')}
            </SheetTitle>
            {!activeConversation && !showNew ? (
              <Button
                variant="outline"
                size="sm"
                className="h-10 shrink-0 px-2 sm:h-9 sm:px-3"
                onClick={() => setShowNew(true)}
              >
                <MessageSquarePlus className="size-4 sm:me-1" />
                <span className="hidden sm:inline">{t('topbar.chat.newConversation')}</span>
              </Button>
            ) : null}
          </div>
          {!activeConversation && conversations.length > 0 ? (
            <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground sm:px-4">
              {t('topbar.chat.conversationCount', { count: conversations.length })}
            </div>
          ) : null}
        </SheetHeader>

        {showNew ? (
          <SheetBody className={cn(TOPBAR_SHEET_BODY_CLASS, 'overflow-y-auto')}>
            <NewConversationForm
              onCreated={(id) => {
                setShowNew(false);
                setActiveId(id);
              }}
              onCancel={() => setShowNew(false)}
            />
          </SheetBody>
        ) : (
          <div className={TOPBAR_CHAT_SPLIT_CLASS}>
            {/* Liste — toujours visible en md+, stack mobile si pas de thread */}
            <div
              className={cn(
                TOPBAR_CHAT_LIST_PANE_CLASS,
                activeConversation || showNew ? 'hidden md:flex' : 'flex',
              )}
            >
              {open ? (
                <ChatPendingInvitations enabled={open} onAccepted={(id) => setActiveId(id)} />
              ) : null}
              <SheetBody className={TOPBAR_SHEET_BODY_CLASS}>
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    {t('topbar.chat.loading')}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="space-y-4 px-3 py-10 text-center text-sm text-muted-foreground sm:px-4">
                    <p>
                      {t('topbar.chat.emptyConversations')}
                      <br />
                      <span className="text-xs">{t('topbar.chat.emptyConversationsHint')}</span>
                    </p>
                    <Button variant="mono" size="sm" onClick={() => setShowNew(true)}>
                      <MessageSquarePlus className="size-4 me-1" />
                      {t('topbar.chat.newConversation')}
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className={TOPBAR_SHEET_SCROLL_CLASS}>
                    <ConversationList
                      conversations={conversations}
                      activeId={activeId}
                      onSelect={setActiveId}
                    />
                  </ScrollArea>
                )}
              </SheetBody>
            </div>

            {/* Thread — plein écran mobile, panneau droit desktop */}
            {activeConversation ? (
              <div className={TOPBAR_CHAT_THREAD_PANE_CLASS}>
                <MessageThread
                  conversation={activeConversation}
                  currentUserAvatar={userAvatar}
                />
              </div>
            ) : (
              <div
                className={cn(
                  TOPBAR_CHAT_THREAD_PANE_CLASS,
                  'hidden items-center justify-center p-6 text-center text-sm text-muted-foreground md:flex',
                )}
              >
                {t('topbar.chat.emptyConversationsHint')}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
