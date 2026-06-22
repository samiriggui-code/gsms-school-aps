import { GraduationCap, Users, Briefcase, ShieldCheck, Building2, Store, Globe } from 'lucide-react';
import { getAvatarUrl } from '@/lib/helpers';
import {
  LEGACY_TEAM_SECTOR_LABELS,
  LEGACY_TEAM_TYPE_LABELS,
  TEAM_SECTORS,
  TEAM_TYPES,
} from '../constants';

const FALLBACK_TYPE = {
  id: 'PEDAGOGICAL',
  label: 'Pôle pédagogique',
  icon: GraduationCap,
  color: 'text-primary',
  bg: 'bg-primary/10',
};

const FALLBACK_SECTOR = {
  id: 'HEADQUARTERS',
  label: 'Siège / direction',
  icon: Building2,
};

export function resolveTeamTypeMeta(type?: string | null) {
  const key = String(type || '').toUpperCase();
  const found = TEAM_TYPES.find((t) => t.id === key);
  if (found) return found;
  if (LEGACY_TEAM_TYPE_LABELS[key]) {
    return { ...FALLBACK_TYPE, id: key, label: LEGACY_TEAM_TYPE_LABELS[key] };
  }
  return FALLBACK_TYPE;
}

export function resolveTeamSectorMeta(sector?: string | null) {
  const key = String(sector || '').toUpperCase();
  const found = TEAM_SECTORS.find((s) => s.id === key);
  if (found) return found;
  if (LEGACY_TEAM_SECTOR_LABELS[key]) {
    return { ...FALLBACK_SECTOR, id: key, label: LEGACY_TEAM_SECTOR_LABELS[key] };
  }
  return FALLBACK_SECTOR;
}

export function resolveTeamLeader(team: {
  leader?: {
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
  } | null;
  leaderId?: string | null;
  members?: Array<{
    tenantUserId?: string;
    TenantUser?: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      avatar?: string | null;
    } | null;
  }>;
}) {
  if (team.leader) return team.leader;
  if (!team.leaderId || !team.members?.length) return null;
  const member = team.members.find((m) => m.tenantUserId === team.leaderId);
  if (!member?.TenantUser) return null;
  const u = member.TenantUser;
  return {
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    avatar: u.avatar,
    name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email || '',
  };
}

export function teamLeaderLabel(leader: ReturnType<typeof resolveTeamLeader>): string {
  if (!leader) return '';
  return (
    [leader.firstName, leader.lastName].filter(Boolean).join(' ').trim() ||
    leader.name?.trim() ||
    leader.email ||
    ''
  );
}

export type SessionTeamMemberRole = 'TRAINER' | 'MODERATOR' | 'LEARNER';

export const SESSION_TEAM_ROLE_LABELS: Record<SessionTeamMemberRole, string> = {
  TRAINER: 'Formateur',
  MODERATOR: 'Référent pédagogique',
  LEARNER: 'Apprenant inscrit',
};

export function isSessionPedagogicalTeam(team: {
  isSessionTeam?: boolean;
  formationSessionId?: string | null;
}): boolean {
  return Boolean(team.isSessionTeam || team.formationSessionId);
}

export function sessionTeamSubtitle(team: {
  description?: string | null;
  formationSession?: { dateDisplayLabel?: string | null; formation?: { name?: string } | null } | null;
}): string {
  const formation = team.formationSession?.formation?.name?.trim();
  const dateLabel = team.formationSession?.dateDisplayLabel?.trim();
  if (formation && dateLabel) return `${formation} · ${dateLabel}`;
  if (dateLabel) return `Session ${dateLabel}`;
  if (formation) return formation;
  return team.description?.trim() || 'Équipe pédagogique de session';
}

export type TeamLifecycleStatusKey = 'ACTIVE' | 'POST_EXAM' | 'ARCHIVED';

export const TEAM_LIFECYCLE_META: Record<
  TeamLifecycleStatusKey,
  { label: string; shortLabel: string; className: string }
> = {
  ACTIVE: {
    label: 'Session en cours',
    shortLabel: 'En cours',
    className:
      'text-emerald-700 border-emerald-500/30 bg-emerald-500/10 dark:text-emerald-400',
  },
  POST_EXAM: {
    label: 'Post-examen',
    shortLabel: 'Post-examen',
    className: 'text-amber-700 border-amber-500/30 bg-amber-500/10 dark:text-amber-400',
  },
  ARCHIVED: {
    label: 'Session clôturée',
    shortLabel: 'Clôturée',
    className: 'text-muted-foreground border-border bg-muted/40',
  },
};

export function resolveTeamLifecycleMeta(status?: string | null) {
  const key = String(status || 'ACTIVE').toUpperCase() as TeamLifecycleStatusKey;
  return TEAM_LIFECYCLE_META[key] ?? TEAM_LIFECYCLE_META.ACTIVE;
}

