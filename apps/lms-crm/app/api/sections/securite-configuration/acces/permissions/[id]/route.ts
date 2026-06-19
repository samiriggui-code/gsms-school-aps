import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { domainLabelForPermissionSlug } from '@/lib/auth/permission-domains';

// GET: Fetch a specific permission by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 }, // Unauthorized
      );
    }

    const { id } = await params;

    const permission = await prisma.userPermission.findUnique({
      where: { id },
    });

    if (!permission) {
      return NextResponse.json(
        { message: 'Record not found. Someone might have deleted it already.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...permission,
      domain: domainLabelForPermissionSlug(permission.slug),
    });
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}

// PUT: catalogue seed-driven — modification désactivée
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
  }
  await params;
  return NextResponse.json(
    {
      message:
        'Le catalogue permissions est en lecture seule. Modifiez le seed ou la matrice des rôles.',
    },
    { status: 403 },
  );
}

// DELETE: catalogue seed-driven — suppression désactivée
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
  }
  await params;
  return NextResponse.json(
    {
      message:
        'Le catalogue permissions est en lecture seule. Les droits ne peuvent pas être supprimés depuis l’interface.',
    },
    { status: 403 },
  );
}
