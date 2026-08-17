import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { FinanceDevisStatus, FinanceEinvoiceStatus } from '@repo/database';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { financeDecimalNum } from '@/lib/finance/finance-decimal';
import {
  assessEinvoiceReadiness,
  buildBuyerFromSnapshot,
  buildFacturXCiiXml,
  parseEinvoiceLines,
  type EinvoiceSellerProfile,
} from '@/lib/finance/factur-x';

type Ctx = { params: Promise<{ factureId: string }> };

async function loadSeller(): Promise<EinvoiceSellerProfile> {
  const settings = await prisma.systemSetting.findFirst({
    select: {
      name: true,
      siret: true,
      siren: true,
      vatIntracommunityNumber: true,
      address: true,
      companyCity: true,
      companyPostalCode: true,
    },
  });
  return {
    legalName: settings?.name?.trim() || 'Établissement',
    siret: settings?.siret ?? null,
    siren: settings?.siren ?? null,
    vatIntracommunityNumber: settings?.vatIntracommunityNumber ?? null,
    address: settings?.address ?? null,
    city: settings?.companyCity ?? null,
    postalCode: settings?.companyPostalCode ?? null,
    countryCode: 'FR',
  };
}

async function loadAcceptedFacture(factureId: string) {
  return prisma.financeDevis.findUnique({
    where: { id: factureId },
    include: {
      lead: { select: { firstName: true, lastName: true, email: true, phone: true } },
      formation: { select: { name: true } },
    },
  });
}

/** Contrôle de conformité e-facture (SIRET, lignes, montants…). */
export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { factureId } = await context.params;
  const row = await loadAcceptedFacture(factureId);
  if (!row) return fail('Dossier introuvable.', 404);
  if (row.status !== FinanceDevisStatus.ACCEPTED) {
    return fail('Seules les propositions acceptées peuvent être e-facturées.', 400);
  }

  const seller = await loadSeller();
  const { ready, issues } = assessEinvoiceReadiness({
    seller,
    clientSnapshot: row.clientSnapshot,
    lead: row.lead,
    lines: row.lines,
    subtotalHt: row.subtotalHt,
    totalTtc: row.totalTtc,
  });

  if (ready && row.einvoiceStatus === FinanceEinvoiceStatus.NOT_READY) {
    await prisma.financeDevis.update({
      where: { id: row.id },
      data: { einvoiceStatus: FinanceEinvoiceStatus.READY },
    });
  }

  return ok({
    factureId: row.id,
    referenceCode: row.referenceCode,
    einvoiceStatus: ready ? FinanceEinvoiceStatus.READY : row.einvoiceStatus,
    einvoiceProfile: row.einvoiceProfile,
    einvoiceGeneratedAt: row.einvoiceGeneratedAt,
    einvoicePdpMessageId: row.einvoicePdpMessageId,
    einvoiceLastError: row.einvoiceLastError,
    ready,
    issues,
    calendar: {
      receiveFrom: '2026-09-01',
      note:
        'Réception e-facture obligatoire au 1er sept. 2026 pour toutes les entreprises. Émission selon taille (GE dès sept. 2026).',
    },
  });
}

/**
 * Génère le XML Factur-X (CII) et le renvoie en téléchargement.
 * Query: ?download=1 (défaut) | ?persist=1 pour marquer GENERATED.
 */
export async function POST(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { factureId } = await context.params;
  const persist = request.nextUrl.searchParams.get('persist') !== '0';

  const row = await loadAcceptedFacture(factureId);
  if (!row) return fail('Dossier introuvable.', 404);
  if (row.status !== FinanceDevisStatus.ACCEPTED) {
    return fail('Seules les propositions acceptées peuvent être e-facturées.', 400);
  }

  const seller = await loadSeller();
  const readiness = assessEinvoiceReadiness({
    seller,
    clientSnapshot: row.clientSnapshot,
    lead: row.lead,
    lines: row.lines,
    subtotalHt: row.subtotalHt,
    totalTtc: row.totalTtc,
  });

  if (!readiness.ready) {
    await prisma.financeDevis.update({
      where: { id: row.id },
      data: {
        einvoiceStatus: FinanceEinvoiceStatus.NOT_READY,
        einvoiceLastError: readiness.issues
          .filter((i) => i.severity === 'error')
          .map((i) => i.message)
          .join(' · '),
      },
    });
    return fail('Dossier non prêt pour Factur-X.', 422, { issues: readiness.issues });
  }

  const buyer = buildBuyerFromSnapshot({
    clientSnapshot: row.clientSnapshot,
    lead: row.lead,
  });
  const lines = parseEinvoiceLines(row.lines);
  const xml = buildFacturXCiiXml({
    referenceCode: row.referenceCode,
    title: row.title,
    issueDate: row.updatedAt,
    currency: row.currency || 'EUR',
    lines,
    subtotalHt: financeDecimalNum(row.subtotalHt),
    vatTotal: financeDecimalNum(row.vatTotal),
    totalTtc: financeDecimalNum(row.totalTtc),
    notes: row.notes,
    seller,
    buyer,
  });

  if (persist) {
    await prisma.financeDevis.update({
      where: { id: row.id },
      data: {
        einvoiceStatus: FinanceEinvoiceStatus.GENERATED,
        einvoiceGeneratedAt: new Date(),
        einvoiceProfile: 'BASIC',
        einvoiceLastError: null,
      },
    });
  }

  const filename = `factur-x-${row.referenceCode}.xml`;
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Einvoice-Status': FinanceEinvoiceStatus.GENERATED,
    },
  });
}