export function isPermanentSchoolTeam(team: {
  isSessionTeam?: boolean;
  formationSessionId?: string | null;
}): boolean {
  return !isSessionPedagogicalTeam(team);
}

export function permanentTeamKindLabel(type?: string | null): string {
  return resolveTeamTypeMeta(type).label;
}

export function countSessionTeamMembersByRole(team: {
  members?: Array<{ tenantUserId?: string; sessionRole?: SessionTeamMemberRole | null }>;
}): { trainers: number; moderators: number; learners: number; total: number } {
  const grouped = groupSessionTeamMembers(team as Parameters<typeof groupSessionTeamMembers>[0]);
  return {
    trainers: grouped.TRAINER?.length ?? 0,
    moderators: grouped.MODERATOR?.length ?? 0,
    learners: grouped.LEARNER?.length ?? 0,
    total: team.members?.length ?? 0,
  };
}

export function groupSessionTeamMembers(team: {
  members?: Array<{ tenantUserId: string; sessionRole?: SessionTeamMemberRole | null }>;
}): Record<SessionTeamMemberRole, typeof team.members> {
  const empty = { TRAINER: [], MODERATOR: [], LEARNER: [] } as Record<
    SessionTeamMemberRole,
    NonNullable<typeof team.members>
  >;
  if (!team.members?.length) return empty;
  for (const member of team.members) {
    const role = member.sessionRole ?? 'LEARNER';
    empty[role].push(member);
  }
  return empty;
}

/** Chemins réservés à la marque — ne pas utiliser comme visuel d'équipe. */
const TEAM_BRAND_IMAGE_PREFIXES = ['/brand/'];

export function isTeamBrandImage(image?: string | null): boolean {
  const raw = String(image ?? '').trim();
  if (!raw) return false;
  return TEAM_BRAND_IMAGE_PREFIXES.some((prefix) => raw.startsWith(prefix));
}

/** Libellé du site client lié à l'équipe (`RhTeam.siteId` → `ClientSite`). */
export function resolveTeamSiteLabel(team: {
  siteId?: string | null;
  Site?: { name?: string } | null;
  sector?: string | null;
  type?: string | null;
}): string {
  if (team.Site?.name?.trim()) return team.Site.name.trim();
  if (team.sector === 'HEADQUARTERS' || String(team.type ?? '').toUpperCase() === 'DIRECTION') {
    return 'Siège — pas de site client';
  }
  return 'Non affecté';
}

/** Chemin public de la photo d'équipe. */
export function teamIllustrationSrc(filename: string): string {
  const raw = filename.trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/')) return raw;

  let leaf = raw.includes('/') ? raw.split('/').pop()! : raw;
  if (/^\d+\.svg$/i.test(leaf)) {
    leaf = leaf.replace(/\.svg$/i, '.jpg');
  }
  // Legacy picker Metronic (fichiers souvent absents du repo)
  return `/media/images/600x600/${leaf}`;
}

export function orgUnitVisualSrc(
  unit: {
    Teams?: Array<{ image?: string | null; leader?: { avatar?: string | null } | null }>;
    Memberships?: Array<{ TenantUser?: { avatar?: string | null } }>;
    parentId?: string | null;
    id?: string;
  },
  allUnits?: Array<{
    id: string;
    parentId: string | null;
    Teams?: Array<{ image?: string | null; leader?: { avatar?: string | null } | null }>;
    Memberships?: Array<{ TenantUser?: { avatar?: string | null } }>;
  }>,
): string | undefined {
  for (const team of unit.Teams ?? []) {
    const src = teamVisualSrc(team);
    if (src) return src;
  }

  const manager = unit.Memberships?.[0]?.TenantUser;
  if (manager?.avatar) return getAvatarUrl(manager.avatar);

  if (unit.id && allUnits?.length) {
    const children = allUnits.filter((row) => row.parentId === unit.id);
    for (const child of children) {
      const childSrc = orgUnitVisualSrc(child, allUnits);
      if (childSrc) return childSrc;
    }
  }

  return undefined;
}

/** Visuel équipe : illustration choisie, sinon avatar du chef d'équipe. */
export function teamVisualSrc(team: {
  image?: string | null;
  type?: string | null;
  leader?: { avatar?: string | null } | null;
}): string | undefined {
  if (team.image && !isTeamBrandImage(team.image)) {
    const src = teamIllustrationSrc(team.image);
    return src || undefined;
  }
  if (String(team.type ?? '').toUpperCase() === 'DIRECTION') {
    return undefined;
  }
  if (team.leader?.avatar) return getAvatarUrl(team.leader.avatar);
  return undefined;
}
