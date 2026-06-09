import { NextRequest, NextResponse } from 'next/server';
import {
  CandidatureSource,
  CandidatureStatus,
  LANDING_PREINSCRIPTION_LEAD_SOURCE,
} from '@repo/database';
import { sendPreinscriptionEmails } from '@repo/mail';
import { createWorkflowEngine } from '@repo/api-core';
import { preinscriptionLabelForSlug } from '@/lib/preinscription-formation-options';
import prisma from '@/lib/prisma';

type PreinscriptionPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  birthPlace?: string;
  nationality?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  /** Slug CRM `Formation.slug` (recommandé). */
  formationSlug?: string;
  /** Libellé affiché (notes) — dérivé du slug si absent. */
  formationName?: string;
  /** Mode de financement souhaite (obligatoire pour pilotage des sessions / leads). */
  fundingMode?: string;
  /** Id session CRM si le candidat a choisi un créneau catalogue. */
  sessionId?: string;
  /** Période souhaitée si pas de session catalogue (ex. Mai 2026). */
  sessionLabel?: string;
  currentSituation?: string;
  experience?: string;
  motivation?: string;
  sourceContext?: string;
  hasValidIdentityDocument?: boolean;
  hasNoIncompatibleConviction?: boolean;
  meetsFormationPrerequisites?: boolean;
  acceptsInternalRules?: boolean;
  acknowledgesCnapsHandledBySchool?: boolean;
  certifiesInformationAccuracy?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toBool(value: unknown) {
  return value === true;
}

