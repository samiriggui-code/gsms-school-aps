import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/services/send-email';
import { LANDING_LEAD_SOURCES } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';

type Ctx = { params: Promise<{ leadId: string }> };

type Body = {
  subject?: string;
  message?: string;
};

export async function POST(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { leadId } = await context.params;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const subject = (body.subject ?? '').trim() || 'Suite a votre demande';
  const message = (body.message ?? '').trim();
  if (!message) return fail('Message requis.', 400);

  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        source: { in: [...LANDING_LEAD_SOURCES] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });
    if (!lead) return fail('Lead introuvable.', 404);

    await sendEmail({
      to: lead.email,
      subject,
      content: {
        title: `Bonjour ${lead.firstName} ${lead.lastName}`,
        subtitle: message,
      },
    });

    return ok({ sent: true });
  } catch (e) {
    console.error('[landing-leads reply]', e);
    return fail("Envoi de l'email impossible.", 500, e);
  }
}
