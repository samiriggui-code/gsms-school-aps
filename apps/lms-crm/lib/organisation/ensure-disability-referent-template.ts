import { ComplianceDossierKind } from '@repo/database';
import { prisma } from '@/lib/prisma';

const KIND = ComplianceDossierKind.DISABILITY_REFERENT;

const ITEMS = [
  {
    code: 'PROCEDURE_ACCUEIL',
    label: 'Procédure d’accueil / orientation PSH à jour',
    fileCategory: 'DISABILITY_PROCEDURE',
    sortOrder: 10,
  },
  {
    code: 'RESSOURCES_OUTILS',
    label: 'Ressources / outils d’adaptation recensés',
    fileCategory: 'DISABILITY_RESOURCES',
    sortOrder: 20,
  },
  {
    code: 'PARTENAIRES_RESEAU',
    label: 'Réseau partenaires (Cap emploi, AGEFIPH…) identifié',
    fileCategory: 'DISABILITY_PARTNERS',
    sortOrder: 30,
  },
  {
    code: 'FORMATION_REFERENT',
    label: 'Formation / sensibilisation du référent handicap',
    fileCategory: 'DISABILITY_TRAINING',
    sortOrder: 40,
  },
  {
    code: 'ACTION_LOG',
    label: 'Actions d’accompagnement réalisées (preuve / compte-rendu)',
    fileCategory: 'DISABILITY_ACTION',
    sortOrder: 50,
  },
] as const;

/**
 * Garantit le template DocumentRequirementTemplate DISABILITY_REFERENT (WF-40)
 * même si le seed n’a pas tourné — idempotent.
 */
export async function ensureDisabilityReferentTemplate(): Promise<void> {
  const existing = await prisma.documentRequirementTemplate.findUnique({
    where: { kind: KIND },
    select: { id: true, _count: { select: { items: true } } },
  });
  if (existing && existing._count.items >= ITEMS.length) return;

  if (!existing) {
    await prisma.documentRequirementTemplate.create({
      data: {
        kind: KIND,
        label: 'Référent handicap — maintenance (WF-40)',
        description:
          'Checklist Qualiopi référent handicap. Contact dans SystemSetting (disabilityReferent*).',
        moduleKey: 'gestion-ressources',
        items: {
          create: ITEMS.map((item) => ({
            code: item.code,
            label: item.label,
            fileCategory: item.fileCategory,
            uploadedBy: 'ADMIN',
            required: true,
            sortOrder: item.sortOrder,
          })),
        },
      },
    });
    return;
  }

  const present = await prisma.documentRequirementTemplateItem.findMany({
    where: { templateId: existing.id },
    select: { code: true },
  });
  const presentCodes = new Set(present.map((p) => p.code));
  const missing = ITEMS.filter((item) => !presentCodes.has(item.code));
  if (missing.length === 0) return;

  await prisma.documentRequirementTemplateItem.createMany({
    data: missing.map((item) => ({
      templateId: existing.id,
      code: item.code,
      label: item.label,
      fileCategory: item.fileCategory,
      uploadedBy: 'ADMIN',
      required: true,
      sortOrder: item.sortOrder,
    })),
  });
}
