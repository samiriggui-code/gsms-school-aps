/**
 * Conformité RH — pas de table Prisma dédiée.
 * Agrège User (documents, agréments) + UserCertificate + FileAsset (via routes documents).
 */
import { isDirectorRole, isFormateurRole } from '@/lib/rh-agrement';

export type ComplianceIssueSeverity = 'CRITICAL' | 'WARNING';

export type RhComplianceIssue = {
  severity: ComplianceIssueSeverity | string;
  message: string;
};

export type RhComplianceStatus = 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';

export type RhUserComplianceResult = {
  status: RhComplianceStatus;
  canBeAssigned: boolean;
  issues: RhComplianceIssue[];
};

export type RhComplianceAlert = {
  id: string;
  userId: string;
  userName: string;
  type: string;
  itemType: string;
  expiryDate: string;
  severity: ComplianceIssueSeverity;
};

export type RhComplianceUserInput = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  userCategory?: string | null;
  qualification?: string | null;
  carteProNumber?: string | null;
  carteProExpiry?: Date | null;
  documentCni?: string | null;
  documentAssurance?: string | null;
  documentCartePro?: string | null;
  documentResidencePermit?: string | null;
  residencePermitExpiry?: Date | null;
  role?: { slug?: string | null } | null;
};

export type RhComplianceStatsSummary = {
  totalConformites: number;
  activeConformites: number;
  inactiveConformites: number;
  pendingConformites: number;
  complianceIssues: number;
  complianceNonCompliant: number;
  documentsExpiring: number;
  documentsExpired: number;
  compliantCount: number;
  warningCount: number;
  nonCompliantCount: number;
};

function pushExpiryIssues(
  label: string,
  expiry: Date | null | undefined,
  issues: RhComplianceIssue[],
): 'critical' | 'warning' | null {
  if (!expiry) return null;
  const end = new Date(expiry);
  if (Number.isNaN(end.getTime())) return null;
  const now = new Date();
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    issues.push({ severity: 'CRITICAL', message: `${label} expiré` });
    return 'critical';
  }
  if (diffDays < 30) {
    issues.push({
      severity: 'WARNING',
      message: `${label} expire dans moins de 30 jours`,
    });
    return 'warning';
  }
  return null;
}

/** Évalue la conformité documentaire / agrément d’un collaborateur (User). */
export function evaluateRhUserCompliance(user: RhComplianceUserInput): RhUserComplianceResult {
  const slug = user.role?.slug ?? null;
  const issues: RhComplianceIssue[] = [];
  let canBeAssigned = true;

  if (!user.documentCni) {
    issues.push({
      severity: 'CRITICAL',
      message: "Document d’identité (CNI / passeport) manquant ou non versé.",
    });
    canBeAssigned = false;
  }

  if (user.userCategory === 'SUBCONTRACTOR') {
    if (!user.documentResidencePermit) {
      issues.push({
        severity: 'CRITICAL',
        message: 'Titre / permis de séjour obligatoire pour les sous-traitants.',
      });
      canBeAssigned = false;
    }
    const rpCrit = pushExpiryIssues('Permis de séjour', user.residencePermitExpiry, issues);
    if (rpCrit === 'critical') canBeAssigned = false;
  }

  const hasAgrementDoc = Boolean(user.documentCartePro);
  const hasAgrementRef = Boolean(user.carteProNumber?.trim());

  if (isFormateurRole(slug)) {
    if (!hasAgrementRef) {
      issues.push({ severity: 'CRITICAL', message: 'Référence d’agrément formateur manquante.' });
      canBeAssigned = false;
    }
    if (!hasAgrementDoc) {
      issues.push({ severity: 'WARNING', message: 'Justificatif d’agrément formateur non versé.' });
    }
    if (pushExpiryIssues('Agrément formateur', user.carteProExpiry, issues) === 'critical') {
      canBeAssigned = false;
    }
  } else if (isDirectorRole(slug)) {
    if (!hasAgrementRef) {
      issues.push({ severity: 'CRITICAL', message: 'Référence d’agrément dirigeant manquante.' });
      canBeAssigned = false;
    }
    if (!hasAgrementDoc) {
      issues.push({ severity: 'WARNING', message: 'Justificatif d’agrément dirigeant non versé.' });
    }
    if (pushExpiryIssues('Agrément dirigeant', user.carteProExpiry, issues) === 'critical') {
      canBeAssigned = false;
    }
  } else if (user.qualification?.trim() && !hasAgrementRef) {
    issues.push({
      severity: 'WARNING',
      message:
        'Qualification renseignée : envisager une référence d’habilitation ou agrément si le poste l’exige.',
    });
    pushExpiryIssues('Habilitation / agrément', user.carteProExpiry, issues);
  }

  if (user.residencePermitExpiry && user.userCategory !== 'SUBCONTRACTOR') {
    pushExpiryIssues('Titre de séjour', user.residencePermitExpiry, issues);
  }

  const hasCritical = issues.some((i) => i.severity === 'CRITICAL');
  const hasWarning = issues.some((i) => i.severity === 'WARNING');
  const status: RhComplianceStatus = hasCritical ? 'NON_COMPLIANT' : hasWarning ? 'WARNING' : 'COMPLIANT';

  return { status, canBeAssigned, issues };
}

