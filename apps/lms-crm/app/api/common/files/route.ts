import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { createFileAssetWithVersion } from '@/lib/file-asset-service';

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

  const items = await prisma.fileAsset.findMany({
    where: {
      status: 'ACTIVE',
      deletedAt: null,
      ...(moduleName ? { module: moduleName } : {}),
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({ data: items });
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
