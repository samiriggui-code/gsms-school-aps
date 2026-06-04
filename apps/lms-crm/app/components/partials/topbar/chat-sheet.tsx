'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, CheckCheck, LoaderCircleIcon, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';
import { getAvatarUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { getDateFnsLocale } from '@/i18n/date-locale';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/providers/i18n-provider';
import {
  createChatConversation,
  fetchChatConversations,
  fetchChatMessages,
  fetchChatParticipantOptions,
  sendChatMessage,
  type ChatConversationItem,
  type ChatMessageItem,
} from '@/lib/topbar-api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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
            'flex flex-col gap-1 px-4 py-3 text-start transition-colors hover:bg-muted/40',
            activeId === conv.id && 'bg-muted/60',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold truncate">{conv.title}</span>
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
            <p className="text-xs text-muted-foreground italic">
              {t('topbar.chat.noMessages')}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

function MessageThread({
  conversationId,
  currentUserAvatar,
}: {
  conversationId: string;
  currentUserAvatar?: string | null;
}) {
  const { t } = useTranslation();
  const { languageCode } = useLanguage();
  const dateLocale = getDateFnsLocale(languageCode);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['topbar-chat-messages', conversationId],
    queryFn: () => fetchChatMessages(conversationId),
    refetchInterval: 15000,
  });

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
    <>
      <SheetBody className="p-0 flex flex-col min-h-0">
        <ScrollArea className="h-[calc(100vh-14rem)]">
          <div ref={scrollRef} className="flex flex-col gap-3.5 py-4">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <p className="px-5 text-center text-sm text-muted-foreground">
                {t('topbar.chat.startConversation')}
              </p>
            ) : (
              messages.map((message: ChatMessageItem) =>
                message.isMine ? (
                  <div
                    key={message.id}
                    className="flex items-end justify-end gap-2 px-4"
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
                  <div key={message.id} className="flex items-end gap-2 px-4">
                    <Avatar className="size-8 shrink-0">
                      <AvatarImage
                        src={getAvatarUrl(message.sender.avatar, undefined)}
                      />
                      <AvatarFallback>
                        {message.sender.name.slice(0, 2).toUpperCase()}
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
      <SheetFooter className="border-t border-border p-4 block sm:space-x-0">
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('topbar.chat.placeholder')}
            className="flex-1"
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
    </>
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
  const [participantId, setParticipantId] = useState('');

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['chat-participant-options'],
    queryFn: fetchChatParticipantOptions,
    staleTime: 60_000,
  });

  const otherUsers = users.filter((u) => u.id !== session?.user?.id);

  const createMutation = useMutation({
    mutationFn: () =>
      createChatConversation({
        type: 'GROUP',
        title,
        participantIds: participantId ? [participantId] : [],
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

  const canSubmit = title.trim().length > 0 && participantId.length > 0;

  return (
    <div className="space-y-4 px-5 py-6">
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
        <Label>{t('topbar.chat.newParticipant')}</Label>
        <Select value={participantId} onValueChange={setParticipantId} disabled={usersLoading}>
          <SelectTrigger>
            <SelectValue placeholder={t('topbar.chat.newParticipantPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {otherUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name?.trim() || u.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 justify-end">
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
    refetchInterval: open ? 20000 : false,
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
      <SheetContent className="p-0 gap-0 sm:w-[450px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 sm:max-w-none [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b border-border">
          <div className="flex items-center gap-2 p-3">
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
            <SheetTitle className="truncate flex-1">
              {showNew
                ? t('topbar.chat.newConversation')
                : activeConversation?.title ?? t('topbar.chat.title')}
            </SheetTitle>
            {!activeConversation && !showNew ? (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setShowNew(true)}
              >
                <MessageSquarePlus className="size-4 me-1" />
                {t('topbar.chat.newConversation')}
              </Button>
            ) : null}
          </div>
          {!activeConversation && conversations.length > 0 ? (
            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              {t('topbar.chat.conversationCount', { count: conversations.length })}
            </div>
          ) : null}
        </SheetHeader>

        {showNew ? (
          <SheetBody className="p-0">
            <NewConversationForm
              onCreated={(id) => {
                setShowNew(false);
                setActiveId(id);
              }}
              onCancel={() => setShowNew(false)}
            />
          </SheetBody>
        ) : !activeConversation ? (
          <SheetBody className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <LoaderCircleIcon className="size-4 animate-spin" />
                {t('topbar.chat.loading')}
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground space-y-4">
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
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <ConversationList
                  conversations={conversations}
                  activeId={activeId}
                  onSelect={setActiveId}
                />
              </ScrollArea>
            )}
          </SheetBody>
        ) : (
          <MessageThread
            conversationId={activeConversation.id}
            currentUserAvatar={userAvatar}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
