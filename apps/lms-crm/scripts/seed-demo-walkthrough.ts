/**
 * OPS-05 — seed idempotent pour parcours démo staff (~15 min).
 * Run: pnpm demo:seed
 */
import bcrypt from 'bcrypt';
import {
  CandidatureSource,
  CandidatureStatus,
  createPrismaClient,
  UserStatus,
} from '@repo/database';

const DEMO_PREFIX = 'DEMO — ';
const DEMO_CANDIDATE_EMAIL = 'demo.walkthrough.candidat@ecole.local';
const DEMO_SESSION_LABEL = `${DEMO_PREFIX}Session TFP APS (walkthrough)`;
const DEMO_BPF_SESSION_LABEL = `${DEMO_PREFIX}Session BPF (exercice démo)`;

async function main() {
  const prisma = createPrismaClient('demo-seed');

  try {
    const eleveRole = await prisma.userRole.findFirst({ where: { slug: 'eleve' } });
    if (!eleveRole) throw new Error('Rôle eleve introuvable — db:seed requis.');

    const formation = await prisma.formation.findFirst({
      where: { slug: 'tfp-aps' },
      select: { id: true },
    });
    if (!formation) throw new Error('Formation tfp-aps introuvable — db:seed requis.');

    const passwordHash = await bcrypt.hash('DemoWalk2026!', 10);

    const demoUser = await prisma.user.upsert({
      where: { email: DEMO_CANDIDATE_EMAIL },
      create: {
        email: DEMO_CANDIDATE_EMAIL,
        proEmail: DEMO_CANDIDATE_EMAIL,
        name: `${DEMO_PREFIX}Candidat Walkthrough`,
        firstName: 'Candidat',
        lastName: 'Walkthrough',
        password: passwordHash,
        status: UserStatus.ACTIVE,
        roleId: eleveRole.id,
      },
      update: {
        name: `${DEMO_PREFIX}Candidat Walkthrough`,
        status: UserStatus.ACTIVE,
      },
    });

    let candidature = await prisma.candidature.findFirst({
      where: {
        userId: demoUser.id,
        notes: { contains: DEMO_PREFIX },
      },
    });

    if (!candidature) {
      candidature = await prisma.candidature.create({
        data: {
          userId: demoUser.id,
          formationId: formation.id,
          source: CandidatureSource.MANUAL,
          status: CandidatureStatus.SUBMITTED,
          notes: `${DEMO_PREFIX}Dossier créé par seed-demo-walkthrough.ts`,
        },
      });
    } else {
      candidature = await prisma.candidature.update({
        where: { id: candidature.id },
        data: {
          formationId: formation.id,
          notes: `${DEMO_PREFIX}Dossier créé par seed-demo-walkthrough.ts`,
        },
      });
    }

    const start = new Date();
    start.setDate(start.getDate() + 14);
    const end = new Date(start);
    end.setDate(end.getDate() + 5);

    let session = await prisma.formationSession.findFirst({
      where: { dateDisplayLabel: DEMO_SESSION_LABEL },
      select: { id: true },
    });

    if (!session) {
      session = await prisma.formationSession.create({
        data: {
          formationId: formation.id,
          dateDisplayLabel: DEMO_SESSION_LABEL,
          location: `${DEMO_PREFIX}Centre GSMS`,
          startDate: start,
          endDate: end,
          bookingEnabled: true,
          sortOrder: 999,
        },
        select: { id: true },
      });
    } else {
      await prisma.formationSession.update({
        where: { id: session.id },
        data: { startDate: start, endDate: end, bookingEnabled: true },
      });
    }

    await prisma.candidature.update({
      where: { id: candidature.id },
      data: { interestedSessionId: session.id },
    });

    await prisma.formationSessionParticipant.upsert({
      where: {
        sessionId_userId: { sessionId: session.id, userId: demoUser.id },
      },
      create: {
        sessionId: session.id,
        userId: demoUser.id,
        candidatureId: candidature.id,
      },
      update: { candidatureId: candidature.id },
    });

    const bpfYear = new Date().getUTCFullYear() - 1;
    const bpfStart = new Date(Date.UTC(bpfYear, 5, 10));
    const bpfEnd = new Date(Date.UTC(bpfYear, 5, 14));

    let bpfSession = await prisma.formationSession.findFirst({
      where: { dateDisplayLabel: DEMO_BPF_SESSION_LABEL },
      select: { id: true },
    });

    if (!bpfSession) {
      bpfSession = await prisma.formationSession.create({
        data: {
          formationId: formation.id,
          dateDisplayLabel: DEMO_BPF_SESSION_LABEL,
          location: `${DEMO_PREFIX}Centre GSMS`,
          startDate: bpfStart,
          endDate: bpfEnd,
          sortOrder: 998,
        },
        select: { id: true },
      });
    } else {
      await prisma.formationSession.update({
        where: { id: bpfSession.id },
        data: { startDate: bpfStart, endDate: bpfEnd },
      });
    }

    const bpfParticipant = await prisma.formationSessionParticipant.upsert({
      where: {
        sessionId_userId: { sessionId: bpfSession.id, userId: demoUser.id },
      },
      create: {
        sessionId: bpfSession.id,
        userId: demoUser.id,
        candidatureId: candidature.id,
        fundingMode: 'CPF',
      },
      update: { candidatureId: candidature.id, fundingMode: 'CPF' },
    });

    const bpfDay = await prisma.formationSessionDay.upsert({
      where: {
        sessionId_dayDate: { sessionId: bpfSession.id, dayDate: bpfStart },
      },
      create: { sessionId: bpfSession.id, dayDate: bpfStart },
      update: {},
    });

    await prisma.formationSessionEmargement.upsert({
      where: {
        dayId_participantId_slot: {
          dayId: bpfDay.id,
          participantId: bpfParticipant.id,
          slot: 'MORNING',
        },
      },
      create: {
        dayId: bpfDay.id,
        participantId: bpfParticipant.id,
        slot: 'MORNING',
        status: 'PRESENT',
        markedAt: bpfStart,
      },
      update: { status: 'PRESENT' },
    });

    await prisma.formation.update({
      where: { id: formation.id },
      data: { hoursMin: 35, hoursMax: 35 },
    });

    let cpfProvider = await prisma.fundingProvider.findFirst({
      where: { funderType: 'CPF' },
      select: { id: true },
    });
    if (!cpfProvider) {
      cpfProvider = await prisma.fundingProvider.create({
        data: {
          code: 'DEMO_CPF',
          label: `${DEMO_PREFIX}CPF démo`,
          funderType: 'CPF',
          transport: 'MANUAL_PORTAL',
        },
        select: { id: true },
      });
    }

    const existingFunding = await prisma.fundingCase.findFirst({
      where: {
        sessionId: bpfSession.id,
        participantId: bpfParticipant.id,
        notes: { contains: DEMO_PREFIX },
      },
      select: { id: true },
    });

    if (!existingFunding) {
      await prisma.fundingCase.create({
        data: {
          providerId: cpfProvider.id,
          sessionId: bpfSession.id,
          participantId: bpfParticipant.id,
          learnerUserId: demoUser.id,
          funderType: 'CPF',
          transport: 'MANUAL_PORTAL',
          status: 'APPROVED',
          requestedAmount: 1200,
          approvedAmount: 1200,
          notes: `${DEMO_PREFIX}Dossier CPF pour démo BPF exercice ${bpfYear}`,
        },
      });
    }

    console.log('✅ Demo walkthrough seed OK');
    console.log(`   User: ${demoUser.email} / DemoWalk2026!`);
    console.log(`   Candidature: ${candidature.id}`);
    console.log(`   Session: ${session.id} (${DEMO_SESSION_LABEL})`);
    console.log(`   BPF demo: session ${bpfSession.id} — exercice ${bpfYear}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
