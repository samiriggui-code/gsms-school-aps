import { getAvatarUrl } from '@/lib/helpers';
import type { OfficialDocumentAuthor } from '@/lib/reports/official-document-types';

export function resolveOfficialDocumentAuthor(input: {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
}): OfficialDocumentAuthor | null {
  const name = input.name?.trim();
  const email = input.email?.trim();
  if (!name && !email) return null;

  return {
    name: name || email || '—',
    email: email || null,
    avatarUrl: input.avatar ? getAvatarUrl(input.avatar) : null,
  };
}

export function officialAuthorFromStoredDocument(input: {
  authorName?: string | null;
  authorEmail?: string | null;
  authorAvatarUrl?: string | null;
}): OfficialDocumentAuthor | null {
  if (!input.authorName?.trim() && !input.authorEmail?.trim()) return null;
  return {
    name: input.authorName?.trim() || input.authorEmail?.trim() || '—',
    email: input.authorEmail?.trim() || null,
    avatarUrl: input.authorAvatarUrl?.trim() || null,
  };
}
