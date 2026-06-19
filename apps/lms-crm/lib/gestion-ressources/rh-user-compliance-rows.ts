import type { RhComplianceUserInput, RhUserComplianceResult } from '@/lib/gestion-ressources/rh-conformite-compliance';
import { evaluateRhUserCompliance } from '@/lib/gestion-ressources/rh-conformite-compliance';
import { isDirectorRole, isFormateurRole } from '@/lib/rh-agrement';
import { RH_DOCUMENT_CATEGORY_LABELS } from '@/lib/governance/rh-document-upload-meta';

export type RhComplianceDocStatus = 'VALID' | 'MISSING' | 'EXPIRED' | 'EXPIRING_SOON' | 'WARNING';

export type RhComplianceDocRow = {
  id: string;
  category: string;
  label: string;
  status: RhComplianceDocStatus;
  severity: 'CRITICAL' | 'WARNING' | null;
  message: string | null;
  expiresAt: string | null;
  issuedAt: string | null;
  issuedBy: string | null;
  documentRef: string | null;
  fileAssetId: string | null;
  fileUrl: string | null;
  fileName: string | null;
  required: boolean;
};

type FileAssetSlice = {
  id: string;
  category: string | null;
  originalName: string;
  url: string;
  issuedAt: Date | null;
  expiresAt: Date | null;
  issuedBy: string | null;
  documentRef: string | null;
};

type DocDef = {
  id: string;
  category: string;
  userUrlField: keyof RhComplianceUserInput;
  userExpiryField?: keyof RhComplianceUserInput;
  required: (user: RhComplianceUserInput) => boolean;
};

const DOC_DEFS: DocDef[] = [
  {
    id: 'document_cni',
    category: 'document_cni',
    userUrlField: 'documentCni',
    required: () => true,
  },
  {
    id: 'document_assurance',
    category: 'document_assurance',
    userUrlField: 'documentAssurance',
    required: () => false,
  },
  {
    id: 'document_residence_permit',
    category: 'document_residence_permit',
    userUrlField: 'documentResidencePermit',
    userExpiryField: 'residencePermitExpiry',
    required: (u) => u.userCategory === 'SUBCONTRACTOR',
  },
  {
    id: 'document_carte_pro',
    category: 'document_carte_pro',
    userUrlField: 'documentCartePro',
    userExpiryField: 'carteProExpiry',
    required: (u) => isFormateurRole(u.role?.slug) || isDirectorRole(u.role?.slug),
  },
];

function iso(d: Date | null | undefined): string | null {
  if (!d) return null;
  const t = d instanceof Date ? d : new Date(d);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}

function expiryStatus(expiresAt: Date | null): Pick<RhComplianceDocRow, 'status' | 'severity' | 'message'> | null {
  if (!expiresAt || Number.isNaN(expiresAt.getTime())) return null;
  const diffDays = Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000);
  if (diffDays < 0) {
    return { status: 'EXPIRED', severity: 'CRITICAL', message: 'Document expiré' };
  }
  if (diffDays <= 30) {
    return {
      status: 'EXPIRING_SOON',
      severity: 'WARNING',
      message: `Expire dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`,
    };
  }
  return null;
}

function buildDocRow(
  def: DocDef,
  user: RhComplianceUserInput,
  asset: FileAssetSlice | undefined,
): RhComplianceDocRow {
  const label = RH_DOCUMENT_CATEGORY_LABELS[def.category] ?? def.category;
  const userUrl = user[def.userUrlField] as string | null | undefined;
  const hasFile = Boolean(userUrl?.trim() || asset?.url);

  const userExpiry = def.userExpiryField
    ? (user[def.userExpiryField] as Date | null | undefined)
    : null;
  const expiresAt = asset?.expiresAt ?? userExpiry ?? null;

  const required = def.required(user);
  let status: RhComplianceDocStatus = 'VALID';
  let severity: RhComplianceDocRow['severity'] = null;
  let message: string | null = null;

  if (!hasFile) {
    if (required) {
      status = 'MISSING';
      severity = 'CRITICAL';
      message = 'Document manquant ou non versé';
    } else {
      status = 'WARNING';
      severity = 'WARNING';
      message = 'Document non versé';
    }
  } else {
    const exp = expiryStatus(expiresAt);
    if (exp) {
      status = exp.status;
      severity = exp.severity;
      message = exp.message;
    }
  }

  return {
    id: def.id,
    category: def.category,
    label,
    status,
    severity,
    message,
    expiresAt: iso(expiresAt),
    issuedAt: iso(asset?.issuedAt ?? null),
    issuedBy: asset?.issuedBy ?? null,
    documentRef: asset?.documentRef ?? null,
    fileAssetId: asset?.id ?? null,
    fileUrl: asset?.url ?? userUrl ?? null,
    fileName: asset?.originalName ?? null,
    required,
  };
}

