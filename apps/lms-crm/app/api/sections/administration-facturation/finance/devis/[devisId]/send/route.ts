import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { FinanceDevisStatus } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { sendEmail, ensureEmailAssetsOrigin } from '@/services/send-email';
import { isPlaquettePublicLinkConfigured, signPlaquettePublicToken } from '@/lib/devis-plaquette-public-token';
import { absolutePublicPlaquetteUrl } from '@/lib/devis-plaquette-public-url';
import { renderDevisQuoteEmailHtml } from '@/lib/render-devis-quote-email';
import { createWorkflowEngine } from '@repo/api-core';
import { resolveDevisClientContact } from '@/lib/finance/resolve-devis-client-contact';
import { createPlaquetteMessageRow } from '@/lib/devis-plaquette-messages-query';

type Ctx = { params: Promise<{ devisId: string }> };

function decimalNum(d: unknown): number {
  if (d == null) return 0;
  return typeof d === 'object' && d !== null && 'toNumber' in d
    ? (d as { toNumber: () => number }).toNumber()
    : Number(d);
}

function moneyFr(value: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(value);
}

type Body = { message?: string };

/** Envoie le récapitulatif du devis par e-mail (plaquette + PDF) et passe le statut à SENT si brouillon. */
export async function POST(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { devisId } = await context.params;

  let body: Body = {};
  try {
    if (request.headers.get('content-length') && Number(request.headers.get('content-length')) > 0) {
      body = (await request.json()) as Body;
    }
  } catch {
    body = {};
  }

  try {
    const row = await prisma.financeDevis.findUnique({
      where: { id: devisId },
      include: {
        lead: { select: { email: true, firstName: true, lastName: true, phone: true } },
      },
    });
    if (!row) return fail('Devis introuvable.', 404);

    if (row.status !== FinanceDevisStatus.DRAFT && row.status !== FinanceDevisStatus.SENT) {
      return fail('Seuls les devis en brouillon ou déjà envoyés peuvent faire l’objet d’un envoi e-mail.', 409);
    }

    const contact = resolveDevisClientContact({
      lead: row.lead,
      clientSnapshot: row.clientSnapshot,
    });
    if (!contact.email) {
      return fail(
        'Aucun e-mail destinataire : renseignez le contact lead ou l’e-mail dans le contexte client du devis.',
        400,
      );
    }

    const lines = Array.isArray(row.lines) ? (row.lines as Record<string, unknown>[]) : [];
    const lineRows = lines.map((l) => {
      const label = typeof l.label === 'string' ? l.label : '';
      const qty = Number(l.quantity ?? 1) || 0;
      const unit = Number(l.unitPriceHt ?? 0) || 0;
      const vat = Number(l.vatRate ?? 0) || 0;
      const ht = qty * unit;
      return {
        label,
        qty: String(qty),
        unit: moneyFr(unit, row.currency),
        vat: `${vat}%`,
        ht: moneyFr(ht, row.currency),
      };
    });

    let plaquetteUrl: string | null = null;
    let plaquettePdfUrl: string | null = null;
    if (row.formationId && isPlaquettePublicLinkConfigured()) {
      try {
        const exp = Date.now() + 60 * 86400000;
        const token = signPlaquettePublicToken(devisId, exp);
        plaquetteUrl = absolutePublicPlaquetteUrl(request, devisId, token);
        plaquettePdfUrl = `${plaquetteUrl}&print=1`;
      } catch {
        plaquetteUrl = null;
        plaquettePdfUrl = null;
      }
    }

    const intro = (body.message ?? '').trim();
    const introLines = intro.length > 0 ? intro.split(/\r?\n/).filter((s) => s.length > 0) : null;

    ensureEmailAssetsOrigin(process.env.NEXT_PUBLIC_SITE_URL);

    const html = await renderDevisQuoteEmailHtml({
      firstName: contact.firstName || 'Madame, Monsieur',
      lastName: contact.lastName,
      introLines,
      referenceCode: row.referenceCode,
      title: row.title,
      lines: lineRows,
      totalTtc: moneyFr(decimalNum(row.totalTtc), row.currency),
      plaquetteUrl,
      plaquettePdfUrl,
    });

    await sendEmail({
      to: contact.email,
      subject: `Votre devis ${row.referenceCode}`,
      html,
    });

    const wasDraft = row.status === FinanceDevisStatus.DRAFT;
    if (wasDraft) {
      await prisma.financeDevis.update({
        where: { id: devisId },
        data: { status: FinanceDevisStatus.SENT },
      });
    }

    const staffLabel =
      typeof session.user?.name === 'string' && session.user.name.trim()
        ? session.user.name.trim()
        : 'Équipe commerciale';

    const messageBody = [
      `Devis ${row.referenceCode} envoyé par e-mail à ${contact.email}.`,
      plaquetteUrl ? 'Lien page client (plaquette + messagerie) inclus dans l’e-mail.' : 'Pas de lien plaquette (formation non liée ou secret non configuré).',
      intro ? `Message d’accompagnement : ${intro}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    await createPlaquetteMessageRow({
      devisId,
      authorKind: 'STAFF',
      authorLabel: staffLabel,
      body: messageBody,
    });

    try {
      const workflows = createWorkflowEngine(prisma);
      await workflows.emit(
        'crm.finance.devis.sent',
        {
          devisId,
          referenceCode: row.referenceCode,
          leadEmail: contact.email,
        },
        { dedupeKey: `workflow:devis-sent:${devisId}` },
      );
    } catch (e) {
      console.error('[finance-devis send] workflow', e);
    }

    return ok({
      sent: true,
      status: wasDraft ? FinanceDevisStatus.SENT : row.status,
      recipientEmail: contact.email,
      plaquetteUrl,
      plaquettePdfUrl,
      resent: !wasDraft,
    });
  } catch (e) {
    console.error('[finance-devis send]', e);
    return fail('Envoi impossible.', 500, e);
  }
}
