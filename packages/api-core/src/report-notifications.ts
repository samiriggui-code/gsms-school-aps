import type { PrismaClient } from '@repo/database';
import { sendEmail } from '@repo/mail';
import { CRM_MODULE_KEYS, CrmEventService } from './crm-events';
import type { ReportGenerationSource } from './report-dedup';

export type NotifyReportGeneratedInput = {
  jobId: string;
  fileAssetId: string;
  templateKey: string;
  title: string;
  periodLabel: string;
  format: string;
  requestedById: string;
  source: ReportGenerationSource;
  scheduleId?: string;
};

/** Destinataires : demandeur + formateurs + collaborateurs actifs. */
async function resolveReportAudience(prisma: PrismaClient, requestedById: string): Promise<string[]> {
  const [formateurs, collaborateurs] = await Promise.all([
    prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        isTrashed: false,
        businessRoles: { some: { label: 'FORMATEUR' } },
      },
      select: { id: true },
    }),
    prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        isTrashed: false,
        collaborateurProfile: { isNot: null },
      },
      select: { id: true },
    }),
  ]);

  const ids = new Set<string>([requestedById]);
  for (const u of formateurs) ids.add(u.id);
  for (const u of collaborateurs) ids.add(u.id);
  return [...ids];
}

export async function notifyReportGenerated(
  prisma: PrismaClient,
  input: NotifyReportGeneratedInput,
): Promise<void> {
  const userIds = await resolveReportAudience(prisma, input.requestedById);
  const href = `/pilotage-supervision/pilotage/rapports`;
  const sourceLabel =
    input.source === 'schedule'
      ? 'planification automatique'
      : input.source === 'run_now'
        ? 'lancement manuel depuis les automatisations'
        : 'génération manuelle';

  const events = new CrmEventService(prisma);
  await events.enqueue({
    eventType: 'pilotage.report.generated',
    moduleKey: CRM_MODULE_KEYS.PILOTAGE,
    category: 'SYSTEM',
    severity: 'INFO',
    title: `Rapport disponible : ${input.title}`,
    body: `${input.format} — ${input.periodLabel} (${sourceLabel}). Consultez l’historique des rapports.`,
    href,
    audience: 'USER_IDS',
    userIds,
    createdById: input.requestedById,
    dedupeKey: `report:${input.fileAssetId}`,
    payload: {
      jobId: input.jobId,
      fileAssetId: input.fileAssetId,
      templateKey: input.templateKey,
      format: input.format,
      source: input.source,
      scheduleId: input.scheduleId ?? null,
    },
  });
}

/** E-mails optionnels — désactivables via REPORT_EMAIL_DISABLED=1. */
export async function sendReportGeneratedEmails(
  prisma: PrismaClient,
  input: NotifyReportGeneratedInput,
): Promise<{ sent: number; skipped: boolean }> {
  if (process.env.REPORT_EMAIL_DISABLED === '1') {
    return { sent: 0, skipped: true };
  }

  const userIds = await resolveReportAudience(prisma, input.requestedById);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, status: 'ACTIVE', isTrashed: false },
    select: { email: true, firstName: true },
  });

  const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3001').replace(/\/$/, '');
  const link = `${baseUrl}${`/pilotage-supervision/pilotage/rapports`}`;
  let sent = 0;

  for (const user of users) {
    if (!user.email) continue;
    const name = user.firstName?.trim() || 'collaborateur';
    try {
      await sendEmail({
        to: user.email,
        subject: `[Pilotage] Rapport disponible — ${input.title}`,
        html: `
          <p>Bonjour ${name},</p>
          <p>Un nouveau rapport est disponible : <strong>${input.title}</strong> (${input.format}, ${input.periodLabel}).</p>
          <p><a href="${link}">Consulter l'historique des rapports</a></p>
        `,
        text: `Rapport disponible : ${input.title} (${input.format}, ${input.periodLabel}). ${link}`,
      });
      sent += 1;
    } catch (err) {
      console.error('[ReportNotify] email failed', user.email, err);
    }
  }

  return { sent, skipped: false };
}
