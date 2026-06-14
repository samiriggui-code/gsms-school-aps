import { NextRequest, NextResponse } from 'next/server';
import { getStoredFile } from '@repo/storage';

type RouteParams = { params: Promise<{ path?: string[] }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const segments = (await params).path ?? [];
  const key = segments.map((s) => s.replace(/\.\./g, '')).join('/');
  if (!key) {
    return NextResponse.json({ message: 'Chemin fichier manquant' }, { status: 400 });
  }

  const file = await getStoredFile(key);
  if (!file) {
    return NextResponse.json({ message: 'Fichier introuvable' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.body), {
    status: 200,
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': file.cacheControl,
    },
  });
}
