import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendContactFormEmails } from '@repo/mail';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(320),
  subject: z.string().min(5).max(500),
  message: z.string().min(10).max(8000),
  /** Anti-bot : doit rester vide */
  _trap: z.string().max(200).optional(),
});

function clean(s: string) {
  return s.trim();
}

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ message: 'Corps JSON invalide.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      (first.name?.[0] as string | undefined) ||
      (first.email?.[0] as string | undefined) ||
      (first.subject?.[0] as string | undefined) ||
      (first.message?.[0] as string | undefined) ||
      'Données invalides.';
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  const { name, email, subject, message, _trap } = parsed.data;
  if (_trap && clean(_trap)) {
    return NextResponse.json({ message: 'Refus.' }, { status: 400 });
  }

  const safeName = clean(name);
  const safeEmail = clean(email).toLowerCase();
  const safeSubject = clean(subject);
  const safeMessage = clean(message);

  try {
    await sendContactFormEmails(
      {
        name: safeName,
        email: safeEmail,
        subject: safeSubject,
        message: safeMessage,
      },
      {
        assetsOrigin: process.env.NEXT_PUBLIC_SITE_URL,
      },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Échec envoi e-mail.';
    console.error('[contact]', e);
    return NextResponse.json({ message: msg }, { status: 503 });
  }

  try {
    const count = await prisma.supportTicket.count();
    const referenceCode = `TKT-${String(count + 1).padStart(4, '0')}`;
    await prisma.supportTicket.create({
      data: {
        referenceCode,
        subject: safeSubject,
        description: `[Contact landing]\n\n${safeMessage}`,
        requesterName: safeName,
        requesterEmail: safeEmail,
        priority: 'MEDIUM',
        status: 'OPEN',
      },
    });
  } catch (e) {
    console.error('[contact] ticket CRM', e);
  }

  return NextResponse.json({ message: 'Message envoyé.' }, { status: 200 });
}
