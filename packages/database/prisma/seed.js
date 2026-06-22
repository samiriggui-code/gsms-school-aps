/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

/** Charger DATABASE_URL quand le seed est lancé via `node ...` (sans Prisma CLI). */
function loadRootEnv() {
  const candidates = [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../.env'),
  ];
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
    break;
  }
}

loadRootEnv();

const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { PrismaClient } = require(path.join(__dirname, '../generated/client'));
const bcrypt = require('bcrypt');
const rolesData = require('./data/roles');
const usersData = require('./data/users');
const permissionsData = require('./data/permissions');
const { CRM_PERMISSIONS } = require('./data/crm-role-permissions');
const { seedFormationsCatalog } = require('./data/formations-seed');
const { seedPortalLmsContent, seedPortalLmsEnrollments, seedPortalAnnouncements } = require('./data/portal-lms-seed');
const { FORMATION_VENUE_ROOMS } = require('./data/formation-venue-rooms-seed');
const { seedLandingLeadsAndDevis } = require('./data/landing-leads-devis-seed');
const { seedOperationalModules } = require('./data/operational-modules-seed');
const { seedTopbarDemo } = require('./data/topbar-seed');
const { seedGsmsOpsChat } = require('./data/gsms-ops-chat-seed');
const { seedRhAbsencesAndPositions } = require('./data/rh-absences-positions-seed');
const {
  seedComplianceTemplates,
  seedComplianceDossiersForOpenCandidatures,
  seedComplianceDossiersForStaff,
} = require('./data/compliance-templates-seed');
const { seedRhStructureTeams } = require('./data/rh-structure-teams-seed');
const { seedRhMetierReferential } = require('./data/rh-metier-referential-seed');
const { seedCnapsCandidatProfiles } = require('./data/cnaps-candidat-profile-seed');
const {
  resolveEmailPair,
  ensureUserEmailSplit,
  findUserByAppLogin,
} = require('./data/user-email-fields');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function toEmail(fullName) {
  return (
    fullName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/(^\.|\.$)/g, '') + '@ecole.local'
  );
}

function splitFullName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

const STAFF_ROLE_SLUGS = new Set(['formateur', 'collaborateur', 'admin', 'superadmin']);

function resolveSeedAvatar(user, index) {
  if (user.avatar) return user.avatar;
  if (STAFF_ROLE_SLUGS.has(user.roleSlug)) {
    const pool = [
      '/uploads/crm/collaborateur/7fb47851-008f-44a4-9eed-301bb8ed3553/avatar/1781390225224-hd5za7yw.png',
      '/uploads/crm/collaborateur/f51130ba-32ba-48e6-aba7-f43bf58508d9/avatar/1781390463820-zq5m6um2.png',
      '/uploads/crm/collaborateur/1b0486b9-50cb-4820-8929-507fc6699681/avatar/1781390448477-gbi4z8g9.png',
      '/uploads/company/avatars/1781389770744-xiymfnfs.png',
    ];
    return pool[index % pool.length];
  }
  return user.avatar ?? null;
}

function buildUsersFromMetronic() {
  const base = usersData.map((u) => ({
    name: u.name,
    email: toEmail(u.name),
    avatar: u.avatar ? '/media/avatars/' + u.avatar : null,
    roleSlug: 'candidat',
  }));

  // 1 admin choisi parmi la liste existante
  if (base[0]) base[0].roleSlug = 'admin';

  // 2 collaborateurs
  if (base[1]) base[1].roleSlug = 'collaborateur';
  if (base[2]) base[2].roleSlug = 'collaborateur';

  // 5 formateurs
  if (base[3]) base[3].roleSlug = 'formateur';
  if (base[4]) base[4].roleSlug = 'formateur';
  if (base[5]) base[5].roleSlug = 'formateur';
  if (base[6]) base[6].roleSlug = 'formateur';
  if (base[7]) base[7].roleSlug = 'formateur';

  // le reste : comptes apprenants en parcours = rôle « candidat » (conformité CNAPS puis formation)
  for (let i = 8; i < base.length; i += 1) {
    base[i].roleSlug = 'candidat';
  }

  return [
    {
      name: 'Samir Iggui',
      email: 'samir.iggui@ecole.local',
      avatar: null,
      roleSlug: 'superadmin',
      isProtected: true,
    },
    // Comptes démo espace candidat (boutons /signin — mot de passe seed : demo1234)
    {
      name: 'Candidat Dev 1',
      email: 'candidat.dev.1@ecole.local',
      avatar: null,
      roleSlug: 'candidat',
    },
    {
      name: 'Candidat Dev 2',
      email: 'candidat.dev.2@ecole.local',
      avatar: null,
      roleSlug: 'candidat',
    },
    {
      name: 'Stagiaire Dev 1',
      email: 'stagiaire.dev.1@ecole.local',
      avatar: null,
      roleSlug: 'eleve',
    },
    ...base,
  ];
}

