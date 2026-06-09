import { GetObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { getS3ClientInstance } from '@/lib/s3-client';

type RouteParams = { params: Promise<{ path?: string[] }> };

/** Compatibilité URLs historiques `/media/company/...` → objet MinIO `company/...`. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const segments = (await params).path ?? [];
  const key = `company/${segments.map((s) => s.replace(/\.\./g, '')).join('/')}`.replace(/\/+$/, '');
  if (key === 'company' || key === 'company/') {
    return NextResponse.json({ message: 'Chemin fichier manquant' }, { status: 400 });
  }

  const bucket = process.env.STORAGE_BUCKET;
  if (!bucket || !process.env.STORAGE_ENDPOINT) {
    return NextResponse.json({ message: 'Stockage non configuré' }, { status: 503 });
  }

  try {
    const client = getS3ClientInstance();
    const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = out.Body;
    if (!body) {
      return NextResponse.json({ message: 'Fichier vide' }, { status: 404 });
    }
    const bytes = await body.transformToByteArray();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': out.ContentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ message: 'Fichier introuvable' }, { status: 404 });
  }
}
