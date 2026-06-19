import type { Prisma } from '@repo/database';
import { sendComplianceDocumentRequestEmail } from '@repo/mail';
import { isEmailConfigured } from '@repo/mail';
import { prisma } from '@/lib/prisma';
import {
  evaluateRhUserCompliance,
  mapRhConformiteListRow,
  summarizeRhComplianceStats,
  type RhComplianceStatus,
} from '@/lib/gestion-ressources/rh-conformite-compliance';
import {
  buildRhCollaborateurCompliancePayload,
  type RhComplianceDocRow,
} from '@/lib/gestion-ressources/rh-user-compliance-rows';
import { SCHOOL_IAM_ROLE_SLUGS } from '@/lib/rh-iam-roles';
import { compliancePortalUploadUrl, complianceSiteOrigin } from '@repo/api-core';

const USER_COMPLIANCE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  name: true,
  email: true,
  proEmail: true,
  avatar: true,
  status: true,
  userCategory: true,
  qualification: true,
  jobFunction: true,
  carteProNumber: true,
  carteProExpiry: true,
  documentCni: true,
  documentAssurance: true,
  documentCartePro: true,
  documentResidencePermit: true,
  residencePermitExpiry: true,
  createdAt: true,
  role: { select: { id: true, slug: true, name: true } },
} satisfies Prisma.UserSelect;

export type GlobalComplianceUserRow = ReturnType<typeof mapRhConformiteListRow> & {
  name: string;
  roleName: string;
  roleSlug: string | null;
  profilePath: string;
  gedPath: string;
};

function displayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
}): string {
  return (
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
    user.name ||
    user.email ||
    '—'
  );
}

export function userComplianceProfilePath(
  roleSlug: string | null | undefined,
  userId: string,
): string {
  switch (roleSlug) {
    case 'formateur':
      return `/gestion-ressources/rh/formateurs?userId=${userId}`;
    case 'candidat':
    case 'eleve':
      return `/gestion-academique/vie-scolaire/etudiants?userId=${userId}`;
    default:
      return `/gestion-ressources/rh/collaborateurs?userId=${userId}`;
  }
}

function gedPathForUser(userId: string, personName: string): string {
  const sp = new URLSearchParams({
    dossierId: userId,
    dossierQ: personName.trim() || userId,
  });
  return `/securite-configuration/gouvernance-donnees/storage?${sp}`;
}

function rowStatusLabel(row: RhComplianceDocRow): string {
  switch (row.status) {
    case 'MISSING':
      return 'manquant';
    case 'EXPIRED':
      return 'expiré';
    case 'EXPIRING_SOON':
      return 'expire bientôt';
    case 'WARNING':
      return 'alerte';
    default:
      return row.status.toLowerCase();
  }
}

export async function loadUserFileAssetsForCompliance(userId: string) {
  return prisma.fileAsset.findMany({
    where: {
      module: 'crm',
      entityType: 'collaborateur',
      entityId: userId,
      status: 'ACTIVE',
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      category: true,
      originalName: true,
      url: true,
      issuedAt: true,
      expiresAt: true,
      issuedBy: true,
      documentRef: true,
    },
  });
}

export async function getGlobalComplianceStats() {
  const users = await prisma.user.findMany({
    where: {
      isTrashed: false,
      role: { slug: { in: [...SCHOOL_IAM_ROLE_SLUGS] } },
    },
    select: USER_COMPLIANCE_SELECT,
  });

  const [active, inactive, pending] = await Promise.all([
    prisma.user.count({
      where: { isTrashed: false, status: 'ACTIVE', role: { slug: { in: [...SCHOOL_IAM_ROLE_SLUGS] } } },
    }),
    prisma.user.count({
      where: { isTrashed: false, status: 'INACTIVE', role: { slug: { in: [...SCHOOL_IAM_ROLE_SLUGS] } } },
    }),
    prisma.user.count({
      where: { isTrashed: false, status: 'PENDING', role: { slug: { in: [...SCHOOL_IAM_ROLE_SLUGS] } } },
    }),
  ]);

  return summarizeRhComplianceStats({
    users,
    accountStatus: { active, inactive, pending },
  });
}

export async function listGlobalComplianceUsers(input: {
  page: number;
  limit: number;
  query?: string;
  complianceStatus?: RhComplianceStatus;
  hasIssues?: boolean;
  roleSlug?: string;
  userCategory?: string;
}) {
  const where: Prisma.UserWhereInput = {
    isTrashed: false,
    role: { slug: { in: [...SCHOOL_IAM_ROLE_SLUGS] } },
  };

  if (input.query?.trim()) {
    const q = input.query.trim();
    where.OR = [
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (input.roleSlug) where.role = { slug: input.roleSlug };
  if (input.userCategory) where.userCategory = input.userCategory as Prisma.EnumUserCategoryFilter['equals'];

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: USER_COMPLIANCE_SELECT,
  });

  const mapped: GlobalComplianceUserRow[] = users.map((u) => {
    const personName = displayName(u);
    const row = mapRhConformiteListRow(u);
    return {
      ...row,
      name: personName,
      roleName: u.role?.name ?? '—',
      roleSlug: u.role?.slug ?? null,
      profilePath: userComplianceProfilePath(u.role?.slug, u.id),
      gedPath: gedPathForUser(u.id, personName),
    };
  });

  let filtered = mapped;
  if (input.hasIssues) {
    filtered = filtered.filter((r) => r.complianceStatus !== 'COMPLIANT');
  } else if (input.complianceStatus) {
    filtered = filtered.filter((r) => r.complianceStatus === input.complianceStatus);
  }

  const skip = (input.page - 1) * input.limit;
  const paged = filtered.slice(skip, skip + input.limit);

  return {
    data: paged,
    pagination: { page: input.page, limit: input.limit, total: filtered.length },
  };
}

