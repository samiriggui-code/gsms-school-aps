/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const rolesData = require('./data/roles');
const usersData = require('./data/users');
const permissionsData = require('./data/permissions');

const prisma = new PrismaClient();

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

  // le reste alterne candidat / eleve
  for (let i = 8; i < base.length; i += 1) {
    base[i].roleSlug = i % 2 === 0 ? 'eleve' : 'candidat';
  }

  return [
    {
      name: 'Samir Iggui',
      email: 'samir.iggui@ecole.local',
      avatar: null,
      roleSlug: 'superadmin',
      isProtected: true,
    },
    ...base,
  ];
}

function buildLargeUsers() {
  const users = buildUsersFromMetronic();

  // Add a larger deterministic dataset for development.
  for (let i = 1; i <= 120; i += 1) {
    users.push({
      name: `Candidat Dev ${i}`,
      email: `candidat.dev.${i}@ecole.local`,
      avatar: null,
      roleSlug: i % 3 === 0 ? 'eleve' : 'candidat',
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

async function main() {
  console.log('Running database seeding...');

  await prisma.$transaction(
    async (tx) => {
      const hashedPassword = await bcrypt.hash('demo1234', 10);

      await tx.userRole.upsert({
        where: { slug: 'member' },
        update: {},
        create: {
          slug: 'member',
          name: 'Member',
          description: 'Default member role',
          isDefault: true,
          isProtected: true,
          createdAt: new Date(),
        },
      });

      for (const role of rolesData) {
        await tx.userRole.upsert({
          where: { slug: role.slug },
          update: {},
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

      // Roles metier requis
      const businessRoles = [
        {
          slug: 'superadmin',
          name: 'Super Admin',
          description: 'Administration globale',
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

      for (const permission of permissionsData) {
        await tx.userPermission.upsert({
          where: { slug: permission.slug },
          update: {},
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

      const userRolePermissionPromises = seededRoles.flatMap((role) => {
        const numberOfPermissions = Math.floor(Math.random() * (12 - 3 + 1)) + 3;
        const randomizedPermissions = seededPermissions
          .sort(() => Math.random() - 0.5)
          .slice(0, numberOfPermissions);

        return randomizedPermissions.map((permission) =>
          tx.userRolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: permission.id,
              assignedAt: new Date(),
            },
          }),
        );
      });

      await Promise.all(userRolePermissionPromises);
      console.log('UserRolePermissions seeded.');

       const seededUsers = buildUsersFromMetronic();
      for (const user of seededUsers) {
        const role = await tx.userRole.findFirst({
          where: { slug: user.roleSlug },
        });
        await tx.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            password: hashedPassword,
            avatar: user.avatar,
            roleId: role.id,
            emailVerifiedAt: new Date(),
            status: 'ACTIVE',
            isProtected: !!user.isProtected,
            isTrashed: false,
          },
          create: {
            email: user.email,
            name: user.name,
            password: hashedPassword,
            avatar: user.avatar,
            roleId: role.id,
            emailVerifiedAt: new Date(),
            status: 'ACTIVE',
            createdAt: new Date(),
            isProtected: !!user.isProtected,
          },
        });
      }

      // Supprime legacy demo/kt + comptes hors @ecole.local
      await tx.account.deleteMany({
        where: {
          user: {
            OR: [{ email: { contains: '@kt.com' } }, { email: { not: { endsWith: '@ecole.local' } } }],
          },
        },
      });
      await tx.session.deleteMany({
        where: {
          user: {
            OR: [{ email: { contains: '@kt.com' } }, { email: { not: { endsWith: '@ecole.local' } } }],
          },
        },
      });
      await tx.systemLog.deleteMany({
        where: {
          user: {
            OR: [{ email: { contains: '@kt.com' } }, { email: { not: { endsWith: '@ecole.local' } } }],
          },
        },
      });
      await tx.user.deleteMany({
        where: {
          OR: [{ email: { contains: '@kt.com' } }, { email: { not: { endsWith: '@ecole.local' } } }],
        },
      });

      // Supprime aussi tous les users @ecole.local hors de la liste attendue
      const allowedEmails = new Set(seededUsers.map((u) => u.email));
      const existingEcoleUsers = await tx.user.findMany({
        where: { email: { endsWith: '@ecole.local' } },
        select: { id: true, email: true },
      });
      const staleIds = existingEcoleUsers
        .filter((u) => !allowedEmails.has(u.email))
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

      const equipmentsSeed = [
        { serialNumber: 'MAN-ADULTE-001', label: 'Mannequin RCP Adulte Pro', type: 'MANNEQUIN_PEDAGOGIQUE', status: 'AVAILABLE', siteCode: 'CAMPUS-PARIS' },
        { serialNumber: 'MAN-ENFANT-002', label: 'Mannequin RCP Enfant', type: 'MANNEQUIN_PEDAGOGIQUE', status: 'IN_USE', siteCode: 'CAMPUS-PARIS' },
        { serialNumber: 'MAN-NOUR-003', label: 'Mannequin RCP Nourrisson', type: 'MANNEQUIN_PEDAGOGIQUE', status: 'AVAILABLE', siteCode: 'CAMPUS-PARIS' },
        { serialNumber: 'DEF-AED-004', label: 'Defibrillateur de formation AED', type: 'SECOURISME', status: 'AVAILABLE', siteCode: 'CAMPUS-PARIS' },
        { serialNumber: 'EXT-EAU-005', label: 'Extincteur eau pulverisee 6L', type: 'INCENDIE', status: 'IN_USE', siteCode: 'PLATEAU-INC' },
        { serialNumber: 'EXT-CO2-006', label: 'Extincteur CO2 5kg', type: 'INCENDIE', status: 'MAINTENANCE', siteCode: 'PLATEAU-INC' },
        { serialNumber: 'EXT-POU-007', label: 'Extincteur poudre ABC 9kg', type: 'INCENDIE', status: 'AVAILABLE', siteCode: 'PLATEAU-INC' },
        { serialNumber: 'RIA-008', label: 'Module RIA pedagogique', type: 'INCENDIE', status: 'AVAILABLE', siteCode: 'PLATEAU-INC' },
        { serialNumber: 'CAM-SEC-009', label: 'Kit videosurveillance pedagogique', type: 'SECURITE_PRIVEE', status: 'IN_USE', siteCode: 'ATELIER-EPI' },
        { serialNumber: 'PORT-DET-010', label: 'Portique detecteur pedagogique', type: 'SECURITE_PRIVEE', status: 'OUT_OF_SERVICE', siteCode: 'ATELIER-EPI' },
        { serialNumber: 'RAD-011', label: 'Lot radios communication terrain x6', type: 'SECURITE_PRIVEE', status: 'AVAILABLE', siteCode: 'ATELIER-EPI' },
        { serialNumber: 'EPI-012', label: 'Kit EPI incendie formateur', type: 'EPI', status: 'AVAILABLE', siteCode: 'ATELIER-EPI' },
      ];

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
          ON CONFLICT ("serialNumber")
          DO UPDATE SET
            "label" = EXCLUDED."label",
            "type" = EXCLUDED."type",
            "status" = EXCLUDED."status",
            "assignedSiteId" = EXCLUDED."assignedSiteId",
            "metadata" = EXCLUDED."metadata",
            "updatedAt" = now()
        `;
        const rows = await tx.$queryRaw`SELECT "id" FROM "Equipment" WHERE "serialNumber" = ${item.serialNumber} LIMIT 1`;
        if (rows[0]?.id) equipmentBySerial.set(item.serialNumber, rows[0].id);
      }

      await tx.$executeRaw`DELETE FROM "EquipmentMaintenance"`;
      const maintenanceSeed = [
        {
          serialNumber: 'EXT-CO2-006',
          status: 'IN_PROGRESS',
          title: 'Verification pression et etancheite',
          notes: 'Controle semestriel en cours par prestataire certifie',
          scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          serialNumber: 'PORT-DET-010',
          status: 'OVERDUE',
          title: 'Remplacement carte alimentation',
          notes: 'Panne intermittente detectee en simulation',
          scheduledDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
        {
          serialNumber: 'RIA-008',
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
        { serialNumber: 'MAN-ADULTE-001', type: 'IN', quantity: 2, notes: 'Reception lot secourisme' },
        { serialNumber: 'EXT-EAU-005', type: 'OUT', quantity: 1, notes: 'Utilisation atelier feu reel' },
        { serialNumber: 'EXT-CO2-006', type: 'TRANSFER', quantity: 1, notes: 'Transfert vers zone maintenance' },
        { serialNumber: 'CAM-SEC-009', type: 'OUT', quantity: 1, notes: 'Mise a disposition module videosurveillance' },
        { serialNumber: 'EPI-012', type: 'IN', quantity: 3, notes: 'Reassort kit EPI incendie' },
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
  });