export async function POST(request: NextRequest) {
  let body: PreinscriptionPayload;

  try {
    body = (await request.json()) as PreinscriptionPayload;
  } catch {
    return NextResponse.json({ message: 'Corps JSON invalide.' }, { status: 400 });
  }

  const firstName = clean(body.firstName);
  const lastName = clean(body.lastName);
  const email = clean(body.email).toLowerCase();
  const phone = clean(body.phone);
  const birthDate = clean(body.birthDate);
  const birthPlace = clean(body.birthPlace);
  const nationality = clean(body.nationality);
  const address = clean(body.address);
  const postalCode = clean(body.postalCode);
  const city = clean(body.city);
  const formationSlug = clean(body.formationSlug);
  const formationNameInput = clean(body.formationName);
  const fundingMode = clean(body.fundingMode);
  const sessionId = clean(body.sessionId);
  const sessionLabel = clean(body.sessionLabel);
  const currentSituation = clean(body.currentSituation);
  const experience = clean(body.experience);
  const motivation = clean(body.motivation);
  const sourceContext = clean(body.sourceContext) || 'landing-preinscription';

  const hasValidIdentityDocument = toBool(body.hasValidIdentityDocument);
  const hasNoIncompatibleConviction = toBool(body.hasNoIncompatibleConviction);
  const meetsFormationPrerequisites = toBool(body.meetsFormationPrerequisites);
  const acceptsInternalRules = toBool(body.acceptsInternalRules);
  const acknowledgesCnapsHandledBySchool = toBool(body.acknowledgesCnapsHandledBySchool);
  const certifiesInformationAccuracy = toBool(body.certifiesInformationAccuracy);

  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !birthDate ||
    !birthPlace ||
    !nationality ||
    !address ||
    !postalCode ||
    !city ||
    !formationSlug ||
    !fundingMode ||
    !currentSituation
  ) {
    return NextResponse.json(
      {
        message:
          'Les informations candidat obligatoires sont manquantes (identite, adresse, formation, mode de financement, situation).',
      },
      { status: 400 },
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ message: 'Adresse email invalide.' }, { status: 400 });
  }

  if (
    !hasValidIdentityDocument ||
    !hasNoIncompatibleConviction ||
    !meetsFormationPrerequisites ||
    !acceptsInternalRules ||
    !acknowledgesCnapsHandledBySchool ||
    !certifiesInformationAccuracy
  ) {
    return NextResponse.json(
      {
        message:
          'Toutes les confirmations de conformite doivent etre valides avant envoi du dossier.',
      },
      { status: 400 },
    );
  }

  const candidatRole = await prisma.userRole.findFirst({
    where: { slug: 'candidat', isTrashed: false },
    select: { id: true },
  });

  if (!candidatRole) {
    return NextResponse.json({ message: 'Rôle candidat introuvable.' }, { status: 500 });
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
    formation?.name ??
    (formationNameInput ||
      preinscriptionLabelForSlug(formationSlug) ||
      formationSlug);

  let matchedSession: { id: string; dateDisplayLabel: string } | null = null;

  if (sessionId && formationId) {
    matchedSession = await prisma.formationSession.findFirst({
      where: { id: sessionId, formationId },
      select: { id: true, dateDisplayLabel: true },
    });

    if (!matchedSession) {
      return NextResponse.json(
        { message: 'Session sélectionnée introuvable pour cette formation.' },
        { status: 400 },
      );
    }
  } else if (sessionId && !formationId) {
    return NextResponse.json(
      {
        message:
          'Formation catalogue introuvable ou inactive — impossible de rattacher la session.',
      },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, roleId: true },
  });

  if (existingUser && existingUser.roleId !== candidatRole.id) {
    return NextResponse.json(
      { message: 'Cet email existe déjà sur un autre profil.' },
      { status: 409 },
    );
  }

  const user =
    existingUser ??
    (await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        phone: phone || null,
        roleId: candidatRole.id,
      },
      select: { id: true },
    }));

  const duplicate = await prisma.candidature.findFirst({
    where: {
      userId: user.id,
      formationId: formationId ?? null,
      interestedSessionId: matchedSession?.id ?? null,
      status: { not: CandidatureStatus.ARCHIVED },
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { message: 'Une préinscription similaire existe déjà.' },
      { status: 409 },
    );
  }

  const sessionNote = matchedSession
    ? `Session catalogue: ${matchedSession.dateDisplayLabel} (id ${matchedSession.id})`
    : sessionLabel
      ? `Période souhaitée: ${sessionLabel}`
      : '';

  const leadNotes = [
    `Canal: ${sourceContext}`,
    `Slug CRM: ${formationSlug}`,
    `Formation visée: ${formationLabel}`,
    formation && !catalogOk ? '⚠ Offre catalogue inactive — rattachement formation ignoré.' : '',
    !formation ? '⚠ Slug inconnu en base — à rapprocher manuellement du catalogue.' : '',
    fundingMode ? `Mode de financement souhaité: ${fundingMode}` : '',
    sessionNote,
    `Date de naissance: ${birthDate}`,
    `Lieu de naissance: ${birthPlace}`,
    `Nationalite: ${nationality}`,
    `Adresse: ${address}, ${postalCode} ${city}`,
    `Situation actuelle: ${currentSituation}`,
    experience ? `Experience: ${experience}` : '',
    motivation ? `Motivation: ${motivation}` : '',
    'Conformite: piece identite OK, casier compatible, prerequis verifies, reglement accepte, CNAPS gere par ecole, informations certifiees.',
  ]
    .filter(Boolean)
    .join('\n');

  const lead = await prisma.lead.create({
    data: {
      firstName,
      lastName,
      email,
      phone: phone || null,
      source: LANDING_PREINSCRIPTION_LEAD_SOURCE,
      notes: leadNotes || null,
      formationId,
    },
    select: { id: true },
  });

  const candidature = await prisma.candidature.create({
    data: {
      userId: user.id,
      leadId: lead.id,
      formationId,
      interestedSessionId: matchedSession?.id ?? null,
      source: CandidatureSource.LANDING_SESSION,
      status: CandidatureStatus.DRAFT,
      notes: leadNotes || null,
    },
    select: { id: true },
  });

  try {
    await sendPreinscriptionEmails(
      {
        firstName,
        lastName,
        email,
        phone,
        formationLabel,
        sessionNote: matchedSession
          ? matchedSession.dateDisplayLabel
          : sessionLabel || '',
        fundingMode,
        details: leadNotes,
      },
      { assetsOrigin: process.env.NEXT_PUBLIC_SITE_URL },
    );
  } catch (e) {
    console.error('[preinscription] e-mail non envoyé', e);
  }

  try {
    const workflows = createWorkflowEngine(prisma);
    await workflows.emit(
      'landing.preinscription.created',
      {
        candidatureId: candidature.id,
        leadId: lead.id,
        userId: user.id,
        firstName,
        lastName,
        email,
        phone,
        formationSlug,
        formationLabel,
        sessionId: matchedSession?.id ?? null,
        sessionLabel: matchedSession?.dateDisplayLabel ?? (sessionLabel || null),
        fundingMode,
        sourceContext,
      },
      { dedupeKey: `landing-preinscription:${candidature.id}` },
    );
  } catch (e) {
    console.error('[preinscription] workflow', e);
  }

  return NextResponse.json(
    {
      message: 'Préinscription enregistrée.',
      candidatureId: candidature.id,
    },
    { status: 201 },
  );
}
