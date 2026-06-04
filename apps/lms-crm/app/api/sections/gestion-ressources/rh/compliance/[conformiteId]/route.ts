import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import {
  isDirectorRole,
  isFormateurRole,
} from '@/lib/rh-agrement';

function pushExpiryIssues(
  label: string,
  expiry: Date | null | undefined,
  issues: { severity: string; message: string }[],
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conformiteId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { conformiteId } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: conformiteId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        userCategory: true,
        qualification: true,
        carteProNumber: true,
        carteProExpiry: true,
        documentCni: true,
        documentAssurance: true,
        documentCartePro: true,
        documentResidencePermit: true,
        birthDate: true,
        residencePermitExpiry: true,
        role: { select: { slug: true } },
      },
    });

    if (!user) return fail('Conformité non trouvée', 404);

    const slug = user.role?.slug ?? null;
    const issues: { severity: string; message: string }[] = [];
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
      const rpCrit = pushExpiryIssues(
        'Permis de séjour',
        user.residencePermitExpiry,
        issues,
      );
      if (rpCrit === 'critical') canBeAssigned = false;
    }

    const hasAgrementDoc = Boolean(user.documentCartePro);
    const hasAgrementRef = Boolean(user.carteProNumber?.trim());

    if (isFormateurRole(slug)) {
      if (!hasAgrementRef) {
        issues.push({
          severity: 'CRITICAL',
          message: 'Référence d’agrément formateur manquante.',
        });
        canBeAssigned = false;
      }
      if (!hasAgrementDoc) {
        issues.push({
          severity: 'WARNING',
          message: 'Justificatif d’agrément formateur non versé.',
        });
      }
      const ex = pushExpiryIssues(
        'Agrément formateur',
        user.carteProExpiry,
        issues,
      );
      if (ex === 'critical') canBeAssigned = false;
    } else if (isDirectorRole(slug)) {
      if (!hasAgrementRef) {
        issues.push({
          severity: 'CRITICAL',
          message: 'Référence d’agrément dirigeant manquante.',
        });
        canBeAssigned = false;
      }
      if (!hasAgrementDoc) {
        issues.push({
          severity: 'WARNING',
          message: 'Justificatif d’agrément dirigeant non versé.',
        });
      }
      const ex = pushExpiryIssues(
        'Agrément dirigeant',
        user.carteProExpiry,
        issues,
      );
      if (ex === 'critical') canBeAssigned = false;
    } else {
      if (
        user.qualification?.trim()
        && !hasAgrementRef
      ) {
        issues.push({
          severity: 'WARNING',
          message:
            'Qualification renseignée : envisager une référence d’habilitation ou agrément si le poste l’exige.',
        });
      }
      pushExpiryIssues('Habilitation / agrément', user.carteProExpiry, issues);
    }

    if (user.residencePermitExpiry && user.userCategory !== 'SUBCONTRACTOR') {
      pushExpiryIssues('Titre de séjour', user.residencePermitExpiry, issues);
    }

    const hasCritical = issues.some((i) => i.severity === 'CRITICAL');
    const hasWarning = issues.some((i) => i.severity === 'WARNING');
    const status = hasCritical
      ? 'NON_COMPLIANT'
      : hasWarning
        ? 'WARNING'
        : 'COMPLIANT';

    return ok({
      status,
      canBeAssigned,
      issues,
    });
  } catch (error) {
    return fail('Impossible de récupérer la conformité.', 500, error);
  }
}
