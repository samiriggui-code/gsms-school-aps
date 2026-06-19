import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type { NotificationsScope } from '@/lib/notifications-scope';
import { notificationChannelLabel } from '@repo/api-core/notification-channel';

export type TopbarSummary = {
  notificationUnread: number;
  chatUnread: number;
};

export type InAppNotificationItem = {
  id: string;
  category: string;
  channel?: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  unread: boolean;
  moduleKey?: string | null;
  eventType?: string | null;
  severity?: 'CRITICAL' | 'WARNING' | 'INFO' | null;
  actionType?: string | null;
  invitationId?: string | null;
  conversationId?: string | null;
  conversationTitle?: string | null;
  teamName?: string | null;
  actorName?: string | null;
  actorAvatar?: string | null;
  actorId?: string | null;
  entityImageUrl?: string | null;
  avatarKind?: string | null;
  mentionTopic?: string | null;
  mentionTopicHref?: string | null;
  mentionQuote?: string | null;
  contextLabel?: string | null;
};

export type ChatConversationItem = {
  id: string;
  type: string;
  title: string;
  updatedAt: string;
  unread: boolean;
  participantCount: number;
  participants: { id: string; name: string; avatar: string | null }[];
  lastMessage: {
    id: string;
    body: string;
    createdAt: string;
    senderName: string;
    isMine: boolean;
  } | null;
};

export type ChatMessageItem = {
  id: string;
  body: string;
  createdAt: string;
  isMine: boolean;
  sender: { id: string; name: string; avatar: string | null };
};

async function parseApi<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as { error?: { message?: string } }).error?.message ??
      'Erreur serveur';
    throw new Error(msg);
  }
  return unwrapSectionApiData<T>(json) as T;
}

export async function fetchTopbarSummary(scope?: NotificationsScope) {
  const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
  const res = await apiFetch(`/api/common/topbar/summary${qs}`);
  return parseApi<TopbarSummary>(res);
}

export type NotificationsListParams = {
  tab?: 'all' | 'unread' | 'archived' | 'team' | 'following';
  page?: number;
  limit?: number;
  query?: string;
  category?: string;
  channel?: string;
  scope?: NotificationsScope;
  /** Préfixe moduleKey (ex. gestion-ressources) */
  module?: string;
};

export type NotificationsListResponse = {
  items: InAppNotificationItem[];
  unreadCount: number;
  pagination?: { page: number; limit: number; total: number };
  stats?: {
    active: number;
    unread: number;
    read: number;
    archived: number;
    today: number;
    byCategory: Record<string, number>;
    byChannel?: Record<string, number>;
    bySeverity?: { CRITICAL: number; WARNING: number; INFO: number };
  };
};

export async function fetchNotifications(
  params: NotificationsListParams | 'all' | 'unread' = 'all',
) {
  const p =
    typeof params === 'string'
      ? { tab: params }
      : { tab: 'all' as const, ...params };
  const qs = new URLSearchParams();
  const tab = p.tab ?? 'all';
  if (tab === 'team') {
    qs.set('tab', 'all');
    qs.set('category', 'TEAM');
  } else if (tab === 'following') {
    qs.set('tab', 'all');
    qs.set('category', 'ACADEMIC');
  } else {
    qs.set('tab', tab);
  }
  if (p.page != null) qs.set('page', String(p.page));
  if (p.limit != null) qs.set('limit', String(p.limit));
  if (p.query?.trim()) qs.set('query', p.query.trim());
  if (p.category && p.category !== 'all') qs.set('category', p.category);
  if (p.channel && p.channel !== 'all') qs.set('channel', p.channel);
  if (p.scope) qs.set('scope', p.scope);
  if (p.module?.trim()) qs.set('module', p.module.trim());
  const res = await apiFetch(`/api/common/notifications?${qs.toString()}`);
  return parseApi<NotificationsListResponse>(res);
}

export async function markAllNotificationsRead(scope?: NotificationsScope) {
  const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
  const res = await apiFetch(`/api/common/notifications${qs}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'read_all' }),
  });
  return parseApi<{ ok: boolean }>(res);
}

export async function archiveAllNotifications(scope?: NotificationsScope) {
  const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
  const res = await apiFetch(`/api/common/notifications${qs}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'archive_all' }),
  });
  return parseApi<{ ok: boolean }>(res);
}

export async function markNotificationRead(id: string) {
  const res = await apiFetch(`/api/common/notifications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ read: true }),
  });
  return parseApi<{ id: string }>(res);
}

export async function replyToNotification(id: string, reply: string) {
  const res = await apiFetch(`/api/common/notifications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply }),
  });
  return parseApi<{ id: string; replied: boolean; conversationId?: string | null }>(res);
}

export async function fetchUsersPresence(userIds: string[]) {
  if (userIds.length === 0) return {} as Record<string, import('@/components/common/user-presence-ui').UserPresenceStatus>;
  const qs = new URLSearchParams({ userIds: userIds.join(',') });
  const res = await apiFetch(`/api/common/presence?${qs.toString()}`);
  const data = await parseApi<{ presences: Record<string, import('@/components/common/user-presence-ui').UserPresenceStatus> }>(res);
  return data.presences ?? {};
}

export async function fetchChatConversations() {
  const res = await apiFetch('/api/common/chat/conversations');
  return parseApi<{ conversations: ChatConversationItem[] }>(res);
}

export async function fetchChatMessages(conversationId: string) {
  const res = await apiFetch(
    `/api/common/chat/conversations/${conversationId}/messages`,
  );
  return parseApi<{ messages: ChatMessageItem[] }>(res);
}

export async function sendChatMessage(conversationId: string, body: string) {
  const res = await apiFetch(
    `/api/common/chat/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    },
  );
  return parseApi<{ message: ChatMessageItem }>(res);
}

export async function createChatConversation(input: {
  type?: 'GROUP' | 'DIRECT';
  title?: string;
  participantIds: string[];
}) {
  const res = await apiFetch('/api/common/chat/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: input.type ?? 'GROUP',
      title: input.title?.trim() || undefined,
      participantIds: input.participantIds,
    }),
  });
  return parseApi<{ id: string; existing: boolean }>(res);
}

export type ChatParticipantOption = {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
};

export async function fetchChatParticipantOptions() {
  const res = await apiFetch('/api/common/chat/participants');
  return parseApi<ChatParticipantOption[]>(res);
}

export type ChatInvitationItem = {
  id: string;
  status: string;
  message: string | null;
  expiresAt: string | null;
  createdAt: string;
  conversation: {
    id: string;
    title: string;
    type: string;
    teamName: string | null;
  };
  invitedBy: {
    id: string;
    name: string;
    avatar: string | null;
  };
};

export async function fetchChatInvitations() {
  const res = await apiFetch('/api/common/chat/invitations');
  return parseApi<{ invitations: ChatInvitationItem[] }>(res);
}

export async function createChatInvitations(input: {
  conversationId: string;
  userIds: string[];
  message?: string;
}) {
  const res = await apiFetch('/api/common/chat/invitations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: input.conversationId,
      userIds: input.userIds,
      message: input.message?.trim() || undefined,
    }),
  });
  return parseApi<{ created: number; invitationIds: string[] }>(res);
}

export async function respondChatInvitation(
  invitationId: string,
  action: 'accept' | 'decline',
) {
  const res = await apiFetch(`/api/common/chat/invitations/${invitationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  return parseApi<{ status: string; conversationId?: string }>(res);
}
