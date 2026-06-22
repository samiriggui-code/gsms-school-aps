import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/services/send-email';
import { userTransactionalMailbox } from '@/lib/user-email-routing';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const query = String(email || '').trim();
    if (!query) {
      return NextResponse.json({ message: 'Email requis.' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        isTrashed: false,
        OR: [
          { email: { equals: query, mode: 'insensitive' } },
          { proEmail: { equals: query, mode: 'insensitive' } },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message:
            'Si un compte existe avec cette adresse, un lien de réinitialisation a été envoyé.',
        },
        { status: 200 },
      );
    }

    const notifyTo = userTransactionalMailbox(user);
    if (!notifyTo) {
      return NextResponse.json(
        {
          message:
            'Si un compte existe avec cette adresse, un lien de réinitialisation a été envoyé.',
        },
        { status: 200 },
      );
    }

    const token = crypto.randomBytes(32).toString('hex');

    await prisma.verificationToken.create({
      data: {
        identifier: user.id,
        token,
        expires: new Date(Date.now() + 1 * 60 * 60 * 1000),
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/change-password?token=${token}`;

    await sendEmail({
      to: notifyTo,
      subject: 'Réinitialisation de mot de passe',
      content: {
        title: `Bonjour ${user.name ?? ''}`.trim(),
        subtitle:
          'Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le lien ci-dessous.',
        buttonLabel: 'Réinitialiser le mot de passe',
        buttonUrl: resetUrl,
        description:
          'Ce lien est valable 1 heure. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.',
      },
    });

    return NextResponse.json(
      {
        message:
          'Si un compte existe avec cette adresse, un lien de réinitialisation a été envoyé.',
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error('Password reset error:', err);
    return NextResponse.json({ message: 'Échec du traitement.' }, { status: 500 });
  }
}
