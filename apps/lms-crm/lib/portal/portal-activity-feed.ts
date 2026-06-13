import type { PortalAnnouncementRow } from './portal-session-announcements';

export type PortalActivityKind = 'admin' | 'learning' | 'announcement';

export type PortalActivityItem = {
  id: string;
  kind: PortalActivityKind;
  action: string;
  target: string;
  detail?: string;
  at: string;
  href?: string;
};

type AdminMilestone = {
  key: string;
  action: string;
  target: string;
  at: Date | null;
  href?: string;
};

type LearningEvent = {
  id: string;
  action: string;
  target: string;
  detail?: string;
  at: Date;
  href?: string;
};

export function buildPortalRecentActivity(input: {
  candidature: {
    formationName: string | null;
    inscriptionAt: Date;
    dossierSubmittedAt: Date | null;
    cnapsSubmittedAt: Date | null;
    validatedAt: Date | null;
    completedAt: Date | null;
  } | null;
  progressEvents: LearningEvent[];
  quizEvents: LearningEvent[];
  announcements: PortalAnnouncementRow[];
  limit?: number;
}): PortalActivityItem[] {
  const { candidature, progressEvents, quizEvents, announcements, limit = 12 } = input;
  const items: Array<PortalActivityItem & { sort: number }> = [];

  if (candidature) {
    const milestones: AdminMilestone[] = [
      {
        key: 'validated',
        action: 'Dossier validé',
        target: candidature.formationName ?? 'Formation',
        at: candidature.validatedAt ?? candidature.completedAt,
        href: '/mon-dossier',
      },
      {
        key: 'cnaps',
        action: 'Dépôt CNAPS enregistré',
        target: candidature.formationName ?? 'Dossier',
        at: candidature.cnapsSubmittedAt,
        href: '/mon-dossier',
      },
      {
        key: 'dossier',
        action: 'Dossier transmis',
        target: candidature.formationName ?? 'Candidature',
        at: candidature.dossierSubmittedAt,
        href: '/mon-dossier',
      },
      {
        key: 'inscription',
        action: 'Inscription créée',
        target: candidature.formationName ?? 'Espace candidat',
        at: candidature.inscriptionAt,
        href: '/mon-dossier',
      },
    ];

    for (const m of milestones) {
      if (!m.at) continue;
      items.push({
        id: `admin-${m.key}`,
        kind: 'admin',
        action: m.action,
        target: m.target,
        at: m.at.toISOString(),
        href: m.href,
        sort: m.at.getTime(),
      });
    }
  }

  for (const e of progressEvents) {
    items.push({
      id: e.id,
      kind: 'learning',
      action: e.action,
      target: e.target,
      detail: e.detail,
      at: e.at.toISOString(),
      href: e.href,
      sort: e.at.getTime(),
    });
  }

  for (const e of quizEvents) {
    items.push({
      id: e.id,
      kind: 'learning',
      action: e.action,
      target: e.target,
      detail: e.detail,
      at: e.at.toISOString(),
      href: e.href,
      sort: e.at.getTime(),
    });
  }

  for (const a of announcements) {
    items.push({
      id: `ann-${a.id}`,
      kind: 'announcement',
      action: 'Annonce publiée',
      target: a.title,
      detail: a.scope === 'session' && a.sessionLabel ? a.sessionLabel : 'Toute la formation',
      at: a.publishedAt,
      href: '/e-formation?tab=annonces',
      sort: new Date(a.publishedAt).getTime(),
    });
  }

  return items
    .sort((a, b) => b.sort - a.sort)
    .slice(0, limit)
    .map(({ sort: _s, ...rest }) => rest);
}
