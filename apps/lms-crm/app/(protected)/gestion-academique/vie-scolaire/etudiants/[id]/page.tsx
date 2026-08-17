import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

/**
 * Anciennes notifs / liens pointaient vers /etudiants/[id] (page inexistante).
 * On résout userId ou candidatureId puis on ouvre la liste avec query params (sheet).
 */
export default async function EtudiantDeepLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const base = '/gestion-academique/vie-scolaire/etudiants';

  if (!id?.trim()) {
    redirect(base);
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (user) {
    redirect(`${base}?userId=${encodeURIComponent(user.id)}`);
  }

  const candidature = await prisma.candidature.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (candidature) {
    const sp = new URLSearchParams({
      userId: candidature.userId,
      candidatureId: candidature.id,
    });
    redirect(`${base}?${sp.toString()}`);
  }

  redirect(base);
}
