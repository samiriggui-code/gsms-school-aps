import { NextRequest, NextResponse } from 'next/server';
import { LANDING_QUOTE_LEAD_SOURCE } from '@repo/database';
import { sendQuoteRequestEmails } from '@repo/mail';
import { createWorkflowEngine } from '@repo/api-core';
import {
  createDraftDevisFromLead,
  isFinanceAutoDevisFromLeadEnabled,
} from '@/lib/finance/create-draft-devis-from-lead';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = {
  requesterType?: 'entreprise' | 'particulier';
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  companySiret?: string;
  companyAddress?: string;
  contactRole?: string;
  traineesExpected?: string;
  preferredDates?: string;
  deliveryMode?: string;
  fundingHint?: string;
  message?: string;
  formationSlug?: string;
  formationName?: string;
  /** Anti-bot : doit rester vide */
  website?: string;
};

function clean(v: unknown) {
  return typeof v === 'string' ? v.trim() : '';
}

/** SIRET / SIREN français : chiffres uniquement si renseigné */
function normalizeSiret(raw: string): string {
  const digits = raw.replace(/\s/g, '').replace(/\D/g, '');
  return digits.slice(0, 14);
}

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ message: 'Corps JSON invalide.' }, { status: 400 });
  }

  if (clean(body.website)) {
    return NextResponse.json({ message: 'Refus.' }, { status: 400 });
  }

  const firstName = clean(body.firstName);
  const lastName = clean(body.lastName);
  const email = clean(body.email).toLowerCase();
  const phone = clean(body.phone);
  const company = clean(body.company);
  const companySiret = normalizeSiret(clean(body.companySiret));
  const companyAddress = clean(body.companyAddress).slice(0, 500);
  const contactRole = clean(body.contactRole).slice(0, 120);
  const traineesExpected = clean(body.traineesExpected).slice(0, 120);
  const preferredDates = clean(body.preferredDates).slice(0, 2000);
  const deliveryMode = clean(body.deliveryMode).slice(0, 80);
  const fundingHint = clean(body.fundingHint).slice(0, 500);
  const message = clean(body.message).slice(0, 4000);
  const formationSlug = clean(body.formationSlug);
  const formationNameFallback = clean(body.formationName);
  const requesterType = body.requesterType === 'particulier' ? 'particulier' : 'entreprise';

  if (!firstName || !lastName || !email || !phone || !formationSlug) {
    return NextResponse.json(
      { message: 'Nom, prénom, email, téléphone et formation sont obligatoires.' },
      { status: 400 },
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ message: 'Adresse email invalide.' }, { status: 400 });
  }

  if (requesterType === 'entreprise' && !company) {
    return NextResponse.json({ message: 'La raison sociale est obligatoire pour une entreprise.' }, { status: 400 });
  }

  if (requesterType === 'entreprise' && !traineesExpected) {
    return NextResponse.json(
      { message: 'Le nombre de stagiaires (ou fourchette) est obligatoire pour une entreprise.' },
      { status: 400 },
    );
  }

  const traineesResolved =
    traineesExpected || (requesterType === 'particulier' ? '1' : '');

  if (!preferredDates) {
    return NextResponse.json(
      { message: 'Indiquez une période ou des dates souhaitées.' },
      { status: 400 },
    );
  }

  const companyResolved =
    requesterType === 'particulier'
      ? company || `Particulier — ${firstName} ${lastName}`.trim()
      : company;

  if (companySiret && (companySiret.length < 9 || companySiret.length > 14)) {
    return NextResponse.json({ message: 'SIRET / SIREN : 9 à 14 chiffres si renseigné.' }, { status: 400 });
  }

  const formation = await prisma.formation.findFirst({
    where: { slug: formationSlug, status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      slug: true,
      catalogOffer: { select: { catalogStatus: true } },
    },
  });

  const catalogOk =
    !formation?.catalogOffer || formation.catalogOffer.catalogStatus === 'ACTIVE';

  const formationId = formation && catalogOk ? formation.id : null;
  const formationLabel =
    formation?.name ?? formationNameFallback ?? formationSlug;

  const notesSections = [
    '=== Formation demandée ===',
    `Slug CRM: ${formationSlug}`,
    `Libellé: ${formationLabel}`,
    formation && !catalogOk ? '⚠ Offre catalogue inactive — rattachement formation ignoré.' : '',
    !formation ? '⚠ Slug inconnu en base — à rapprocher manuellement du catalogue.' : '',
    '',
    '=== Type de demandeur ===',
    requesterType === 'particulier' ? 'Particulier' : 'Entreprise / organisme',
    '',
    '=== Contact ===',
    `${firstName} ${lastName}`,
    `Email: ${email}`,
    `Téléphone: ${phone}`,
    contactRole ? `Fonction: ${contactRole}` : '',
    '',
    requesterType === 'entreprise' ? '=== Entreprise / structure ===' : '=== Coordonnées ===',
    requesterType === 'entreprise' ? `Raison sociale: ${companyResolved}` : `Profil: ${companyResolved}`,
    companySiret ? `SIRET / SIREN: ${companySiret}` : '',
    companyAddress ? `Adresse / site d’intervention: ${companyAddress}` : '',
    '',
    '=== Projet & planning ===',
    `Nombre de stagiaires (estimation): ${traineesResolved}`,
    deliveryMode ? `Modalité souhaitée: ${deliveryMode}` : '',
    `Période ou dates souhaitées: ${preferredDates.replace(/\s*\n\s*/g, ' · ').trim()}`,
    fundingHint ? `Financement envisagé: ${fundingHint}` : '',
    '',
    message ? `=== Précisions complémentaires ===\n${message}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');

  const lead = await prisma.lead.create({
    data: {
      firstName,
      lastName,
      email,
      phone: phone || null,
      source: LANDING_QUOTE_LEAD_SOURCE,
      status: 'NEW',
      notes: notesSections,
      formationId,
    },
  });

  try {
    await sendQuoteRequestEmails(
      {
        firstName,
        lastName,
        email,
        phone,
        company: companyResolved,
        formationLabel,
        traineesExpected: traineesResolved,
        preferredDates: preferredDates.replace(/\s*\n\s*/g, ' · ').trim(),
        details: notesSections,
      },
      { assetsOrigin: process.env.NEXT_PUBLIC_SITE_URL },
    );
  } catch (e) {
    console.error('[quote-requests] e-mail non envoyé', e);
  }

  try {
    const workflows = createWorkflowEngine(prisma);
    await workflows.emit(
      'landing.quote.requested',
      {
        leadId: lead.id,
        firstName,
        lastName,
        email,
        phone,
        company: companyResolved,
        formationSlug,
        formationLabel,
        traineesExpected: traineesResolved,
        requesterType,
        deliveryMode,
        fundingHint,
      },
      { dedupeKey: `landing-quote:${lead.id}` },
    );
  } catch (e) {
    console.error('[quote-requests] workflow', e);
  }

  let autoDevis: { id: string; referenceCode: string } | null = null;
  if (isFinanceAutoDevisFromLeadEnabled()) {
    try {
      const draft = await createDraftDevisFromLead(prisma, lead.id);
      if (draft) {
        autoDevis = { id: draft.id, referenceCode: draft.referenceCode };
        try {
          const workflows = createWorkflowEngine(prisma);
          await workflows.emit(
            'crm.finance.devis.created',
            {
              devisId: draft.id,
              referenceCode: draft.referenceCode,
              title: draft.title,
              leadId: lead.id,
              source: 'landing.auto',
            },
            { dedupeKey: `workflow:devis-created:${draft.id}` },
          );
        } catch (e) {
          console.error('[quote-requests] auto-devis workflow', e);
        }
      }
    } catch (e) {
      console.error('[quote-requests] auto-devis', e);
    }
  }

  return NextResponse.json(
    {
      message: 'Demande enregistrée.',
      ...(autoDevis ? { devisId: autoDevis.id, devisReference: autoDevis.referenceCode } : {}),
    },
    { status: 201 },
  );
}
