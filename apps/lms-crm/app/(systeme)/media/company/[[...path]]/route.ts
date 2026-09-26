import { NextRequest, NextResponse } from 'next/server';
import { getStoredFile } from '@repo/storage';

type RouteParams = { params: Promise<{ path?: string[] }> };

/** Compatibilité URLs historiques `/media/company/...` → `company/...`. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const segments = (await params).path ?? [];
  const key = `company/${segments.map((s) => s.replace(/\.\./g, '')).join('/')}`.replace(/\/+$/, '');
  if (key === 'company' || key === 'company/') {
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
