import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { buildEdofCatalogXml } from '@/lib/connectors/edof/build-catalog-xml';
import {
  encodeLheoXmlIso8859_1,
  EdofIso88591EncodingError,
} from '@/lib/connectors/edof/encode-iso-8859-1';

/**
 * GET — export catalogue EDOF (LHEO XML_FILE, encoding ISO-8859-1).
 * `?format=json` → métadonnées + gaps.
 * défaut / `?format=xml` → fichier XML téléchargeable (bytes latin1).
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeView)) {
    return fail('Forbidden', 403);
  }

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get('format') ?? 'xml').toLowerCase();

  try {
    const result = await buildEdofCatalogXml(prisma);
    const blocking = result.gaps.filter((g) => g.severity === 'blocking').length;

    let xmlBytes: Buffer;
    try {
      xmlBytes = encodeLheoXmlIso8859_1(result.xml);
    } catch (e) {
      if (e instanceof EdofIso88591EncodingError) {
        return fail(e.message, 422, { offenders: e.offenders });
      }
      throw e;
    }

    if (format === 'json') {
      return ok({
        connector: 'EDOF_CATALOG',
        transport: ['XML_FILE', 'MANUAL_PORTAL'],
        encoding: 'ISO-8859-1',
        formationCount: result.formationCount,
        sessionCount: result.sessionCount,
        skippedFormations: result.skippedFormations,
        blockingGaps: blocking,
        gaps: result.gaps,
        xmlBytes: xmlBytes.byteLength,
      });
    }

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return new NextResponse(new Uint8Array(xmlBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=ISO-8859-1',
        'Content-Disposition': `attachment; filename="catalogue-edof-${stamp}.xml"`,
        'X-Edof-Formations': String(result.formationCount),
        'X-Edof-Blocking-Gaps': String(blocking),
        'X-Edof-Encoding': 'ISO-8859-1',
      },
    });
  } catch (e) {
    console.error('[edof catalog] GET', e);
    return fail('Failed to build EDOF catalog XML', 500);
  }
}
