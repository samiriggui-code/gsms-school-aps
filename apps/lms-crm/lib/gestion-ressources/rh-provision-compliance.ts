/**
 * Provisionne les dossiers conformité à la création d'un collaborateur / formateur.
 */
import { prisma } from '@/lib/prisma';
import { ComplianceService } from '@repo/api-core/compliance-service';

const compliance = new ComplianceService(prisma);

export async function provisionStaffComplianceDossiers(userId: string, roleSlug: string) {
  const subjectType = roleSlug === 'formateur' ? 'FORMATEUR' : 'COLLABORATEUR';

  await compliance.ensureDossier({
    kind: 'COLLABORATEUR_ONBOARDING',
    subjectType,
    subjectId: userId,
    userId,
  });

  if (roleSlug === 'formateur') {
    await compliance.ensureDossier({
      kind: 'FORMATEUR_HABILITATION',
      subjectType: 'FORMATEUR',
      subjectId: userId,
      userId,
    });
  }
}
