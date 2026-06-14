import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type { NotificationsScope } from '@/lib/notifications-scope';

export type TopbarSummary = {
  notificationUnread: number;
  chatUnread: number;
};

export type InAppNotificationItem = {
  id: string;
  category: string;
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
};

export type ChatConversationItem = {
  id: string;
  type: string;
  title: string;
  updatedAt: string;
  unread: boolean;
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
  tab?: 'all' | 'unread' | 'archived';
  page?: number;
  limit?: number;
  query?: string;
  category?: string;
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
  if (p.tab) qs.set('tab', p.tab);
  if (p.page != null) qs.set('page', String(p.page));
  if (p.limit != null) qs.set('limit', String(p.limit));
  if (p.query?.trim()) qs.set('query', p.query.trim());
  if (p.category && p.category !== 'all') qs.set('category', p.category);
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
};

export async function fetchChatParticipantOptions() {
  const res = await apiFetch(
    '/api/sections/securite-configuration/acces/users?limit=30&page=1&status=ACTIVE',
  );
  const json = (await res.json().catch(() => ({}))) as {
    data?: ChatParticipantOption[];
    message?: string;
  };
  if (!res.ok) {
    throw new Error(json.message ?? 'Impossible de charger les utilisateurs.');
  }
  return json.data ?? [];
}
