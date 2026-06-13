import { CandidatureStatus, Prisma } from '@repo/database';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../../_lib/require-gestion-ressources-auth';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

export async function GET() {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

const baseWhere: Prisma.UserWhereInput = {
    isTrashed: false,
    role: { slug: { in: ['candidat', 'eleve'] }, isTrashed: false },
  };
  const terminal = [
    CandidatureStatus.VALIDATED,
    CandidatureStatus.COMPLETED,
    CandidatureStatus.ARCHIVED,
    CandidatureStatus.REJECTED,
  ];

  const [total, avecSession, dossierValide, dossierEnAttente, sansDossier] = await Promise.all([
    prisma.user.count({ where: baseWhere }),
    prisma.user.count({
      where: { ...baseWhere, formationSessionParticipants: { some: {} } },
    }),
    prisma.user.count({
      where: { ...baseWhere, candidatures: { some: { status: CandidatureStatus.VALIDATED } } },
    }),
    prisma.user.count({
      where: {
        ...baseWhere,
        candidatures: { some: { status: { notIn: terminal } } },
      },
    }),
    prisma.user.count({
      where: { ...baseWhere, candidatures: { none: {} } },
    }),
  ]);

  return ok({
    total,
    avecSession,
    dossierValide,
    dossierEnAttente,
    sansDossier,
  });
}
