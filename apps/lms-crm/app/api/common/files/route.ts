import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { createFileAssetWithVersion } from '@/lib/file-asset-service';
import {
  COMMON_FILES_ALLOWED_MIME,
  COMMON_FILES_MAX_BYTES,
  canAccessFilesModule,
  canListFileAssetRow,
} from '@/lib/http/common-files-access';

type PrismaFileVisibility = 'PRIVATE' | 'INTERNAL' | 'PUBLIC';

function toVisibility(value: string | null): PrismaFileVisibility {
  const normalized = (value || 'PRIVATE').toUpperCase();
  if (normalized === 'PUBLIC') return 'PUBLIC';
  if (normalized === 'INTERNAL') return 'INTERNAL';
  return 'PRIVATE';
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

  const url = new URL(request.url);
  const moduleName = (url.searchParams.get('module') || '').trim();
  const entityType = (url.searchParams.get('entityType') || '').trim();
  const entityId = (url.searchParams.get('entityId') || '').trim();

  // Pas de balayage total de FileAsset — module + entityType obligatoires.
  if (!moduleName || !entityType) {
    return NextResponse.json(
      { message: 'module and entityType are required' },
      { status: 400 },
    );
  }
  if (!canAccessFilesModule(session, moduleName, 'view')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const items = await prisma.fileAsset.findMany({
    where: {
      status: 'ACTIVE',
      deletedAt: null,
      module: moduleName,
      entityType,
      ...(entityId ? { entityId } : {}),
    },
    select: {
      id: true,
      module: true,
      entityType: true,
      entityId: true,
      category: true,
      originalName: true,
      mimeType: true,
      size: true,
      url: true,
      visibility: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
      issuedAt: true,
      expiresAt: true,
      issuedBy: true,
      documentRef: true,
      currentVersionId: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const visible = items.filter((item) => canListFileAssetRow(session, item));
  return NextResponse.json({ data: visible });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file');
  const moduleName = String(formData.get('module') || '').trim();
  const entityType = String(formData.get('entityType') || '').trim();
  const entityId = String(formData.get('entityId') || '').trim() || null;
  const category = String(formData.get('category') || '').trim() || null;
  const visibility = toVisibility(String(formData.get('visibility') || 'PRIVATE'));

  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'file is required' }, { status: 400 });
  }
  if (!moduleName || !entityType) {
    return NextResponse.json({ message: 'module and entityType are required' }, { status: 400 });
  }
  if (!canAccessFilesModule(session, moduleName, 'edit')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const mimeType = (file.type || '').trim().toLowerCase() || 'application/octet-stream';
  if (!COMMON_FILES_ALLOWED_MIME.has(mimeType)) {
    return NextResponse.json(
      { message: `mimeType not allowed: ${mimeType}` },
      { status: 415 },
    );
  }
  if (file.size <= 0 || file.size > COMMON_FILES_MAX_BYTES) {
    return NextResponse.json(
      { message: `file size must be between 1 byte and ${COMMON_FILES_MAX_BYTES} bytes` },
      { status: 413 },
    );
  }

  const asset = await createFileAssetWithVersion({
    file,
    module: moduleName,
    entityType,
    entityId,
    category,
    visibility,
    createdById: session.user.id,
  });

  return NextResponse.json({ data: asset }, { status: 201 });
}
