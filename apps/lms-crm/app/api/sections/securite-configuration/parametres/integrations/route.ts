import { getDocsPublicUrl } from '@/config/general.config';
import { prisma } from '@/lib/prisma';
import { getRedis, isRedisCacheDisabled, isRedisMemoryFallbackActive } from '@repo/redis';
import { ok, fail } from '@/app/api/_shared/http/response';
import { requireCrmApiAuth } from '@/lib/auth/require-permission';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';

type IntegrationItem = {
  id: string;
  label: string;
  description: string;
  connected: boolean;
  detail?: string;
  href?: string;
};

export async function GET() {
  const auth = await requireCrmApiAuth(CRM_PERMISSION.securiteView);
  if (!auth.ok) return auth.response;

  try {
    const setting = await prisma.systemSetting.findFirst({ orderBy: { id: 'asc' } });
    const landingUrl = (
      process.env.NEXT_PUBLIC_LANDING_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      ''
    ).trim();
    const crmUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim();
    const docsUrl = getDocsPublicUrl();

    const redisMemoryMode = isRedisCacheDisabled() || isRedisMemoryFallbackActive();
    let redisOk = false;
    let redisDetail = 'Redis inaccessible';
    if (redisMemoryMode) {
      redisOk = true;
      redisDetail = isRedisCacheDisabled()
        ? 'Cache mémoire (REDIS_CACHE_DISABLED)'
        : 'Cache mémoire (Redis indisponible)';
    } else {
      try {
        const pong = await getRedis().ping();
        redisOk = pong === 'PONG';
        redisDetail = redisOk ? 'Connexion OK' : 'Redis inaccessible';
      } catch {
        redisOk = false;
      }
    }

    const emailViaResend = Boolean(process.env.RESEND_API_KEY?.trim());
    const emailViaSmtp = Boolean(process.env.SMTP_HOST?.trim());
    const emailConnected = emailViaResend || emailViaSmtp;

    const items: IntegrationItem[] = [
      {
        id: 'platform',
        label: 'Plateforme CRM',
        description: 'Statut global de la plateforme (landing + CRM).',
        connected: setting?.active ?? false,
        detail: setting?.active ? 'Active' : 'Mode maintenance',
      },
      {
        id: 'landing',
        label: 'Site landing',
        description: 'Site public acquisition & préinscriptions.',
        connected: Boolean(landingUrl),
        detail: landingUrl || 'NEXT_PUBLIC_LANDING_URL non défini',
        href: landingUrl || undefined,
      },
      {
        id: 'crm-url',
        label: 'URL CRM',
        description: 'URL publique du back-office.',
        connected: Boolean(crmUrl),
        detail: crmUrl || 'NEXT_PUBLIC_SITE_URL non défini',
      },
      {
        id: 'email',
        label: 'E-mail transactionnel',
        description: 'Devis, plaquettes, notifications e-mail.',
        connected: emailConnected,
        detail: emailViaResend
          ? 'Resend configuré'
          : emailViaSmtp
            ? `SMTP (${process.env.SMTP_HOST})`
            : 'RESEND_API_KEY ou SMTP_HOST requis',
      },
      {
        id: 'pusher',
        label: 'Temps réel (Pusher)',
        description: 'Historiques et mises à jour live (fiches RH, candidatures…).',
        connected: Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY?.trim()),
        detail: process.env.NEXT_PUBLIC_PUSHER_KEY
          ? `Cluster ${process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu'}`
          : 'NEXT_PUBLIC_PUSHER_KEY manquant',
      },
      {
        id: 'redis',
        label: 'Cache Redis',
        description: 'Statistiques et cache api-core.',
        connected: redisOk,
        detail: redisDetail,
      },
      {
        id: 'sentry',
        label: 'Monitoring (Sentry)',
        description: 'Erreurs applicatives CRM / landing.',
        connected: Boolean(
          process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim(),
        ),
        detail: 'Surveillance des erreurs production',
      },
      {
        id: 'docs',
        label: 'Documentation interne',
        description: 'Documentation intégrée (/docs) depuis le CRM.',
        connected: Boolean(docsUrl),
        detail: docsUrl || 'NEXT_PUBLIC_SITE_URL non défini',
        href: docsUrl || undefined,
      },
      {
        id: 'chat',
        label: 'Chat support',
        description: 'Messagerie instantanée dans le header CRM.',
        connected: false,
        detail: 'Interface présente — backend à connecter',
      },
    ];

    return ok({ items, landingEnabled: setting?.active ?? true });
  } catch (error) {
    return fail('Impossible de charger les intégrations.', 500, error);
  }
}