/** Dossiers démo pour l’espace candidat (/mon-dossier). */
async function seedDemoPortalCandidatures(tx) {
  const formation = await tx.formation.findFirst({
    where: { slug: 'tfp-aps' },
    select: { id: true, name: true, priceFrom: true, currency: true },
  });
  if (!formation) {
    console.warn('[seed] demo-portal-candidatures: formation tfp-aps introuvable — ignoré.');
    return;
  }

  const session = await tx.formationSession.findFirst({
    where: { formationId: formation.id },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, dateDisplayLabel: true },
  });

  const demoTrainer = await findUserByAppLogin(tx, 'formateur.dev.1@ecole.local');

  if (demoTrainer && session?.id) {
    await tx.formationSession.update({
      where: { id: session.id },
      data: { trainerUserId: demoTrainer.id },
    });

    await tx.user.update({
      where: { id: demoTrainer.id },
      data: {
        firstName: 'Laurent',
        lastName: 'Dubois',
        name: 'Laurent Dubois',
        avatar: '/media/avatars/300-1.png',
        jobFunction: 'Formateur TFP APS & BP ARS',
        qualification:
          "Ancien gendarme reconverti, 18 ans d'expérience en sécurité privée. Formateur TFP APS et BP ARS, il prépare les futurs agents aux réalités du terrain avec rigueur et professionnalisme.",
        phone: '+33 6 12 34 56 78',
        email: 'laurent.dubois@form-ssi.fr',
        proEmail: 'formateur.dev.1@ecole.local',
      },
    });

    await tx.formateurProfile.upsert({
      where: { userId: demoTrainer.id },
      create: {
        userId: demoTrainer.id,
        isInternal: true,
        speciality: 'TFP APS · Surveillance · CNAPS',
        specialties: ['TFP APS', 'SST', 'Gestion des conflits', 'Sécurité incendie'],
        certifications: [
          'Carte professionnelle CNAPS — activité surveillance',
          'Formateur certifié INRS (SST)',
          'Qualiopi — intervenant référent',
        ],
        pedagogicalReferences: [
          "Formateur principal sur les sessions TFP APS depuis 2018.",
          'Interventions en entreprise sur la prévention des risques professionnels.',
        ],
        yearsOfExperience: 18,
        metadata: {
          portalBio:
            "Ancien gendarme reconverti, Laurent Dubois cumule 18 ans d'expérience en sécurité privée et en formation professionnelle. Spécialiste du TFP APS et du BP ARS, il met l'accent sur la mise en situation réelle, la déontologie CNAPS et la préparation aux épreuves finales. Ses stagiaires apprécient sa pédagogie directe et son exigence bienveillante.",
        },
      },
      update: {
        isInternal: true,
        speciality: 'TFP APS · Surveillance · CNAPS',
        specialties: ['TFP APS', 'SST', 'Gestion des conflits', 'Sécurité incendie'],
        certifications: [
          'Carte professionnelle CNAPS — activité surveillance',
          'Formateur certifié INRS (SST)',
          'Qualiopi — intervenant référent',
        ],
        pedagogicalReferences: [
          "Formateur principal sur les sessions TFP APS depuis 2018.",
          'Interventions en entreprise sur la prévention des risques professionnels.',
        ],
        yearsOfExperience: 18,
        metadata: {
          portalBio:
            "Ancien gendarme reconverti, Laurent Dubois cumule 18 ans d'expérience en sécurité privée et en formation professionnelle. Spécialiste du TFP APS et du BP ARS, il met l'accent sur la mise en situation réelle, la déontologie CNAPS et la préparation aux épreuves finales. Ses stagiaires apprécient sa pédagogie directe et son exigence bienveillante.",
        },
      },
    });
  }

  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  const demoPdfUrl =
    'https://www.cnaps.interieur.gouv.fr/contenu/telechargement/5034/42210/file/20260210%20Formulaire%20d%27autorisation%20pr%C3%A9alable%20ou%20provisoire%20d%27entr%C3%A9e%20en%20formation.pdf';

  async function seedCnapsFiles(userId, files) {
    await tx.fileAsset.deleteMany({
      where: { module: 'portal-candidat', entityType: 'User', entityId: userId },
    });
    for (const f of files) {
      await tx.fileAsset.create({
        data: {
          module: 'portal-candidat',
          entityType: 'User',
          entityId: userId,
          category: f.category,
          originalName: f.name,
          mimeType: 'application/pdf',
          size: 4096,
          storageKey: `academique/cnaps/${userId}/${f.category}/${f.name}`,
          url: demoPdfUrl,
          visibility: 'PRIVATE',
          metadata: f.metadata ?? {},
        },
      });
    }
  }

  const demos = [
    {
      email: 'candidat.dev.1@ecole.local',
      status: 'DRAFT',
      source: 'LANDING_SESSION',
      fundingMode: 'CPF (Mon Compte Formation)',
      metadata: { fundingMode: 'CPF (Mon Compte Formation)' },
      notes: `Dossier démo seed — ${formation.name}\nMode de financement souhaité: CPF (Mon Compte Formation)`,
      createdAt: daysAgo(12),
      cnapsFiles: [
        {
          category: 'CNAPS_IDENTITY',
          name: 'cni-candidat-dev-1.pdf',
          metadata: { schoolVerified: false },
        },
      ],
    },
    {
      email: 'candidat.dev.2@ecole.local',
      status: 'PENDING_CNAPS',
      source: 'LANDING_SESSION',
      fundingMode: 'OPCO entreprise',
      metadata: {
        fundingMode: 'OPCO entreprise',
        submittedAt: daysAgo(8).toISOString(),
      },
      notes: `Dossier démo seed — ${formation.name}\nMode de financement souhaité: OPCO entreprise`,
      createdAt: daysAgo(21),
      cnapsSubmittedAt: daysAgo(5),
      cnapsReference: 'CNAPS-DEMO-2026-0042',
      cnapsPrefavorable: null,
      cnapsFiles: [
        {
          category: 'CNAPS_IDENTITY',
          name: 'cni-candidat-dev-2.pdf',
          metadata: { schoolVerified: true, verifiedAt: daysAgo(10).toISOString() },
        },
        {
          category: 'CNAPS_JUSTIFICATIFS',
          name: 'casier-candidat-dev-2.pdf',
          metadata: { schoolVerified: true, verifiedAt: daysAgo(10).toISOString() },
        },
        {
          category: 'CNAPS_DIVERS',
          name: 'photo-candidat-dev-2.pdf',
          metadata: { schoolVerified: true, verifiedAt: daysAgo(9).toISOString() },
        },
        {
          category: 'CNAPS_FORM_OF',
          name: 'formulaire-cnaps-vise-ecole.pdf',
          metadata: { schoolVerified: true, verifiedAt: daysAgo(6).toISOString() },
        },
      ],
    },
    {
      email: 'stagiaire.dev.1@ecole.local',
      status: 'VALIDATED',
      source: 'MANUAL',
      fundingMode: 'Pôle emploi / France Travail',
      metadata: {
        fundingMode: 'Pôle emploi / France Travail',
        submittedAt: daysAgo(45).toISOString(),
        dossierSubmittedAt: daysAgo(45).toISOString(),
      },
      notes: `Dossier démo seed — ${formation.name}\nMode de financement souhaité: Pôle emploi / France Travail`,
      createdAt: daysAgo(60),
      cnapsSubmittedAt: daysAgo(30),
      cnapsReference: 'CNAPS-DEMO-2026-0018',
      cnapsPrefavorable: true,
      cnapsDecisionAt: daysAgo(28),
      validatedAt: daysAgo(14),
      withDevis: true,
      enrollSession: true,
      cnapsFiles: [
        {
          category: 'CNAPS_IDENTITY',
          name: 'cni-stagiaire-dev-1.pdf',
          metadata: { schoolVerified: true, verifiedAt: daysAgo(40).toISOString() },
        },
        {
          category: 'CNAPS_JUSTIFICATIFS',
          name: 'casier-stagiaire-dev-1.pdf',
          metadata: { schoolVerified: true, verifiedAt: daysAgo(40).toISOString() },
        },
        {
          category: 'CNAPS_DIVERS',
          name: 'photo-stagiaire-dev-1.pdf',
          metadata: { schoolVerified: true, verifiedAt: daysAgo(39).toISOString() },
        },
        {
          category: 'CNAPS_FORM_OF',
          name: 'formulaire-cnaps-vise-ecole.pdf',
          metadata: { schoolVerified: true, verifiedAt: daysAgo(35).toISOString() },
        },
        {
          category: 'CNAPS_AUTHORIZATION',
          name: 'autorisation-cnaps-favorable.pdf',
          metadata: { schoolVerified: true, verifiedAt: daysAgo(28).toISOString() },
        },
      ],
    },
  ];

  for (const demo of demos) {
    const user = await tx.user.findUnique({
      where: { email: demo.email },
      select: { id: true },
    });
    if (!user) continue;

    await tx.financeDevis.deleteMany({ where: { candidature: { userId: user.id } } });
    await tx.candidature.deleteMany({ where: { userId: user.id } });

    const candidature = await tx.candidature.create({
      data: {
        userId: user.id,
        formationId: formation.id,
        interestedSessionId: session?.id ?? null,
        source: demo.source,
        status: demo.status,
        notes: demo.notes,
        metadata: demo.metadata,
        createdAt: demo.createdAt,
        cnapsSubmittedAt: demo.cnapsSubmittedAt ?? null,
        cnapsReference: demo.cnapsReference ?? null,
        cnapsPrefavorable: demo.cnapsPrefavorable ?? null,
        cnapsDecisionAt: demo.cnapsDecisionAt ?? null,
        validatedAt: demo.validatedAt ?? null,
      },
      select: { id: true },
    });

    if (demo.withDevis) {
      const price = formation.priceFrom != null ? Number(formation.priceFrom) : 1190;
      const vatRate = 20;
      const subtotalHt = price;
      const vatTotal = Math.round(subtotalHt * vatRate) / 100;
      const totalTtc = subtotalHt + vatTotal;
      await tx.financeDevis.create({
        data: {
          referenceCode: `DEV-PORTAL-${user.id.slice(0, 8).toUpperCase()}`,
          title: `Devis ${formation.name} — dossier candidat`,
          status: 'SENT',
          candidatureId: candidature.id,
          formationId: formation.id,
          formationSessionId: session?.id ?? null,
          clientSnapshot: {
            fundingHint: demo.fundingMode,
            preferredDates: session?.dateDisplayLabel ?? null,
          },
          lines: [
            {
              label: formation.name,
              quantity: 1,
              unitPriceHt: subtotalHt,
              vatRate,
            },
          ],
          subtotalHt,
          vatTotal,
          totalTtc,
          currency: formation.currency ?? 'EUR',
          validUntil: new Date(now.getFullYear(), 11, 31),
        },
      });
    }

    if (demo.cnapsFiles?.length) {
      await seedCnapsFiles(user.id, demo.cnapsFiles);
    }

    if (
      session?.id &&
      (demo.status === 'VALIDATED' || demo.status === 'COMPLETED') &&
      demo.enrollSession
    ) {
      await tx.formationSessionParticipant.upsert({
        where: {
          sessionId_userId: { sessionId: session.id, userId: user.id },
        },
        create: {
          sessionId: session.id,
          userId: user.id,
          candidatureId: candidature.id,
          enrollmentStatus: 'CONFIRMED',
        },
        update: {
          candidatureId: candidature.id,
          enrollmentStatus: 'CONFIRMED',
        },
      });
    }
  }
  console.log('Candidatures démo portail candidat seedées.');
}

