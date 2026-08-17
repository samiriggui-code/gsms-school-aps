import { NextResponse } from 'next/server';

/** Renvoi OTP 2FA — non branché (masqué côté UI). */
export async function POST() {
  return NextResponse.json(
    {
      message:
        'La double authentification n’est pas encore activée. Aucun code n’a été envoyé.',
    },
    { status: 501 },
  );
}
