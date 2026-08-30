import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { FinanceEinvoiceStatus } from '@repo/database';
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
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

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

/** Charge une facture émise — 404 si absente (jamais de lazy-create). */
async function loadInvoice(factureId: string) {
  return prisma.financeInvoice.findUnique({
    where: { id: factureId },
    include: {
      devis: {
        include: {
          lead: { select: { firstName: true, lastName: true, email: true, phone: true } },
          formation: { select: { name: true } },
        },
      },
    },
  });
}

/** Contrôle de conformité e-facture — GET pur (pas d’écriture). */
export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeView)) {
    return fail('Forbidden', 403);
  }

  const { factureId } = await context.params;
  const invoice = await loadInvoice(factureId);
  if (!invoice) return fail('Facture introuvable.', 404);

  const devis = invoice.devis;
  const seller = await loadSeller();
  const { ready, issues } = assessEinvoiceReadiness({
    seller,
    clientSnapshot: devis.clientSnapshot,
    lead: devis.lead,
    lines: invoice.lines,
    subtotalHt: invoice.subtotalHt,
    totalTtc: invoice.totalTtc,
  });

  return ok({
    factureId: invoice.id,
    referenceCode: invoice.number,
    einvoiceStatus: invoice.einvoiceStatus,
    einvoiceProfile: invoice.einvoiceProfile,
    einvoiceGeneratedAt: invoice.einvoiceGeneratedAt,
    einvoicePdpMessageId: invoice.einvoicePdpMessageId,
    einvoiceLastError: invoice.einvoiceLastError,
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
 * Génère le XML Factur-X (CII).
 * Query: ?download=1 (défaut) | ?persist=0 pour ne pas marquer GENERATED.
 */
export async function POST(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeEdit)) {
    return fail('Forbidden', 403);
  }

  const { factureId } = await context.params;
  const persist = request.nextUrl.searchParams.get('persist') !== '0';

  const invoice = await loadInvoice(factureId);
  if (!invoice) return fail('Facture introuvable.', 404);

  const devis = invoice.devis;
  const seller = await loadSeller();
  const readiness = assessEinvoiceReadiness({
    seller,
    clientSnapshot: devis.clientSnapshot,
    lead: devis.lead,
    lines: invoice.lines,
    subtotalHt: invoice.subtotalHt,
    totalTtc: invoice.totalTtc,
  });

  if (!readiness.ready) {
    await prisma.financeInvoice.update({
      where: { id: invoice.id },
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
    clientSnapshot: devis.clientSnapshot,
    lead: devis.lead,
  });
  const lines = parseEinvoiceLines(invoice.lines);
  const xml = buildFacturXCiiXml({
    referenceCode: invoice.number,
    title: devis.title,
    issueDate: invoice.issuedAt,
    currency: invoice.currency || 'EUR',
    lines,
    subtotalHt: financeDecimalNum(invoice.subtotalHt),
    vatTotal: financeDecimalNum(invoice.vatTotal),
    totalTtc: financeDecimalNum(invoice.totalTtc),
    notes: invoice.notes ?? devis.notes,
    seller,
    buyer,
  });

  if (persist) {
    await prisma.financeInvoice.update({
      where: { id: invoice.id },
      data: {
        einvoiceStatus: FinanceEinvoiceStatus.GENERATED,
        einvoiceGeneratedAt: new Date(),
        einvoiceProfile: 'BASIC',
        einvoiceLastError: null,
      },
    });
  }

  const filename = `factur-x-${invoice.number}.xml`;
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Einvoice-Status': FinanceEinvoiceStatus.GENERATED,
    },
  });
}