function buildLargeUsers() {
  const users = buildUsersFromMetronic();

  // Add a larger deterministic dataset for development.
  for (let i = 1; i <= 120; i += 1) {
    users.push({
      name: `Candidat Dev ${i}`,
      email: `candidat.dev.${i}@ecole.local`,
      avatar: null,
      roleSlug: 'candidat',
    });
  }

  for (let i = 1; i <= 40; i += 1) {
    users.push({
      name: `Formateur Dev ${i}`,
      email: `formateur.dev.${i}@ecole.local`,
      avatar: null,
      roleSlug: 'formateur',
    });
  }

  for (let i = 1; i <= 20; i += 1) {
    users.push({
      name: `Collaborateur Dev ${i}`,
      email: `collaborateur.dev.${i}@ecole.local`,
      avatar: null,
      roleSlug: 'collaborateur',
    });
  }

  for (let i = 1; i <= 5; i += 1) {
    users.push({
      name: `Admin Dev ${i}`,
      email: `admin.dev.${i}@ecole.local`,
      avatar: null,
      roleSlug: 'admin',
    });
  }

  return users;
}

/** Anciennes clés plates `demo-cnaps-{uuid}-{cat}` → socle `academique/cnaps/…`. */
async function migrateLegacyCnapsStorageKeys(tx) {
  const legacy = await tx.fileAsset.findMany({
    where: { storageKey: { startsWith: 'demo-cnaps-' } },
    select: {
      id: true,
      storageKey: true,
      originalName: true,
      entityId: true,
      category: true,
    },
  });
  for (const asset of legacy) {
    if (!asset.entityId || !asset.category) continue;
    const storageKey = `academique/cnaps/${asset.entityId}/${asset.category}/${asset.originalName}`;
    if (storageKey === asset.storageKey) continue;
    await tx.fileAsset.update({
      where: { id: asset.id },
      data: { storageKey },
    });
  }
}

