import type { InAppNotificationCategory, InAppNotificationChannel } from '@repo/database';

export const NOTIFICATION_CHANNELS = ['DOSSIER', 'PEDAGOGIE', 'ETABLISSEMENT'] as const satisfies readonly InAppNotificationChannel[];

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  DOSSIER: 'Mon dossier',
  PEDAGOGIE: 'Pédagogie',
  ETABLISSEMENT: 'Établissement',
};

export function notificationChannelLabel(channel: NotificationChannel): string {
  return CHANNEL_LABELS[channel];
}

/** Déduit le canal UX à partir de la catégorie, href et métadonnées événement. */
export function resolveNotificationChannel(input: {
  category: InAppNotificationCategory;
  href?: string | null;
  metadata?: Record<string, unknown> | null;
}): InAppNotificationChannel {
  const href = input.href ?? '';
  const meta = input.metadata ?? {};
  const eventType = typeof meta.eventType === 'string' ? meta.eventType : '';
  const moduleKey = typeof meta.moduleKey === 'string' ? meta.moduleKey : '';

  if (
    eventType.startsWith('learner.dossier') ||
    eventType.startsWith('candidature.') ||
    eventType.startsWith('compliance.') ||
    href.startsWith('/mon-dossier')
  ) {
    return 'DOSSIER';
  }

  if (
    eventType.startsWith('lms.') ||
    eventType.startsWith('session.chat') ||
    eventType.startsWith('portal-') ||
    eventType.startsWith('learner.') ||
    moduleKey.startsWith('portal-') ||
    href.startsWith('/e-formation') ||
    href.startsWith('/formateur') ||
    href.includes('contenu-e-formation') ||
    (input.category === 'ACADEMIC' &&
      (href.startsWith('/gestion-academique') || href.includes('/sessions')))
  ) {
    return 'PEDAGOGIE';
  }

  if (input.category === 'ACADEMIC' || input.category === 'TEAM') {
    return 'PEDAGOGIE';
  }

  return 'ETABLISSEMENT';
}
