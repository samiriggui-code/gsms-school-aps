import { NextRequest, NextResponse } from 'next/server';

/** Vérification OTP 2FA — stub en attente du schéma Prisma + fournisseur SMS/e-mail. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = String(body?.code ?? '').trim();

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { message: 'Code invalide — 6 chiffres requis.' },
        { status: 400 },
      );
    }

    // TODO: valider le challenge OTP stocké (Redis / DB) et finaliser la session.
    if (process.env.NODE_ENV === 'development' && code === '000000') {
      return NextResponse.json({ success: true, message: 'Code dev accepté.' });
    }

    return NextResponse.json(
      {
        message:
          'La double authentification sera activée prochainement. Utilisez le code 000000 en développement.',
      },
      { status: 501 },
    );
  } catch {
    return NextResponse.json(
      { message: 'Impossible de vérifier le code.' },
      { status: 500 },
    );
  }
}
