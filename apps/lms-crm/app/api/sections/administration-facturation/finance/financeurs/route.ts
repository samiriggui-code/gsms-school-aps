import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { syncFundingProvidersFromConnectors } from '@/lib/funding/sync-providers-from-matrix';

async function loadConnectorFile(): Promise<{ connectors: Array<Record<string, unknown>> }> {
  const candidates = [
    path.join(process.cwd(), '../../docs/regulatory-sources/connector-matrix/connector-capabilities.json'),
    path.join(process.cwd(), 'docs/regulatory-sources/connector-matrix/connector-capabilities.json'),
  ];
  for (const file of candidates) {
    try {
      const raw = await readFile(file, 'utf8');
      return JSON.parse(raw) as { connectors: Array<Record<string, unknown>> };
    } catch {
      /* try next */
    }
  }
  return { connectors: [] };
}

/** GET — liste FundingProvider + compteurs de dossiers. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const providers = await prisma.fundingProvider.findMany({
      orderBy: { label: 'asc' },
      include: { _count: { select: { cases: true } } },
    });
    const caseCount = await prisma.fundingCase.count();
    return ok({
      providers: providers.map((p) => ({
        id: p.id,
        code: p.code,
        label: p.label,
        funderType: p.funderType,
        transport: p.transport,
        isActive: p.isActive,
        caseCount: p._count.cases,
      })),
      caseCount,
    });
  } catch (e) {
    console.error('[financeurs] GET', e);
    return fail('Failed to list funding providers', 500);
  }
}

/** POST — sync providers depuis la matrice connecteurs (idempotent upsert). */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const data = await loadConnectorFile();
    const connectors = (data.connectors ?? []).map((c) => ({
      connector_id: String(c.connector_id ?? ''),
      funder: String(c.funder ?? ''),
      transport: Array.isArray(c.transport) ? (c.transport as string[]) : [],
      api_available: Boolean(c.api_available),
      verification_level: c.verification_level ? String(c.verification_level) : undefined,
    }));
    const result = await syncFundingProvidersFromConnectors(prisma, connectors);
    const providers = await prisma.fundingProvider.findMany({ orderBy: { label: 'asc' } });
    return ok({ ...result, providers });
  } catch (e) {
    console.error('[financeurs] POST sync', e);
    return fail('Failed to sync funding providers', 500);
  }
}
