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

    console.log('✅ Demo walkthrough seed OK');
    console.log(`   User: ${demoUser.email} / DemoWalk2026!`);
    console.log(`   Candidature: ${candidature.id}`);
    console.log(`   Session: ${session.id} (${DEMO_SESSION_LABEL})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
