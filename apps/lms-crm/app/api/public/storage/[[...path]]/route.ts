import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { getStoredFile } from '@repo/storage';
import { prisma } from '@/lib/prisma';
import { canServeFileAsset } from '@/lib/http/common-files-access';

type RouteParams = { params: Promise<{ path?: string[] }> };

type ServeRecord = {
  visibility: string;
  createdById: string | null;
  module: string;
  mimeType: string;
  status: string;
  deletedAt: Date | null;
};

/**
 * Préfixes historiques jamais suivis par un FileAsset (avatars, logos, divers) — seuls chemins
 * servis sans enregistrement en base. Tout le reste doit être tracé par un FileAsset pour être servi.
 */
const UNTRACKED_PUBLIC_PREFIX = /^(avatars|company|misc)\//;

const ASSET_SELECT = {
  visibility: true,
  createdById: true,
  module: true,
  mimeType: true,
  status: true,
  deletedAt: true,
} as const;

function isServableAsset(record: ServeRecord): boolean {
  return record.deletedAt == null && record.status === 'ACTIVE';
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const segments = (await params).path ?? [];
  const key = segments.map((s) => s.replace(/\.\./g, '')).join('/');
  if (!key) {
    return NextResponse.json({ message: 'Chemin fichier manquant' }, { status: 400 });
  }

  const [asset, version] = await Promise.all([
    prisma.fileAsset.findUnique({
      where: { storageKey: key },
      select: ASSET_SELECT,
    }),
    prisma.fileAssetVersion.findUnique({
      where: { storageKey: key },
      select: { fileAsset: { select: ASSET_SELECT } },
    }),
  ]);
  const record: ServeRecord | null = asset ?? version?.fileAsset ?? null;

  if (record) {
    if (!isServableAsset(record)) {
      return NextResponse.json({ message: 'Fichier introuvable' }, { status: 404 });
    }
    const session =
      record.visibility === 'PUBLIC' ? null : await getServerSession(authOptions);
    if (!canServeFileAsset(session, record)) {
      return NextResponse.json({ message: 'Fichier introuvable' }, { status: 404 });
    }
  } else if (!UNTRACKED_PUBLIC_PREFIX.test(key)) {
    // Aucun FileAsset ne référence cette clé et le chemin ne correspond à aucun préfixe public
    // connu : on refuse par défaut plutôt que de servir un fichier non tracé (fail-closed).
    return NextResponse.json({ message: 'Fichier introuvable' }, { status: 404 });
  }

  const file = await getStoredFile(key);
  if (!file) {
    return NextResponse.json({ message: 'Fichier introuvable' }, { status: 404 });
  }

  const isPublic = !record || record.visibility === 'PUBLIC';
  const contentType = record?.mimeType || file.contentType;

  return new NextResponse(new Uint8Array(file.body), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': isPublic ? file.cacheControl : 'private, max-age=0, no-store',
    },
  });
}
