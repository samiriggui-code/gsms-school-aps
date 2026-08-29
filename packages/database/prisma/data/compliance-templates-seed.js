/**
 * Catalogue conformité documentaire — templates admission, CNAPS, onboarding collaborateur,
 * + référentiel Qualiopi école (32 indicateurs V.9).
 * Aligné sur CNAPS_DOSSIER_SLOTS (apps/lms-crm/.../cnaps-dossier-documents.ts).
 * Qualiopi : packages/database/prisma/data/qualiopi-indicators-v9.js (GSMS-OF-05).
 */

const {
  QUALIOPI_REFERENTIAL_VERSION,
  QUALIOPI_INDICATORS_V9,
} = require('./qualiopi-indicators-v9');

/** Identifiant sujet fixe (mono-établissement) pour le dossier Qualiopi école — GSMS-OF-05. */
const QUALIOPI_SCHOOL_SUBJECT_ID = 'school-default';

const QUALIOPI_SCHOOL_TEMPLATE = {
  kind: 'SCHOOL_QUALIOPI',
  label: `Audit Qualiopi école — référentiel ${QUALIOPI_REFERENTIAL_VERSION}`,
  description:
    'Classeur des 32 indicateurs Qualiopi (V.9). Statuts d’item : MISSING / VALIDATED / REJECTED (preuve). Audit métier OK/KO/À réparer/NA stocké dans conditions.auditStatuses. Preuves = FileAsset liés aux objets session (GSMS-OF-05).',
  moduleKey: 'support-qualite',
  items: QUALIOPI_INDICATORS_V9.map((ind) => ({
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
};

const TEMPLATES = [
  {
    kind: 'CANDIDATURE_ADMISSION',
    label: 'Dossier admission candidat',
    description: 'Pièces administratives pour instruction du dossier d’entrée formation.',
    moduleKey: 'gouvernance-donnees',
    items: [
      {
        code: 'CNI',
        label: 'Carte nationale d’identité',
        description: 'Pièce d’identité en cours de validité.',
        fileCategory: 'CNI',
        uploadedBy: 'SUBJECT',
        sortOrder: 10,
      },
      {
        code: 'PHOTO',
        label: 'Photo d’identité',
        description: 'Photo récente pour le dossier.',
        fileCategory: 'PHOTO',
        uploadedBy: 'SUBJECT',
        sortOrder: 20,
      },
      {
        code: 'ASSURANCE',
        label: 'Attestation d’assurance',
        description: 'Responsabilité civile ou assurance professionnelle.',
        fileCategory: 'ASSURANCE',
        uploadedBy: 'SUBJECT',
        sortOrder: 30,
      },
      {
        code: 'RESIDENCE_PERMIT',
        label: 'Titre de séjour',
        description: 'Si applicable — titre en cours de validité.',
        fileCategory: 'RESIDENCE_PERMIT',
        uploadedBy: 'SUBJECT',
        expiresField: 'residencePermitExpiry',
        conditions: { requiresResidencePermit: true },
        sortOrder: 40,
      },
      {
        code: 'CARTE_PRO',
        label: 'Carte professionnelle',
        description: 'Carte pro CNAPS ou équivalent si déjà titulaire.',
        fileCategory: 'CARTE_PRO',
        uploadedBy: 'SUBJECT',
        expiresField: 'carteProExpiry',
        sortOrder: 50,
      },
    ],
  },
  {
    kind: 'CANDIDATURE_CNAPS',
    label: 'Dossier CNAPS candidat',
    description: 'Pièces pour dépôt et suivi CNAPS.',
    moduleKey: 'gouvernance-donnees',
    items: [
      {
        code: 'CNAPS_FORM_OF',
        label: 'Formulaire CNAPS signé et cacheté',
        description: 'Formulaire officiel visé par l’organisme de formation.',
        fileCategory: 'CNAPS_FORM_OF',
        uploadedBy: 'SCHOOL',
        sortOrder: 10,
      },
      {
        code: 'CNAPS_IDENTITY',
        label: 'Pièce d’identité',
        description: 'Document en cours de validité (notice CNAPS).',
        fileCategory: 'CNAPS_IDENTITY',
        uploadedBy: 'SUBJECT',
        sortOrder: 20,
      },
      {
        code: 'CNAPS_JUSTIFICATIFS',
        label: 'Justificatifs administratifs',
        description: 'Bulletin ou autorisations requis.',
        fileCategory: 'CNAPS_JUSTIFICATIFS',
        uploadedBy: 'SUBJECT',
        sortOrder: 30,
      },
      {
        code: 'CNAPS_DIVERS',
        label: 'Autres pièces',
        description: 'Photographie, titre de séjour, pièces complémentaires.',
        fileCategory: 'CNAPS_DIVERS',
        uploadedBy: 'SUBJECT',
        sortOrder: 40,
      },
      {
        code: 'CNAPS_AUTHORIZATION',
        label: 'Autorisation CNAPS délivrée',
        description: 'Document officiel après décision favorable.',
        fileCategory: 'CNAPS_AUTHORIZATION',
        uploadedBy: 'SCHOOL',
        sortOrder: 50,
      },
    ],
  },
  {
    kind: 'COLLABORATEUR_ONBOARDING',
    label: 'Onboarding collaborateur',
    description: 'Dossier RH à la création d’un collaborateur interne.',
    moduleKey: 'gestion-ressources',
    items: [
      {
        code: 'CNI',
        label: 'Pièce d’identité',
        fileCategory: 'CNI',
        uploadedBy: 'SUBJECT',
        sortOrder: 10,
      },
      {
        code: 'CONTRAT',
        label: 'Contrat de travail signé',
        fileCategory: 'CONTRAT',
        uploadedBy: 'RH',
        sortOrder: 20,
      },
      {
        code: 'RIB',
        label: 'RIB / coordonnées bancaires',
        fileCategory: 'RIB',
        uploadedBy: 'SUBJECT',
        sortOrder: 30,
      },
      {
        code: 'MUTUELLE',
        label: 'Bulletin d’adhésion mutuelle',
        fileCategory: 'MUTUELLE',
        uploadedBy: 'SUBJECT',
        sortOrder: 40,
      },
      {
        code: 'CARTE_PRO',
        label: 'Carte professionnelle',
        fileCategory: 'CARTE_PRO',
        uploadedBy: 'SUBJECT',
        expiresField: 'carteProExpiry',
        sortOrder: 50,
      },
    ],
  },
  {
    kind: 'FORMATEUR_HABILITATION',
    label: 'Habilitation formateur',
    description: 'Diplômes et habilitations pédagogiques.',
    moduleKey: 'gestion-ressources',
    items: [
      {
        code: 'DIPLOMES',
        label: 'Diplômes et certifications',
        fileCategory: 'DIPLOMES',
        uploadedBy: 'SUBJECT',
        sortOrder: 10,
      },
      {
        code: 'HABILITATION',
        label: 'Habilitations métier (SST, SSIAP…)',
        fileCategory: 'HABILITATION',
        uploadedBy: 'SUBJECT',
        sortOrder: 20,
      },
      {
        code: 'KBIS',
        label: 'Extrait Kbis (sous-traitant)',
        fileCategory: 'KBIS',
        uploadedBy: 'SUBJECT',
        required: false,
        conditions: { isSubcontractor: true },
        sortOrder: 30,
      },
    ],
  },
  {
    kind: 'E_FORMATION_ACCESS',
    label: 'Accès e-formation',
    description: 'Pièces requises pour activer l’accès au parcours en ligne.',
    moduleKey: 'gouvernance-donnees',
    items: [
      {
        code: 'CNI',
        label: 'Pièce d’identité',
        fileCategory: 'CNI',
        uploadedBy: 'SUBJECT',
        sortOrder: 10,
      },
      {
        code: 'CGU',
        label: 'Acceptation CGU e-formation',
        fileCategory: 'CGU',
        uploadedBy: 'SUBJECT',
        sortOrder: 20,
      },
    ],
  },
  QUALIOPI_SCHOOL_TEMPLATE,
  {
    kind: 'SUBCONTRACTOR_QUALIFICATION',
    label: 'Qualification sous-traitant (WF-39)',
    description:
      'Pièces de qualification prestataire / sous-traitant. Le cycle PENDING_VALIDATION→SUSPENDED vit sur SubcontractorRecord, pas sur ce dossier.',
    moduleKey: 'gestion-ressources',
    items: [
      {
        code: 'KBIS',
        label: 'Extrait Kbis',
        fileCategory: 'KBIS',
        uploadedBy: 'SUBJECT',
        sortOrder: 10,
      },
      {
        code: 'ASSURANCE_RC',
        label: 'Assurance RC professionnelle',
        fileCategory: 'ASSURANCE_RC',
        uploadedBy: 'SUBJECT',
        sortOrder: 20,
      },
      {
        code: 'CONTRAT',
        label: 'Contrat de sous-traitance',
        fileCategory: 'CONTRAT',
        uploadedBy: 'SCHOOL',
        sortOrder: 30,
      },
      {
        code: 'QUALIOPI_ATTEST',
        label: 'Attestation conformité Qualiopi (si applicable)',
        fileCategory: 'QUALIOPI_ATTEST',
        uploadedBy: 'SUBJECT',
        required: false,
        sortOrder: 40,
      },
      {
        code: 'COMPETENCES',
        label: 'Preuves compétences / habilitations',
        fileCategory: 'COMPETENCES',
        uploadedBy: 'SUBJECT',
        sortOrder: 50,
},
  ],
  },
  {
    kind: 'DISABILITY_REFERENT',
    label: 'Référent handicap — maintenance (WF-40)',
    description:
      'Checklist Qualiopi référent handicap : procédures, ressources, formations du référent, actions. Le contact référent vit dans SystemSetting (disabilityReferent*).',
    moduleKey: 'gestion-ressources',
    items: [
      {
        code: 'PROCEDURE_ACCUEIL',
        label: 'Procédure d’accueil / orientation PSH à jour',
        fileCategory: 'DISABILITY_PROCEDURE',
        uploadedBy: 'ADMIN',
        sortOrder: 10,
      },
      {
        code: 'RESSOURCES_OUTILS',
        label: 'Ressources / outils d’adaptation recensés',
        fileCategory: 'DISABILITY_RESOURCES',
        uploadedBy: 'ADMIN',
        sortOrder: 20,
      },
      {
        code: 'PARTENAIRES_RESEAU',
        label: 'Réseau partenaires (Cap emploi, AGEFIPH…) identifié',
        fileCategory: 'DISABILITY_PARTNERS',
        uploadedBy: 'ADMIN',
        sortOrder: 30,
      },
      {
        code: 'FORMATION_REFERENT',
        label: 'Formation / sensibilisation du référent handicap',
        fileCategory: 'DISABILITY_TRAINING',
        uploadedBy: 'ADMIN',
        sortOrder: 40,
      },
      {
        code: 'ACTION_LOG',
        label: 'Actions d’accompagnement réalisées (preuve / compte-rendu)',
        fileCategory: 'DISABILITY_ACTION',
        uploadedBy: 'ADMIN',
        sortOrder: 50,
      },
    ],
  },
];

async function upsertTemplate(prisma, tpl) {
  const template = await prisma.documentRequirementTemplate.upsert({
    where: { kind: tpl.kind },
    create: {
      kind: tpl.kind,
      label: tpl.label,
      description: tpl.description,
      moduleKey: tpl.moduleKey,
      isActive: true,
    },
    update: {
      label: tpl.label,
      description: tpl.description,
      moduleKey: tpl.moduleKey,
      isActive: true,
    },
  });

  for (const item of tpl.items) {
    await prisma.documentRequirementTemplateItem.upsert({
      where: {
        templateId_code: { templateId: template.id, code: item.code },
      },
      create: {
        templateId: template.id,
        code: item.code,
        label: item.label,
        description: item.description ?? null,
        required: item.required !== false,
        fileCategory: item.fileCategory,
        uploadedBy: item.uploadedBy ?? 'SUBJECT',
        expiresField: item.expiresField ?? null,
        sortOrder: item.sortOrder ?? 0,
        conditions: item.conditions ?? {},
      },
      update: {
        label: item.label,
        description: item.description ?? null,
        required: item.required !== false,
        fileCategory: item.fileCategory,
        uploadedBy: item.uploadedBy ?? 'SUBJECT',
        expiresField: item.expiresField ?? null,
        sortOrder: item.sortOrder ?? 0,
        conditions: item.conditions ?? {},
      },
    });
  }

  return template;
}

/** Crée ou met à jour les templates catalogue conformité. */
async function seedComplianceTemplates(prisma) {
  for (const tpl of TEMPLATES) {
    await upsertTemplate(prisma, tpl);
  }
  console.log(`Templates conformité : ${TEMPLATES.length} modèles de dossier.`);
}

/** Instancie les dossiers admission + CNAPS pour les candidatures ouvertes démo. */
async function seedComplianceDossiersForOpenCandidatures(prisma) {
  const openStatuses = ['DRAFT', 'SUBMITTED', 'MISSING_DOCUMENTS', 'VALIDATION_PENDING'];
  const kinds = ['CANDIDATURE_ADMISSION', 'CANDIDATURE_CNAPS'];
  const candidatures = await prisma.candidature.findMany({
    where: { status: { in: openStatuses } },
    select: { id: true, userId: true },
    take: 50,
  });

  let created = 0;
  for (const c of candidatures) {
    for (const kind of kinds) {
      const existing = await prisma.complianceDossier.findUnique({
        where: {
          kind_subjectType_subjectId: {
            kind,
            subjectType: 'CANDIDATURE',
            subjectId: c.id,
          },
        },
      });
      if (existing) continue;

      const template = await prisma.documentRequirementTemplate.findUnique({
        where: { kind },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      });
      if (!template) continue;

      await prisma.complianceDossier.create({
        data: {
          kind,
          subjectType: 'CANDIDATURE',
          subjectId: c.id,
          userId: c.userId,
          candidatureId: c.id,
          items: {
            create: template.items.map((ti) => ({
              templateItemId: ti.id,
              code: ti.code,
              label: ti.label,
              fileCategory: ti.fileCategory,
              required: ti.required,
              uploadedBy: ti.uploadedBy,
              status: 'MISSING',
            })),
          },
          events: {
            create: {
              eventType: 'DOSSIER_CREATED',
              payload: { kind, source: 'seed' },
            },
          },
        },
      });
      created += 1;
    }
  }
  if (created > 0) {
    console.log(`Dossiers conformité instanciés (seed) : ${created}.`);
  }
}

/** Instancie onboarding + habilitation pour collaborateurs / formateurs actifs. */
async function seedComplianceDossiersForStaff(prisma) {
  const staff = await prisma.user.findMany({
    where: {
      isTrashed: false,
      status: 'ACTIVE',
      role: { slug: { in: ['collaborateur', 'formateur', 'admin'] } },
    },
    select: { id: true, role: { select: { slug: true } } },
    take: 100,
  });

  let created = 0;
  for (const u of staff) {
    const subjectType = u.role?.slug === 'formateur' ? 'FORMATEUR' : 'COLLABORATEUR';
    const kinds = ['COLLABORATEUR_ONBOARDING'];
    if (u.role?.slug === 'formateur') kinds.push('FORMATEUR_HABILITATION');

    for (const kind of kinds) {
      const existing = await prisma.complianceDossier.findUnique({
        where: {
          kind_subjectType_subjectId: {
            kind,
            subjectType,
            subjectId: u.id,
          },
        },
      });
      if (existing) continue;

      const template = await prisma.documentRequirementTemplate.findUnique({
        where: { kind },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      });
      if (!template) continue;

      await prisma.complianceDossier.create({
        data: {
          kind,
          subjectType,
          subjectId: u.id,
          userId: u.id,
          items: {
            create: template.items.map((ti) => ({
              templateItemId: ti.id,
              code: ti.code,
              label: ti.label,
              fileCategory: ti.fileCategory,
              required: ti.required,
              uploadedBy: ti.uploadedBy,
              status: 'MISSING',
            })),
          },
          events: {
            create: {
              eventType: 'DOSSIER_CREATED',
              payload: { kind, source: 'seed-staff' },
            },
          },
        },
      });
      created += 1;
    }
  }
  if (created > 0) {
    console.log(`Dossiers conformité staff (seed) : ${created}.`);
  }
}

/** Instancie (une fois) le dossier Qualiopi école — GSMS-OF-05. */
async function seedComplianceDossierForSchool(prisma) {
  const kind = 'SCHOOL_QUALIOPI';
  const subjectType = 'SCHOOL';
  const subjectId = QUALIOPI_SCHOOL_SUBJECT_ID;

  const existing = await prisma.complianceDossier.findUnique({
    where: { kind_subjectType_subjectId: { kind, subjectType, subjectId } },
  });
  if (existing) return;

  const template = await prisma.documentRequirementTemplate.findUnique({
    where: { kind },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!template) return;

  await prisma.complianceDossier.create({
    data: {
      kind,
      subjectType,
      subjectId,
      items: {
        create: template.items.map((ti) => ({
          templateItemId: ti.id,
          code: ti.code,
          label: ti.label,
          fileCategory: ti.fileCategory,
          required: ti.required,
          uploadedBy: ti.uploadedBy,
          status: 'MISSING',
        })),
      },
      events: {
        create: {
          eventType: 'DOSSIER_CREATED',
          payload: { kind, subjectType, source: 'seed-school' },
        },
      },
    },
  });
  console.log('Dossier conformité Qualiopi école instancié (seed).');
}

module.exports = {
  TEMPLATES,
  QUALIOPI_SCHOOL_TEMPLATE,
  QUALIOPI_REFERENTIAL_VERSION,
  QUALIOPI_SCHOOL_SUBJECT_ID,
  seedComplianceTemplates,
  seedComplianceDossiersForOpenCandidatures,
  seedComplianceDossiersForStaff,
  seedComplianceDossierForSchool,
};
