import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { listDocumentAuditTrail } from '@/lib/governance/document-audit-trail';
import type { DocumentAuditSource } from '@/lib/governance/document-audit-trail';

const SOURCES = new Set<DocumentAuditSource | 'all'>(['all', 'compliance', 'file', 'version']);

function parseDate(value: string | null): Date | undefined {
  if (!value?.trim()) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const sp = request.nextUrl.searchParams;
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 15, 1), 100);
  const q = (sp.get('q') ?? '').trim() || undefined;
  const sourceParam = (sp.get('source') ?? 'all').trim() as DocumentAuditSource | 'all';
  const source = SOURCES.has(sourceParam) ? sourceParam : 'all';
  const eventType = (sp.get('eventType') ?? '').trim() || undefined;
  const module = (sp.get('module') ?? '').trim() || undefined;
  const entityType = (sp.get('entityType') ?? '').trim() || undefined;
  const dateFrom = parseDate(sp.get('dateFrom'));
  const dateTo = parseDate(sp.get('dateTo'));

  try {
    const result = await listDocumentAuditTrail({
      page,
      limit,
      q,
      source,
      eventType,
      module,
      entityType,
      dateFrom,
      dateTo,
    });
    return ok(result);
  } catch (e) {
    return fail('Impossible de charger le journal documentaire.', 500, e);
  }
}
