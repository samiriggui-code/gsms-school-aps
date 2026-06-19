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
  const dateLabel = team.formationSession?.dateDisplayLabel?.trim();
  if (dateLabel) return `Session ${dateLabel}`;
  return team.description?.trim() || 'Équipe pédagogique de session';
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
  leader?: { avatar?: string | null } | null;
}): string | undefined {
  if (team.image) {
    const src = teamIllustrationSrc(team.image);
    return src || undefined;
  }
  if (team.leader?.avatar) return getAvatarUrl(team.leader.avatar);
  return undefined;
}
