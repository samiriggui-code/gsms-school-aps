import type { PrismaClient } from '@repo/database';
import type { GovernanceTreeNode } from './storage-governance-tree';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const USER_FOLDER_SEGMENTS = new Set([
  'collaborateurs',
  'candidats',
  'formateurs',
  'collaborateur',
  'candidat',
  'formateur',
  'mon-dossier',
]);

export type StorageEntityLabel = {
  displayLabel: string;
  entityId: string;
  entityKind: string;
};

type ParsedFolder = {
  prefix: string;
  entityId: string;
  entityKind: string;
};

function formatUserName(user: {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
}): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (user.name?.trim()) return user.name.trim();
  return user.email.split('@')[0] ?? user.email;
}

function folderKindFromSegment(segment: string, userCategory?: string): string {
  if (segment === 'candidats' || segment === 'candidat') return 'candidat';
  if (segment === 'formateurs' || segment === 'formateur') return 'formateur';
  if (segment === 'collaborateurs' || segment === 'collaborateur') return 'collaborateur';
  if (segment === 'mon-dossier') return 'stagiaire';
  if (userCategory === 'CLIENT') return 'candidat';
  if (userCategory === 'SUBCONTRACTOR') return 'formateur';
  return 'utilisateur';
}

function parseEntityFolders(prefixes: string[]): ParsedFolder[] {
  const parsed: ParsedFolder[] = [];

  for (const prefix of prefixes) {
    const parts = prefix.split('/').filter(Boolean);
    if (parts.length < 2) continue;

    const last = parts[parts.length - 1]!;
    if (!UUID_RE.test(last)) continue;

    const parent = parts[parts.length - 2]!;

    if (parent === 'equipes') {
      parsed.push({ prefix, entityId: last, entityKind: 'equipe' });
      continue;
    }

    if (parent === 'sessions') {
      parsed.push({ prefix, entityId: last, entityKind: 'session' });
      continue;
    }

    if (parts[0] === 'utilisateurs' && parts.length === 2) {
      parsed.push({ prefix, entityId: last, entityKind: 'utilisateur' });
      continue;
    }

    if (USER_FOLDER_SEGMENTS.has(parent)) {
      parsed.push({
        prefix,
        entityId: last,
        entityKind: folderKindFromSegment(parent),
      });
    }
  }

  return parsed;
}

/** Résout les UUID de dossiers → libellés nominatifs (users, équipes, sessions). */
export async function resolveStorageTreeLabels(
  prisma: PrismaClient,
  prefixes: string[],
): Promise<Map<string, StorageEntityLabel>> {
  const parsed = parseEntityFolders(prefixes);
  const userIds = new Set<string>();
  const teamIds = new Set<string>();
  const sessionIds = new Set<string>();

  for (const item of parsed) {
    if (item.entityKind === 'equipe') teamIds.add(item.entityId);
    else if (item.entityKind === 'session') sessionIds.add(item.entityId);
    else userIds.add(item.entityId);
  }

  const [users, teams, sessions] = await Promise.all([
    userIds.size
      ? prisma.user.findMany({
          where: { id: { in: [...userIds] } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true,
            userCategory: true,
          },
        })
      : [],
    teamIds.size
      ? prisma.rhTeam.findMany({
          where: { id: { in: [...teamIds] } },
          select: { id: true, name: true },
        })
      : [],
    sessionIds.size
      ? prisma.formationSession.findMany({
          where: { id: { in: [...sessionIds] } },
          select: {
            id: true,
            dateDisplayLabel: true,
            location: true,
            formation: { select: { name: true } },
          },
        })
      : [],
  ]);

  const userById = new Map(users.map((u) => [u.id, u]));
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const sessionById = new Map(sessions.map((s) => [s.id, s]));

  const labels = new Map<string, StorageEntityLabel>();

  for (const item of parsed) {
    if (item.entityKind === 'equipe') {
      const team = teamById.get(item.entityId);
      if (team) {
        labels.set(item.prefix, {
          displayLabel: team.name,
          entityId: item.entityId,
          entityKind: 'equipe',
        });
      }
      continue;
    }

    if (item.entityKind === 'session') {
      const session = sessionById.get(item.entityId);
      if (session) {
        const formationName = session.formation?.name?.trim();
        const when = session.dateDisplayLabel?.trim() || session.location?.trim();
        const displayLabel = formationName
          ? when
            ? `${formationName} — ${when}`
            : formationName
          : when || 'Session formation';
        labels.set(item.prefix, {
          displayLabel,
          entityId: item.entityId,
          entityKind: 'session',
        });
      }
      continue;
    }

    const user = userById.get(item.entityId);
    if (user) {
      labels.set(item.prefix, {
        displayLabel: formatUserName(user),
        entityId: item.entityId,
        entityKind: folderKindFromSegment(item.entityKind, user.userCategory),
      });
    }
  }

  return labels;
}

export function applyStorageTreeLabels(
  nodes: GovernanceTreeNode[],
  labels: Map<string, StorageEntityLabel>,
): GovernanceTreeNode[] {
  return nodes.map((node) => {
    const meta = labels.get(node.prefix);
    if (!meta) return node;
    return {
      ...node,
      label: meta.displayLabel,
      displayLabel: meta.displayLabel,
      entityId: meta.entityId,
      entityKind: meta.entityKind,
    };
  });
}

export async function resolveEntityDisplayNames(
  prisma: PrismaClient,
  entityIds: string[],
): Promise<Map<string, string>> {
  const ids = [...new Set(entityIds.filter((id) => UUID_RE.test(id)))];
  if (ids.length === 0) return new Map();

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, firstName: true, lastName: true, name: true, email: true },
  });

  return new Map(users.map((u) => [u.id, formatUserName(u)]));
}

/** Étend la recherche fichier avec les entityId dont le nom correspond. */
export async function resolveUserIdsByNameSearch(
  prisma: PrismaClient,
  term: string,
): Promise<string[]> {
  const q = term.trim();
  if (!q) return [];

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true },
    take: 20,
  });

  return users.map((u) => u.id);
}
