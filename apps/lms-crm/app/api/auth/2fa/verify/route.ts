import { NextResponse } from 'next/server';

/** Vérification OTP 2FA — non branché (masqué côté UI). */
export async function POST() {
  return NextResponse.json(
    {
      message:
        'La double authentification n’est pas encore activée. Utilisez e-mail professionnel + mot de passe.',
    },
    { status: 501 },
  );
}
