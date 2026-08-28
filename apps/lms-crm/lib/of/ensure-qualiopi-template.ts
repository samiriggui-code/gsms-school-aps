import { prisma } from '@/lib/prisma';
import {
  QUALIOPI_INDICATORS_V9,
  QUALIOPI_REFERENTIAL_VERSION,
} from '@/lib/of/qualiopi-indicators';

/**
 * Garantit le template DocumentRequirementTemplate SCHOOL_QUALIOPI (32 indicateurs)
 * même si le seed n'a pas tourné en prod — idempotent.
 */
export async function ensureQualiopiSchoolTemplate(): Promise<void> {
  const kind = 'SCHOOL_QUALIOPI' as const;
  const existing = await prisma.documentRequirementTemplate.findUnique({
    where: { kind },
    select: { id: true, _count: { select: { items: true } } },
  });
  if (existing && existing._count.items >= QUALIOPI_INDICATORS_V9.length) return;

  if (!existing) {
    await prisma.documentRequirementTemplate.create({
      data: {
        kind,
        label: `Audit Qualiopi école — référentiel ${QUALIOPI_REFERENTIAL_VERSION}`,
        description:
          'Classeur des 32 indicateurs Qualiopi (V.9). Preuves = FileAsset liés aux items.',
        moduleKey: 'support-qualite',
        items: {
          create: QUALIOPI_INDICATORS_V9.map((ind) => ({
            code: ind.code,
            label: `I${String(ind.indicator).padStart(2, '0')} — ${ind.label}`,
            description: ind.description,
            fileCategory: `QUALIOPI_${ind.code}`,
            uploadedBy: 'ADMIN',
            required: ind.required !== false,
            sortOrder: ind.indicator * 10,
            conditions: {
              criterion: ind.criterion,
              indicator: ind.indicator,
              referentialVersion: QUALIOPI_REFERENTIAL_VERSION,
              auditStatuses: ['OK', 'KO', 'TO_FIX', 'NA'],
            },
          })),
        },
      },
    });
    return;
  }

  // Template présent mais items incomplets — complète les codes manquants
  const present = await prisma.documentRequirementTemplateItem.findMany({
    where: { templateId: existing.id },
    select: { code: true },
  });
  const presentCodes = new Set(present.map((p) => p.code));
  const missing = QUALIOPI_INDICATORS_V9.filter((ind) => !presentCodes.has(ind.code));
  if (missing.length === 0) return;

  await prisma.documentRequirementTemplateItem.createMany({
    data: missing.map((ind) => ({
      templateId: existing.id,
      code: ind.code,
      label: `I${String(ind.indicator).padStart(2, '0')} — ${ind.label}`,
      description: ind.description,
      fileCategory: `QUALIOPI_${ind.code}`,
      uploadedBy: 'ADMIN',
      required: ind.required !== false,
      sortOrder: ind.indicator * 10,
      conditions: {
        criterion: ind.criterion,
        indicator: ind.indicator,
        referentialVersion: QUALIOPI_REFERENTIAL_VERSION,
        auditStatuses: ['OK', 'KO', 'TO_FIX', 'NA'],
      },
    })),
  });
}
