import { NextRequest, NextResponse } from 'next/server';

/** Renvoi d’un code OTP 2FA — stub (e-mail / WhatsApp / SMS à brancher). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const channel = String(body?.channel ?? 'email');
    const destination = String(body?.destination ?? '').trim();

    if (!destination) {
      return NextResponse.json(
        { message: 'Destinataire manquant pour le renvoi du code.' },
        { status: 400 },
      );
    }

    // TODO: générer OTP, persister challenge, envoyer via sendEmail / WhatsApp / SMS.
    return NextResponse.json({
      success: true,
      message: `Code renvoyé (${channel}) — intégration messagerie à venir.`,
      channel,
    });
  } catch {
    return NextResponse.json(
      { message: 'Impossible de renvoyer le code.' },
      { status: 500 },
    );
  }
}