async function main() {
  console.log('Running database seeding...');

  await prisma.$transaction(
    async (tx) => {
      const hashedPassword = await bcrypt.hash('demo1234', 10);

      await tx.userRole.upsert({
        where: { slug: 'member' },
        update: { isTrashed: true, isDefault: false },
        create: {
          slug: 'member',
          name: 'Member',
          description: 'Rôle Metronic legacy (masqué)',
          isDefault: false,
          isProtected: true,
          isTrashed: true,
          createdAt: new Date(),
        },
      });

      const legacyMetronicSlugs = [
        'vendor',
        'customer',
        'guest',
        'manager',
        'staff',
        'support',
        'member',
        'owner',
      ];

      for (const role of rolesData) {
        const isLegacyMetronic = legacyMetronicSlugs.includes(role.slug);
        await tx.userRole.upsert({
          where: { slug: role.slug },
          update: { isTrashed: isLegacyMetronic },
          create: {
            slug: role.slug,
            name: role.name,
            description: role.description,
            isDefault: role.isDefault || false,
            isProtected: role.isProtected || false,
            isTrashed: isLegacyMetronic,
            createdAt: new Date(),
          },
        });
      }

      // Roles metier requis
      const businessRoles = [
        {
          slug: 'superadmin',
          name: 'Super Admin',
          description: 'Administration globale',
          isProtected: true,
        },
        {
          slug: 'admin',
          name: 'Admin école',
          description: 'Administration de l\'école (hors configuration système)',
          isProtected: true,
        },
        {
          slug: 'collaborateur',
          name: 'Collaborateur',
          description: 'Collaborateur CRM',
          isProtected: true,
        },
        {
          slug: 'formateur',
          name: 'Formateur',
          description: 'Formateur academique',
          isProtected: true,
        },
        {
          slug: 'candidat',
          name: 'Candidat',
          description: 'Prospect en parcours',
        },
        {
          slug: 'eleve',
          name: 'Eleve',
          description: 'Apprenant',
          isDefault: true,
        },
      ];

      for (const role of businessRoles) {
        await tx.userRole.upsert({
          where: { slug: role.slug },
          update: {
            name: role.name,
            description: role.description,
            isDefault: role.isDefault || false,
            isProtected: role.isProtected || false,
            isTrashed: false,
          },
          create: {
            slug: role.slug,
            name: role.name,
            description: role.description,
            isDefault: role.isDefault || false,
            isProtected: role.isProtected || false,
            createdAt: new Date(),
          },
        });
      }
      console.log('Roles seeded.');

      await tx.userRole.updateMany({
        where: { slug: { in: legacyMetronicSlugs } },
        data: { isTrashed: true, isDefault: false },
      });

      for (const permission of permissionsData) {
        await tx.userPermission.upsert({
          where: { slug: permission.slug },
          update: {
            name: permission.name,
            description: permission.description,
          },
          create: {
            slug: permission.slug,
            name: permission.name,
            description: permission.description,
            createdAt: new Date(),
          },
        });
      }
      console.log('Permissions seeded.');

      const seededRoles = await tx.userRole.findMany();
      const seededPermissions = await tx.userPermission.findMany();

      const permissionBySlug = new Map(seededPermissions.map((p) => [p.slug, p]));
      const allPermissionIds = seededPermissions.map((p) => p.id);

      for (const role of seededRoles) {
        const matrixEntry = CRM_PERMISSIONS[role.slug];
        let slugList = [];
        if (matrixEntry === '*') {
          slugList = seededPermissions.map((p) => p.slug);
        } else if (Array.isArray(matrixEntry)) {
          slugList = matrixEntry;
        }

        const permissionIds =
          matrixEntry === '*'
            ? allPermissionIds
            : slugList
                .map((slug) => permissionBySlug.get(slug)?.id)
                .filter((id) => Boolean(id));

        for (const permissionId of permissionIds) {
          await tx.userRolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId,
              },
            },
            update: { assignedAt: new Date() },
            create: {
              roleId: role.id,
              permissionId,
              assignedAt: new Date(),
            },
          });
        }

        if (matrixEntry && matrixEntry !== '*') {
          const allowedSet = new Set(permissionIds);
          await tx.userRolePermission.deleteMany({
            where: {
              roleId: role.id,
              ...(allowedSet.size > 0
                ? { permissionId: { notIn: [...allowedSet] } }
                : {}),
            },
          });
        }
      }
      console.log('UserRolePermissions seeded (deterministic CRM matrix).');

       const seededUsers = buildUsersFromMetronic();
      for (let i = 0; i < seededUsers.length; i += 1) {
        const user = seededUsers[i];
        const role = await tx.userRole.findFirst({
          where: { slug: user.roleSlug },
        });
        if (!role) continue;
        const { firstName, lastName } = splitFullName(user.name);
        const avatar = resolveSeedAvatar(user, i);
        const loginEmail = user.email;
        const emailPair = resolveEmailPair(
          { firstName, lastName, name: user.name, email: loginEmail, proEmail: null },
          i,
        );
        const existing = await findUserByAppLogin(tx, loginEmail);
        const userData = {
          name: user.name,
          firstName,
          lastName,
          email: emailPair.email,
          proEmail: emailPair.proEmail,
          password: hashedPassword,
          avatar,
          roleId: role.id,
          emailVerifiedAt: new Date(),
          status: 'ACTIVE',
          isProtected: !!user.isProtected,
          isTrashed: false,
        };
        if (existing) {
          await tx.user.update({ where: { id: existing.id }, data: userData });
        } else {
          await tx.user.create({
            data: { ...userData, createdAt: new Date() },
          });
        }
      }

      await ensureUserEmailSplit(tx);

      // Supprime legacy demo/kt uniquement
      await tx.account.deleteMany({
        where: {
          user: { email: { contains: '@kt.com' } },
        },
      });
      await tx.session.deleteMany({
        where: {
          user: { email: { contains: '@kt.com' } },
        },
      });
      await tx.systemLog.deleteMany({
        where: {
          user: { email: { contains: '@kt.com' } },
        },
      });
      await tx.user.deleteMany({
        where: { email: { contains: '@kt.com' } },
      });

      // Comptes app @ecole.local orphelins (login proEmail hors liste seed)
      const allowedLoginEmails = new Set(seededUsers.map((u) => u.email));
      const existingAppUsers = await tx.user.findMany({
        where: { proEmail: { endsWith: '@ecole.local' } },
        select: { id: true, proEmail: true },
      });
      const staleIds = existingAppUsers
        .filter((u) => u.proEmail && !allowedLoginEmails.has(u.proEmail))
        .map((u) => u.id);
      if (staleIds.length > 0) {
        await tx.account.deleteMany({ where: { userId: { in: staleIds } } });
        await tx.session.deleteMany({ where: { userId: { in: staleIds } } });
        await tx.systemLog.deleteMany({ where: { userId: { in: staleIds } } });
        await tx.user.deleteMany({ where: { id: { in: staleIds } } });
      }
      console.log('Users seeded.');

      // Equipements - ecole de formation securite privee/incendie
      const schoolSites = [
        { code: 'CAMPUS-PARIS', name: 'Campus Principal Paris', city: 'Paris', country: 'FR' },
        { code: 'PLATEAU-INC', name: 'Plateau Technique Incendie', city: 'Saint-Denis', country: 'FR' },
        { code: 'ATELIER-EPI', name: 'Atelier EPI et Materiel Pedagogique', city: 'Nanterre', country: 'FR' },
      ];

      const siteByCode = new Map();
      for (const site of schoolSites) {
        await tx.$executeRaw`
          INSERT INTO "ClientSite" ("id", "code", "name", "city", "country", "isActive", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, ${site.code}, ${site.name}, ${site.city}, ${site.country}, true, now(), now())
          ON CONFLICT ("code")
          DO UPDATE SET
            "name" = EXCLUDED."name",
            "city" = EXCLUDED."city",
            "country" = EXCLUDED."country",
            "isActive" = EXCLUDED."isActive",
            "updatedAt" = now()
        `;
        const rows = await tx.$queryRaw`SELECT "id" FROM "ClientSite" WHERE "code" = ${site.code} LIMIT 1`;
        if (rows[0]?.id) siteByCode.set(site.code, rows[0].id);
      }

      // Nettoyage complet avant seeding unitaire
      await tx.$executeRaw`DELETE FROM "StockMovement"`;
      await tx.$executeRaw`DELETE FROM "EquipmentMaintenance"`;
      await tx.$executeRaw`DELETE FROM "Equipment"`;

      const baseEquipments = [
        { serialNumber: 'MAN-ADULTE', label: 'Mannequin RCP Adulte Pro', type: 'MANNEQUIN_PEDAGOGIQUE', siteCode: 'CAMPUS-PARIS' },
        { serialNumber: 'MAN-ENFANT', label: 'Mannequin RCP Enfant', type: 'MANNEQUIN_PEDAGOGIQUE', siteCode: 'CAMPUS-PARIS' },
        { serialNumber: 'MAN-NOUR', label: 'Mannequin RCP Nourrisson', type: 'MANNEQUIN_PEDAGOGIQUE', siteCode: 'CAMPUS-PARIS' },
        { serialNumber: 'DEF-AED', label: 'Defibrillateur de formation AED', type: 'SECOURISME', siteCode: 'CAMPUS-PARIS' },
        { serialNumber: 'EXT-EAU', label: 'Extincteur eau pulverisee 6L', type: 'INCENDIE', siteCode: 'PLATEAU-INC' },
        { serialNumber: 'EXT-CO2', label: 'Extincteur CO2 5kg', type: 'INCENDIE', siteCode: 'PLATEAU-INC' },
        { serialNumber: 'EXT-POU', label: 'Extincteur poudre ABC 9kg', type: 'INCENDIE', siteCode: 'PLATEAU-INC' },
        { serialNumber: 'RIA', label: 'Module RIA pedagogique', type: 'INCENDIE', siteCode: 'PLATEAU-INC' },
      ];

      const equipmentsSeed = [];
      for (const eq of baseEquipments) {
        equipmentsSeed.push({ ...eq, serialNumber: `${eq.serialNumber}-001`, status: 'AVAILABLE' });
        equipmentsSeed.push({ ...eq, serialNumber: `${eq.serialNumber}-002`, status: 'IN_USE' });
        equipmentsSeed.push({ ...eq, serialNumber: `${eq.serialNumber}-003`, status: 'MAINTENANCE' });
      }

      const equipmentBySerial = new Map();
      for (const item of equipmentsSeed) {
        const assignedSiteId = siteByCode.get(item.siteCode) || null;
        await tx.$executeRaw`
          INSERT INTO "Equipment" (
            "id", "serialNumber", "label", "type", "status", "assignedSiteId", "metadata", "createdAt", "updatedAt"
          )
          VALUES (
            gen_random_uuid()::text,
            ${item.serialNumber},
            ${item.label},
            ${item.type},
            CAST(${item.status} AS "EquipmentStatus"),
            ${assignedSiteId},
            CAST('{"pedagogicDomain":"securite-privee-incendie"}' AS jsonb),
            now(),
            now()
          )
        `;
        const rows = await tx.$queryRaw`SELECT "id" FROM "Equipment" WHERE "serialNumber" = ${item.serialNumber} LIMIT 1`;
        if (rows[0]?.id) equipmentBySerial.set(item.serialNumber, rows[0].id);
      }

      await tx.$executeRaw`DELETE FROM "EquipmentMaintenance"`;
      const maintenanceSeed = [
        {
          serialNumber: 'EXT-CO2-003',
          status: 'IN_PROGRESS',
          title: 'Verification pression et etancheite',
          notes: 'Controle semestriel en cours par prestataire certifie',
          scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          serialNumber: 'MAN-ENFANT-003',
          status: 'OVERDUE',
          title: 'Remplacement valve respiratoire',
          notes: 'Panne intermittente detectee en simulation',
          scheduledDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
        {
          serialNumber: 'RIA-003',
          status: 'SCHEDULED',
          title: 'Essai debit et maintenance preventive',
          notes: 'Maintenance planifiee avant session SSIAP',
          scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
      ];

      for (const item of maintenanceSeed) {
        const equipmentId = equipmentBySerial.get(item.serialNumber);
        if (!equipmentId) continue;
        await tx.$executeRaw`
          INSERT INTO "EquipmentMaintenance" (
            "id", "equipmentId", "status", "title", "notes", "scheduledDate", "createdAt", "updatedAt"
          )
          VALUES (
            gen_random_uuid()::text,
            ${equipmentId},
            CAST(${item.status} AS "EquipmentMaintenanceStatus"),
            ${item.title},
            ${item.notes},
            ${item.scheduledDate},
            now(),
            now()
          )
        `;
      }

      await tx.$executeRaw`DELETE FROM "StockMovement"`;
      const movementSeed = [
        { serialNumber: 'MAN-ADULTE-001', type: 'IN', quantity: 1, notes: 'Reception lot secourisme' },
        { serialNumber: 'EXT-EAU-001', type: 'OUT', quantity: 1, notes: 'Utilisation atelier feu reel' },
        { serialNumber: 'EXT-CO2-003', type: 'TRANSFER', quantity: 1, notes: 'Transfert vers zone maintenance' },
        { serialNumber: 'DEF-AED-001', type: 'OUT', quantity: 1, notes: 'Mise a disposition module secourisme' },
        { serialNumber: 'RIA-001', type: 'IN', quantity: 1, notes: 'Reassort kit incendie' },
      ];

      for (const item of movementSeed) {
        const equipmentId = equipmentBySerial.get(item.serialNumber);
        if (!equipmentId) continue;
        await tx.$executeRaw`
          INSERT INTO "StockMovement" (
            "id", "equipmentId", "type", "quantity", "notes", "movementDate", "createdAt", "updatedAt"
          )
          VALUES (
            gen_random_uuid()::text,
            ${equipmentId},
            CAST(${item.type} AS "StockMovementType"),
            ${item.quantity},
            ${item.notes},
            now(),
            now(),
            now()
          )
        `;
      }
      console.log('Equipements seeded.');

      for (const r of FORMATION_VENUE_ROOMS) {
        await tx.formationVenueRoom.upsert({
          where: { id: r.id },
          create: {
            id: r.id,
            name: r.name,
            shortCode: r.shortCode,
            capacity: r.capacity,
            floorLabel: r.floorLabel ?? null,
            imageUrl: r.imageUrl ?? null,
            sortOrder: r.sortOrder,
            isActive: true,
          },
          update: {
            name: r.name,
            shortCode: r.shortCode,
            capacity: r.capacity,
            floorLabel: r.floorLabel ?? null,
            imageUrl: r.imageUrl ?? null,
            sortOrder: r.sortOrder,
            isActive: true,
          },
        });
      }
      console.log('Salles formation (FormationVenueRoom) seedees.');

      await seedFormationsCatalog(tx);
      await seedPortalLmsContent(tx);
      await migrateLegacyCnapsStorageKeys(tx);
      await seedDemoPortalCandidatures(tx);
      await seedCnapsCandidatProfiles(tx);
      await seedPortalLmsEnrollments(tx);
      await seedPortalAnnouncements(tx);
      await seedLandingLeadsAndDevis(tx);
      await seedOperationalModules(tx);
      await seedComplianceTemplates(tx);
      await seedComplianceDossiersForOpenCandidatures(tx);
      await seedComplianceDossiersForStaff(tx);

      // Create a Course and a TrainingSession for testing assignments using raw SQL to bypass stale client
      const superadminRows = await tx.$queryRaw`SELECT "id" FROM "User" WHERE "proEmail" = 'samir.iggui@ecole.local' OR "email" = 'samir.iggui@ecole.local' LIMIT 1`;
      const superadminId = superadminRows[0]?.id;
      
      if (superadminId) {
        const courseId = 'test-course-ssiap-1';
        await tx.$executeRaw`
          INSERT INTO "Course" ("id", "title", "description", "createdById", "isPublished", "updatedAt")
          VALUES (${courseId}, 'Formation SSIAP 1', 'Service de Securite Incendie et d Assistance a Personnes', ${superadminId}, true, now())
          ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title"
        `;

        const sessionId = 'test-session-ssiap-may-2026';
        await tx.$executeRaw`
          INSERT INTO "TrainingSession" ("id", "title", "startDate", "endDate", "location", "courseId", "updatedAt")
          VALUES (${sessionId}, 'Session SSIAP 1 - Mai 2026', '2026-05-15T09:00:00Z'::timestamp, '2026-05-20T17:00:00Z'::timestamp, 'Plateau Technique Incendie', ${courseId}, now())
          ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title"
        `;

        // Link IN_USE equipments to this session
        const inUseEquipments = await tx.$queryRaw`SELECT "id" FROM "Equipment" WHERE "status" = 'IN_USE'`;
        
        await tx.$executeRaw`DELETE FROM "_EquipmentToTrainingSession" WHERE "B" = ${sessionId}`;
        
        for (const eq of inUseEquipments) {
          await tx.$executeRaw`
            INSERT INTO "_EquipmentToTrainingSession" ("A", "B")
            VALUES (${eq.id}, ${sessionId})
          `;
        }
        console.log('Test course and session seeded with equipment assignments (RAW SQL).');
      }

      const users = await tx.user.findMany({
        where: {
          role: {
            isDefault: false,
          },
        },
        include: {
          role: true,
        },
      });

      const systemLogPromises = users.slice(0, 20).map((user, index) =>
        tx.systemLog.create({
          data: {
            event: 'SEED',
            userId: user.id,
            entityId: user.id,
            entityType: 'user',
            description: `user was seeded (${index + 1})`,
            createdAt: new Date(),
            ipAddress: '127.0.0.1',
          },
        }),
      );

      await Promise.all(systemLogPromises);

      const defaultSettingsId = 'default-system-setting';
      /** Données publiques type registre INPI / INSEE — exemple FORM' SSI (données indicatives seed). */
      const companyProfileSeed = {
        name: "FORM'SSI SARL",
        logo: '/brand/formssi-logo-full.png',
        address: '9 Avenue Alexandre Maistrasse, 92500 RUEIL-MALMAISON',
        companyCity: 'RUEIL-MALMAISON',
        companyPostalCode: '92500',
        siret: '85372584400015',
        siren: '853725844',
        establishmentNic: '00015',
        cnaps: 'FOP-092-2023-09-13-20230855451',
        ndaNumber: '11922308992',
        vatIntracommunityNumber: 'FR20853725844',
        shareCapitalEuros: 1000,
        rcsRegistryCity: 'NANTERRE',
        agreementQualianor: '445 SP Ind 0',
        agreementQualiopiRef: '2811 OF Ind 0',
        agreementSsiap: '2023-992',
        directorFullName: 'Yassine HIDJEB',
        directorRole: 'Gérant',
        industry: "Formation continue d'adultes",
        companyType: 'SARL',
        companySize: 'PME',
        companyRegion: 'Île-de-France',
        mainActivityDescription: "Formation continue d'adultes",
        ndaSpecialty:
          'Sécurité des biens et des personnes, police, surveillance',
        ndaDeclaredAt: new Date('2025-05-30T12:00:00.000Z'),
        ndaRegion: 'Île-de-France',
        ndaTrainingActions:
          "Actions de formation inscrites au répertoire (déclaration NDA — à compléter selon l'offre catalogue).",
        agreementAdef: null,
        nafApeCode: '85.59A',
        naf2025Code: '85.59G',
        legalFormDetailed:
          'S.A.R.L au capital de 1 000 € — Siret n° 85372584400015 — R.C.S de NANTERRE — TVA intracommunautaire FR20853725844',
        qualiopiCertifications:
          'Organisme de formation certifié Qualiopi — agrément 2811 OF Ind 0',
        companyCreationDate: new Date('2019-10-01T12:00:00.000Z'),
        establishmentCreationDate: new Date('2019-10-01T12:00:00.000Z'),
        inseeRegistrationDate: new Date('2019-10-01T12:00:00.000Z'),
        rneExtractDate: new Date('2019-09-10T12:00:00.000Z'),
        employeeSituationNote:
          "Unité non employeuse (pas de salarié au cours de l'année de référence et pas d'effectif au 31/12) (année de référence non renseignée)",
        companySizeCategoryNote: 'Petite ou Moyenne Entreprise (PME), en 2023',
        collectiveAgreementNote: 'Non renseignée',
        eoriNumber: null,
        inpiCompanySummary: [
          "La société FORM'SSI SARL a été créée le 1 octobre 2019. Sa forme juridique est Société à responsabilité limitée (sans autre indication). Son domaine d'activité est : formation continue d'adultes. En 2023, elle était catégorisée Petite ou Moyenne Entreprise. Elle ne possédait pas de salariés.",
          '',
          "Son siège social est domicilié au 9 Avenue Alexandre Maistrasse 92500 RUEIL-MALMAISON. Elle possède 1 établissement.",
        ].join('\n'),
        supportEmail: 'contact-formssi@gmail.com',
        supportPhone: '01 71 11 39 63',
      };

      await tx.systemSetting.upsert({
        where: { id: defaultSettingsId },
        update: companyProfileSeed,
        create: { id: defaultSettingsId, ...companyProfileSeed },
      });
      console.log('Settings seeded.');

      await seedRhStructureTeams(tx);
      await seedRhMetierReferential(tx);
      await seedTopbarDemo(tx);
      await seedGsmsOpsChat(tx);
      await seedRhAbsencesAndPositions(tx);

      await tx.$executeRawUnsafe(`
        UPDATE "InAppNotification" SET channel = 'DOSSIER'::"InAppNotificationChannel"
        WHERE href LIKE '/mon-dossier%'
      `);
      await tx.$executeRawUnsafe(`
        UPDATE "InAppNotification" SET channel = 'PEDAGOGIE'::"InAppNotificationChannel"
        WHERE href LIKE '/e-formation%' OR href LIKE '/formateur%'
          OR category IN ('ACADEMIC', 'TEAM')
      `);

      console.log('Database seeding completed!');
    },
    {
      timeout: 520000,
      maxWait: 520000,
    },
  );
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
