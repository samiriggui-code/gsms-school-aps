import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth/next';
import { setCache } from '@repo/redis';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { fail, ok } from '@/app/api/_shared/http/response';
import {
  DATAGRID_EXPORT_CACHE_PREFIX,
  DATAGRID_EXPORT_TTL_SECONDS,
  type DatagridExportDocument,
} from '@/lib/datagrid/export-document-types';
import { resolveOfficialDocumentAuthor } from '@/lib/reports/official-document-author';

type PreviewBody = Omit<DatagridExportDocument, 'generatedAt' | 'authorName'> & {
  generatedAt?: string;
  authorName?: string | null;
};

function normalizeRows(rows: unknown): (string | number)[][] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    if (!Array.isArray(row)) return [];
    return row.map((cell) => {
      if (cell == null) return '';
      if (typeof cell === 'string' || typeof cell === 'number') return cell;
      return String(cell);
    });
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  let body: PreviewBody;
  try {
    body = (await request.json()) as PreviewBody;
  } catch {
    return fail('Corps de requête invalide', 400);
  }

  if (!body.title?.trim() || !Array.isArray(body.headers) || body.headers.length === 0) {
    return fail('Titre et en-têtes requis pour l’export PDF', 400);
  }

  const rows = normalizeRows(body.rows);
  const sessionUser = session.user as {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
  };
  const author = resolveOfficialDocumentAuthor({
    name: body.authorName ?? sessionUser.name,
    email: sessionUser.email,
    avatar: sessionUser.avatar,
  });

  const document: DatagridExportDocument = {
    title: body.title.trim(),
    subtitle: body.subtitle?.trim() || undefined,
    summary: body.summary ?? null,
    periodLabel: body.periodLabel?.trim() || 'Liste complète',
    generatedAt: body.generatedAt ?? new Date().toISOString(),
    authorName: author?.name ?? null,
    authorEmail: author?.email ?? null,
    authorAvatarUrl: author?.avatarUrl ?? null,
    headers: body.headers.map((header) => String(header)),
    rows,
    stats: body.stats,
  };

  const token = randomUUID();
  await setCache(
    `${DATAGRID_EXPORT_CACHE_PREFIX}${token}`,
    document,
    DATAGRID_EXPORT_TTL_SECONDS,
  );

  const origin = new URL(request.url).origin;
  const previewUrl = `${origin}/export/preview/${token}`;

  return ok({ token, previewUrl });
}
