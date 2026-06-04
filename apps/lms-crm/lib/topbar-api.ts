import { apiFetch, unwrapSectionApiData } from '@/lib/api';

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

export async function fetchTopbarSummary() {
  const res = await apiFetch('/api/common/topbar/summary');
  return parseApi<TopbarSummary>(res);
}

export type NotificationsListParams = {
  tab?: 'all' | 'unread' | 'archived';
  page?: number;
  limit?: number;
  query?: string;
  category?: string;
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
    byCategory: Record<string, number>;
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
  const res = await apiFetch(`/api/common/notifications?${qs.toString()}`);
  return parseApi<NotificationsListResponse>(res);
}

export async function markAllNotificationsRead() {
  const res = await apiFetch('/api/common/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'read_all' }),
  });
  return parseApi<{ ok: boolean }>(res);
}

export async function archiveAllNotifications() {
  const res = await apiFetch('/api/common/notifications', {
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
