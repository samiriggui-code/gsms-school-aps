import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function DELETE(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
  }
  return NextResponse.json(
    {
      message:
        'Le catalogue permissions est en lecture seule. Les droits ne peuvent pas être supprimés depuis l’interface.',
    },
    { status: 403 },
  );
}
