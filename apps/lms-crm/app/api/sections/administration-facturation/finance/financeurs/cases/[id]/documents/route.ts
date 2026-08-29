import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

const DOC_STATUSES = new Set(['MISSING', 'UPLOADED', 'VALIDATED', 'REJECTED']);

type RouteParams = { params: Promise<{ id: string }> };

function slugCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
}

/** GET — liste FundingDocument d’un dossier. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id: caseId } = await params;
  const existing = await prisma.fundingCase.findUnique({ where: { id: caseId }, select: { id: true } });
  if (!existing) return fail('FundingCase not found', 404);

  const documents = await prisma.fundingDocument.findMany({
    where: { caseId },
    orderBy: { createdAt: 'asc' },
  });
  return ok(documents);
}

/** POST — ajouter une pièce checklist (CRUD manuel, pas de référentiel financeur). */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id: caseId } = await params;
  try {
    const existing = await prisma.fundingCase.findUnique({ where: { id: caseId }, select: { id: true } });
    if (!existing) return fail('FundingCase not found', 404);

    const body = (await request.json()) as {
      code?: string;
      label?: string;
      status?: string;
    };

    const label = body.label?.trim();
    if (!label) return fail('label required', 400);

    const code = slugCode(body.code?.trim() || label);
    if (!code) return fail('code required', 400);

    const status = body.status?.trim() || 'MISSING';
    if (!DOC_STATUSES.has(status)) return fail('Invalid status', 400);

    const created = await prisma.fundingDocument.create({
      data: { caseId, code, label, status },
    });
    return ok(created);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('Unique constraint') || msg.includes('unique')) {
      return fail('Document code already exists on this case', 409);
    }
    console.error('[financeurs/cases/documents] POST', e);
    return fail('Failed to create funding document', 500);
  }
}