/** Enrichit une ligne liste conformité avec l’évaluation partagée. */
export function mapRhConformiteListRow<T extends RhComplianceUserInput>(
  user: T,
  extra?: Partial<T>,
) {
  const compliance = evaluateRhUserCompliance(user);
  return {
    ...user,
    ...extra,
    complianceStatus: compliance.status,
    canBeAssigned: compliance.canBeAssigned,
    complianceIssues: compliance.issues,
    complianceIssueCount: compliance.issues.length,
  };
}

/** Agrège les KPI conformité à partir des utilisateurs évalués. */
export function summarizeRhComplianceStats(input: {
  users: RhComplianceUserInput[];
  accountStatus?: { active: number; inactive: number; pending: number };
}): RhComplianceStatsSummary {
  let compliantCount = 0;
  let warningCount = 0;
  let nonCompliantCount = 0;
  let documentsExpiring = 0;
  let documentsExpired = 0;

  for (const user of input.users) {
    const result = evaluateRhUserCompliance(user);
    if (result.status === 'COMPLIANT') compliantCount += 1;
    else if (result.status === 'WARNING') warningCount += 1;
    else nonCompliantCount += 1;

    for (const issue of result.issues) {
      if (issue.message.includes('expiré')) documentsExpired += 1;
      else if (issue.message.includes('30 jours')) documentsExpiring += 1;
    }
  }

  const account = input.accountStatus ?? { active: 0, inactive: 0, pending: 0 };

  return {
    totalConformites: input.users.length,
    activeConformites: account.active,
    inactiveConformites: account.inactive,
    pendingConformites: account.pending,
    complianceIssues: warningCount + nonCompliantCount,
    complianceNonCompliant: nonCompliantCount,
    documentsExpiring,
    documentsExpired,
    compliantCount,
    warningCount,
    nonCompliantCount,
  };
}

function severityForExpiry(expiry: Date, now: Date): ComplianceIssueSeverity | null {
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'CRITICAL';
  if (diffDays <= 30) return 'WARNING';
  return null;
}

function pushExpiryAlert(
  alerts: RhComplianceAlert[],
  input: {
    userId: string;
    userName: string;
    expiry: Date;
    type: string;
    itemType: string;
    now: Date;
  },
) {
  const severity = severityForExpiry(input.expiry, input.now);
  if (!severity) return;
  alerts.push({
    id: `${input.userId}-${input.type}`,
    userId: input.userId,
    userName: input.userName,
    type: input.type,
    itemType: input.itemType,
    expiryDate: input.expiry.toISOString(),
    severity,
  });
}

export function buildRhComplianceAlertsFromRows(input: {
  users: Array<{
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    carteProExpiry?: Date | null;
    residencePermitExpiry?: Date | null;
  }>;
  certificates: Array<{
    id: string;
    expiryDate: Date | null;
    user: { id: string; firstName?: string | null; lastName?: string | null };
  }>;
  now?: Date;
  limit?: number;
}): RhComplianceAlert[] {
  const now = input.now ?? new Date();
  const alerts: RhComplianceAlert[] = [];

  for (const user of input.users) {
    const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Utilisateur';
    if (user.carteProExpiry) {
      pushExpiryAlert(alerts, {
        userId: user.id,
        userName,
        expiry: user.carteProExpiry,
        type: 'carte_pro',
        itemType: 'CARTE_PRO',
        now,
      });
    }
    if (user.residencePermitExpiry) {
      pushExpiryAlert(alerts, {
        userId: user.id,
        userName,
        expiry: user.residencePermitExpiry,
        type: 'residence_permit',
        itemType: 'RESIDENCE_PERMIT',
        now,
      });
    }
  }

  for (const cert of input.certificates) {
    if (!cert.expiryDate) continue;
    const userName =
      [cert.user.firstName, cert.user.lastName].filter(Boolean).join(' ') || 'Utilisateur';
    pushExpiryAlert(alerts, {
      userId: cert.user.id,
      userName,
      expiry: cert.expiryDate,
      type: `certificate-${cert.id}`,
      itemType: 'CERTIFICATE',
      now,
    });
  }

  alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'CRITICAL' ? -1 : 1;
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });

  return alerts.slice(0, input.limit ?? 30);
}