/** Construit les lignes documentaires RH à partir du User et des FileAssets GED. */
export function buildRhUserComplianceDocRows(
  user: RhComplianceUserInput,
  fileAssets: FileAssetSlice[],
): RhComplianceDocRow[] {
  const byCategory = new Map<string, FileAssetSlice>();
  for (const asset of fileAssets) {
    if (!asset.category || byCategory.has(asset.category)) continue;
    byCategory.set(asset.category, asset);
  }

  const rows = DOC_DEFS.map((def) =>
    buildDocRow(def, user, byCategory.get(def.category)),
  );

  const slug = user.role?.slug ?? null;
  const hasAgrementRef = Boolean(user.carteProNumber?.trim());

  if (
    (isFormateurRole(slug) || isDirectorRole(slug) || user.qualification?.trim()) &&
    !hasAgrementRef
  ) {
    rows.push({
      id: 'carte_pro_ref',
      category: 'carte_pro_ref',
      label: 'Référence habilitation / agrément',
      status: isFormateurRole(slug) || isDirectorRole(slug) ? 'MISSING' : 'WARNING',
      severity: isFormateurRole(slug) || isDirectorRole(slug) ? 'CRITICAL' : 'WARNING',
      message: isFormateurRole(slug) || isDirectorRole(slug)
        ? 'Référence d\'agrément manquante'
        : 'Référence d\'habilitation recommandée pour ce poste',
      expiresAt: iso(user.carteProExpiry ?? null),
      issuedAt: null,
      issuedBy: null,
      documentRef: user.carteProNumber ?? null,
      fileAssetId: null,
      fileUrl: null,
      fileName: null,
      required: isFormateurRole(slug) || isDirectorRole(slug),
    });
  }

  return rows;
}

export function summarizeRhComplianceDocRows(rows: RhComplianceDocRow[]) {
  const missing = rows.filter((r) => r.status === 'MISSING').length;
  const expired = rows.filter((r) => r.status === 'EXPIRED').length;
  const expiringSoon = rows.filter((r) => r.status === 'EXPIRING_SOON').length;
  const warning = rows.filter((r) => r.status === 'WARNING').length;
  const valid = rows.filter((r) => r.status === 'VALID').length;
  const nonCompliant = rows.filter((r) => r.status !== 'VALID').length;

  return { total: rows.length, missing, expired, expiringSoon, warning, valid, nonCompliant };
}

export type RhCollaborateurCompliancePayload = {
  compliance: RhUserComplianceResult;
  rows: RhComplianceDocRow[];
  summary: ReturnType<typeof summarizeRhComplianceDocRows> & {
    globalStatus: RhUserComplianceResult['status'];
  };
};

export function buildRhCollaborateurCompliancePayload(
  user: RhComplianceUserInput,
  fileAssets: FileAssetSlice[],
): RhCollaborateurCompliancePayload {
  const compliance = evaluateRhUserCompliance(user);
  const rows = buildRhUserComplianceDocRows(user, fileAssets);
  const rowSummary = summarizeRhComplianceDocRows(rows);

  return {
    compliance,
    rows,
    summary: {
      ...rowSummary,
      globalStatus: compliance.status,
    },
  };
}
