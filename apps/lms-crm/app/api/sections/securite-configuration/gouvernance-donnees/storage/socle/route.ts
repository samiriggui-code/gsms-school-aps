import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  ensureStorageSocle,
  getStorageMode,
  getStorageSocleStatus,
  isRemoteStorageConfigured,
} from '@repo/storage';
import { GOVERNANCE_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

function storageAccessUrls() {
  const mode = getStorageMode();
  const appBase = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || 'http://localhost:3001';
  const monitoringHost = process.env.MONITORING_HOST?.trim();
  const domain = process.env.DOMAIN?.trim();
  const monitoringUrl =
    mode === 'local'
      ? null
      : monitoringHost
        ? `https://${monitoringHost}`
        : domain
          ? `https://monitoring.${domain}`
          : null;
  const minioConsoleUrl = process.env.STORAGE_MINIO_CONSOLE_URL?.trim() || null;
  const publicBase =
    mode === 'local'
      ? `${appBase}/uploads`
      : process.env.STORAGE_CDN_URL?.trim() || `${appBase}/api/public/storage`;

  return {
    monitoringUrl,
    minioConsoleUrl,
    publicBaseUrl: publicBase,
    bucket: process.env.STORAGE_BUCKET?.trim() || 'lms-uploads',
    mode,
    remoteConfigured: isRemoteStorageConfigured(),
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, GOVERNANCE_PERMISSION.storageAdmin)) {
    return fail('Forbidden', 403);
  }

  try {
    const [socle, access] = await Promise.all([
      getStorageSocleStatus(),
      Promise.resolve(storageAccessUrls()),
    ]);

    return ok({
      ...access,
      socle,
      accessModes: {
        ...(access.monitoringUrl
          ? {
              monitoring: {
                label: 'Monitoring infra',
                description: 'Tableau de bord stack + état conteneur MinIO.',
                href: access.monitoringUrl,
              },
            }
          : {}),
        minioConsole: access.minioConsoleUrl
          ? {
              label: 'Console MinIO',
              description: 'Interface admin S3 (accès restreint).',
              href: access.minioConsoleUrl,
            }
          : null,
        governance: {
          label: 'Demandes documents',
          description: 'Suivi des pièces manquantes et relances candidats / stagiaires.',
          href: '/securite-configuration/gouvernance-donnees/demandes-documents',
        },
      },
    });
  } catch (e) {
    return fail('Impossible de lire le socle stockage.', 500, e);
  }
}

export async function POST(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, GOVERNANCE_PERMISSION.storageAdmin)) {
    return fail('Forbidden', 403);
  }

  try {
    const result = await ensureStorageSocle();
    const socle = await getStorageSocleStatus();
    return ok({ result, socle });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Échec initialisation socle.';
    return fail(msg, 500, e);
  }
}
