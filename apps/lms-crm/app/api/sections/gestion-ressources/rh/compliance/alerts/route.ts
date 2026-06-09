import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

type AlertSeverity = 'CRITICAL' | 'WARNING';

type ComplianceAlert = {
  id: string;
  userId: string;
  userName: string;
  type: string;
  itemType: string;
  expiryDate: string;
  severity: AlertSeverity;
};

function severityFor(expiry: Date, now: Date): AlertSeverity | null {
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'CRITICAL';
  if (diffDays <= 30) return 'WARNING';
  return null;
}

function pushExpiryAlert(
  alerts: ComplianceAlert[],
  input: {
    userId: string;
    userName: string;
    expiry: Date;
    type: string;
    itemType: string;
    now: Date;
  },
) {
  const severity = severityFor(input.expiry, input.now);
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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 30);

  const alerts: ComplianceAlert[] = [];

  const users = await prisma.user.findMany({
    where: {
      isTrashed: false,
      OR: [
        { carteProExpiry: { lte: horizon } },
        { residencePermitExpiry: { lte: horizon } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      carteProExpiry: true,
      residencePermitExpiry: true,
    },
    take: 50,
  });

  for (const user of users) {
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

  const certificates = await prisma.userCertificate.findMany({
    where: { expiryDate: { lte: horizon } },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      certification: { select: { id: true } },
    },
    take: 50,
  });

  for (const cert of certificates) {
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
    if (a.severity !== b.severity) {
      return a.severity === 'CRITICAL' ? -1 : 1;
    }
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });

  return ok(alerts.slice(0, 30));
}