export async function getGlobalComplianceUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_COMPLIANCE_SELECT,
  });
  if (!user) return null;

  const [fileAssets, events, dossiers] = await Promise.all([
    loadUserFileAssetsForCompliance(userId),
    prisma.complianceItemEvent.findMany({
      where: { dossier: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        actor: { select: { id: true, firstName: true, lastName: true, email: true } },
        dossierItem: { select: { code: true, label: true } },
      },
    }),
    prisma.complianceDossier.findMany({
      where: { userId },
      select: {
        id: true,
        kind: true,
        status: true,
        items: {
          where: {
            required: true,
            status: { in: ['MISSING', 'REJECTED', 'EXPIRED', 'REQUESTED'] },
          },
          select: { id: true, label: true, status: true },
        },
      },
    }),
  ]);

  const personName = displayName(user);
  const payload = buildRhCollaborateurCompliancePayload(user, fileAssets);
  const nonCompliantRows = payload.rows.filter((r) => r.status !== 'VALID');

  return {
    user: {
      id: user.id,
      name: personName,
      email: user.email,
      proEmail: user.proEmail,
      userCategory: user.userCategory,
      jobFunction: user.jobFunction,
      roleName: user.role?.name ?? null,
      roleSlug: user.role?.slug ?? null,
      profilePath: userComplianceProfilePath(user.role?.slug, user.id),
      gedPath: gedPathForUser(user.id, personName),
    },
    ...payload,
    nonCompliantRows,
    dossiers,
    events,
  };
}

/** E-mail unique : pièces RH non conformes + items dossier gouvernance manquants/expirés. */
export async function notifyUserComplianceIssues(input: {
  userId: string;
  message?: string;
  requestedById?: string | null;
}) {
  const detail = await getGlobalComplianceUserDetail(input.userId);
  if (!detail) throw new Error('Profil introuvable.');

  const recipientEmail = detail.user.proEmail?.trim() || detail.user.email;
  if (!recipientEmail) throw new Error('Aucune adresse e-mail pour ce profil.');

  const rhLines = detail.nonCompliantRows.map(
    (r) => `• ${r.label} (${rowStatusLabel(r)})${r.message ? ` — ${r.message}` : ''}`,
  );

  const dossierLines: string[] = [];
  for (const d of detail.dossiers) {
    for (const item of d.items) {
      dossierLines.push(`• ${item.label} (dossier ${d.kind}, ${item.status.toLowerCase()})`);
    }
  }

  const allLines = [...new Set([...rhLines, ...dossierLines])];
  if (allLines.length === 0) {
    throw new Error('Aucune anomalie de conformité à signaler pour ce profil.');
  }

  const recipientName = detail.user.name;
  const customLines = [
    input.message?.trim(),
    'Points de conformité à traiter :',
    ...allLines,
  ].filter(Boolean);

  let emailSent = false;
  let emailError: string | null = null;

  if (isEmailConfigured()) {
    try {
      await sendComplianceDocumentRequestEmail(
        {
          recipientName,
          recipientEmail,
          documentLabel:
            allLines.length === 1
              ? (detail.nonCompliantRows[0]?.label ?? 'Pièce attendue')
              : `${allLines.length} points de conformité`,
          dossierLabel: 'Conformité établissement',
          uploadUrl: compliancePortalUploadUrl(),
          customMessage: customLines.join('\n'),
        },
        { assetsOrigin: complianceSiteOrigin() },
      );
      emailSent = true;
    } catch (err) {
      emailError = err instanceof Error ? err.message : String(err);
    }
  }

  if (detail.dossiers.length > 0) {
    await prisma.complianceItemEvent.createMany({
      data: detail.dossiers.slice(0, 1).map((d) => ({
        dossierId: d.id,
        eventType: emailSent ? 'EMAIL_SENT' : 'EMAIL_FAILED',
        actorId: input.requestedById ?? undefined,
        payload: {
          batchUserCompliance: true,
          piecesCount: allLines.length,
          emailError,
        },
      })),
    });
  }

  return {
    emailSent,
    emailError,
    recipientEmail,
    recipientName,
    piecesCount: allLines.length,
    pieceLabels: allLines.map((l) => l.replace(/^•\s*/, '')),
  };
}
