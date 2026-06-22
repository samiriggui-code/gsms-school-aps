import {
  userPersonalMailbox,
  userProfessionalMailbox,
  userReportMailbox,
  userTransactionalMailbox,
  type UserMailboxFields,
} from '@repo/api-core/user-email-routing';
import { buildAppLoginEmail } from '@/lib/app-login-email';

export {
  userPersonalMailbox,
  userProfessionalMailbox,
  userReportMailbox,
  userTransactionalMailbox,
  type UserMailboxFields,
};

export function resolveCreateUserEmails(input: {
  email: string;
  proEmail?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): { email: string; proEmail: string } {
  const personal = input.email.trim();
  const first = input.firstName?.trim() ?? '';
  const last = input.lastName?.trim() ?? '';
  const pro =
    input.proEmail?.trim() ||
    (first && last ? buildAppLoginEmail(first, last) : '');
  if (!personal) throw new Error('Email personnel requis.');
  if (!pro) throw new Error('Email professionnel requis (prénom + nom).');
  return { email: personal, proEmail: pro.toLowerCase() };
}

export type PrismaUserEmailLookup = {
  user: {
    findFirst: (args: {
      where: Record<string, unknown>;
      select?: Record<string, boolean>;
    }) => Promise<{ id: string } | null>;
  };
};

export async function assertUserMailboxesAvailable(
  prisma: PrismaUserEmailLookup,
  mailboxes: { email: string; proEmail: string },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const [dupPersonal, dupPro] = await Promise.all([
    prisma.user.findFirst({
      where: {
        isTrashed: false,
        email: { equals: mailboxes.email, mode: 'insensitive' },
      },
      select: { id: true },
    }),
    prisma.user.findFirst({
      where: {
        isTrashed: false,
        proEmail: { equals: mailboxes.proEmail, mode: 'insensitive' },
      },
      select: { id: true },
    }),
  ]);
  if (dupPersonal) {
    return { ok: false, message: 'Cet e-mail personnel est déjà enregistré.' };
  }
  if (dupPro) {
    return { ok: false, message: 'Cet e-mail professionnel est déjà utilisé.' };
  }
  return { ok: true };
}

/** Identifiant affiché sous le nom (liste IAM, en-têtes) — connexion app. */
export function userIamLoginSubtitle(user: UserMailboxFields): string {
  return userProfessionalMailbox(user) ?? userPersonalMailbox(user) ?? '—';
}
