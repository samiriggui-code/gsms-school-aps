'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GitBranch, LayoutGrid, Network, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getInitials, getAvatarUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type SchoolService = 'TRAINER_POOL' | 'PEDAGOGICAL' | 'HR_ADMIN';

export type OrgChartUser = {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatar?: string | null;
  status?: string | null;
  role?: { slug?: string | null; name?: string | null } | null;
  collaborateurProfile?: {
    schoolInternalService?: SchoolService | null;
    managerUserId?: string | null;
    jobFunction?: string | null;
    qualification?: string | null;
    manager?: {
      id: string;
      name?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  } | null;
  formateurProfile?: {
    schoolInternalService?: SchoolService | null;
    speciality?: string | null;
    specialties?: unknown;
  } | null;
};

const SERVICE_META: Record<
  SchoolService,
  { label: string; short: string; description: string; ring: string }
> = {
  TRAINER_POOL: {
    label: 'Équipe formateurs',
    short: 'Formateurs',
    description: 'Intervention, certifications et terrain.',
    ring: 'ring-violet-500/25',
  },
  PEDAGOGICAL: {
    label: 'Équipe pédagogique',
    short: 'Pédagogie',
    description: 'Parcours, qualité et accompagnement des promotions.',
    ring: 'ring-sky-500/25',
  },
  HR_ADMIN: {
    label: 'RH & administration',
    short: 'RH & admin',
    description: 'RH, conformité, support et pilotage.',
    ring: 'ring-emerald-500/25',
  },
};

function displayName(u: OrgChartUser): string {
  const parts = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  if (parts) return parts;
  return (u.name || '').trim() || u.email || '—';
}

/** Pôle métier affiché (schéma `SchoolInternalService`, avec repli selon le rôle applicatif). */
export function effectiveSchoolService(u: OrgChartUser): SchoolService {
  const slug = u.role?.slug || '';
  const fp = u.formateurProfile;
  const cp = u.collaborateurProfile;
  if (slug === 'formateur') {
    return fp?.schoolInternalService || 'TRAINER_POOL';
  }
  if (cp?.schoolInternalService) return cp.schoolInternalService;
  if (slug === 'collaborateur') return 'PEDAGOGICAL';
  return 'HR_ADMIN';
}

/** Libellé court pour pastille (cartes équipe). */
export function servicePoleShortLabel(u: OrgChartUser): string {
  return SERVICE_META[effectiveSchoolService(u)].short;
}

function computeHierarchy(users: OrgChartUser[]) {
  const ids = new Set(users.map((u) => u.id));
  const incoming = new Set<string>();
  const children = new Map<string, OrgChartUser[]>();

  for (const u of users) {
    const mgrId = u.collaborateurProfile?.managerUserId;
    if (mgrId && ids.has(mgrId)) {
      incoming.add(u.id);
      const list = children.get(mgrId) ?? [];
      list.push(u);
      children.set(mgrId, list);
    }
  }

  const roots = users.filter((u) => !incoming.has(u.id));
  children.forEach((arr) => {
    arr.sort((a: OrgChartUser, b: OrgChartUser) =>
      displayName(a).localeCompare(displayName(b), 'fr'),
    );
  });
  roots.sort((a: OrgChartUser, b: OrgChartUser) =>
    displayName(a).localeCompare(displayName(b), 'fr'),
  );

  return { roots, children };
}

function groupByService(users: OrgChartUser[]) {
  const buckets: Record<SchoolService, OrgChartUser[]> = {
    TRAINER_POOL: [],
    PEDAGOGICAL: [],
    HR_ADMIN: [],
  };
  for (const u of users) {
    buckets[effectiveSchoolService(u)].push(u);
  }
  return buckets;
}

export async function fetchStructureStaff(): Promise<OrgChartUser[]> {
  const params = new URLSearchParams({
    page: '1',
    limit: '200',
    profileType: 'all',
  });
  const response = await apiFetch(
    `/api/sections/gestion-ressources/rh/collaborateurs?${params.toString()}`,
  );
  if (!response.ok) return [];
  const json = (await response.json()) as { data?: OrgChartUser[] };
  return Array.isArray(json?.data) ? json.data : [];
}

export const STRUCTURE_STAFF_QUERY_KEY = ['structure-staff'] as const;

function OrgBranch({
  user,
  childrenMap,
  ancestors,
}: {
  user: OrgChartUser;
  childrenMap: Map<string, OrgChartUser[]>;
  ancestors: Set<string>;
}) {
  if (ancestors.has(user.id)) {
    return (
      <p className="text-xs italic text-amber-600 dark:text-amber-400">
        Référence hiérarchique circulaire — nœud omis.
      </p>
    );
  }
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(user.id);
  const kids = childrenMap.get(user.id) ?? [];
  const title = displayName(user);
  const avatarSrc = user.avatar ? getAvatarUrl(user.avatar) : undefined;
  const service = effectiveSchoolService(user);
  const mgr = user.collaborateurProfile?.manager;
  const mgrName = mgr
    ? [mgr.firstName, mgr.lastName].filter(Boolean).join(' ').trim() || mgr.name?.trim()
    : null;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border border-border/70 bg-card/40 p-3 shadow-sm ring-1 ring-transparent',
          SERVICE_META[service].ring,
        )}
      >
        <Avatar className="size-10 shrink-0 border border-border/60">
          {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
          <AvatarFallback className="bg-muted text-xs font-bold">{getInitials(title)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-foreground">{title}</span>
            {user.role?.name || user.role?.slug ? (
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wide">
                {user.role?.name || user.role?.slug}
              </Badge>
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground/80">{SERVICE_META[service].label}</span>
            {mgrName ? (
              <>
                {' '}
                · N+1 : {mgrName}
              </>
            ) : null}
          </p>
        </div>
      </div>
      {kids.length > 0 ? (
        <div className="ms-2 border-l-2 border-dashed border-border/80 ps-4 md:ms-4 md:ps-5">
          <div className="space-y-3 pt-1">
            {kids.map((child) => (
              <OrgBranch
                key={child.id}
                user={child}
                childrenMap={childrenMap}
                ancestors={nextAncestors}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type StructureOrganigrammeProps = {
  /** Ouvre le flux d’ajout de personne sur la page Structure (sans navigation). */
  onAddMember?: () => void;
};

type StructurePolesEcoleProps = {
  onAddMember?: () => void;
};

/** Regroupement par pôle interne — volet dédié (données = même requête que l’organigramme). */
export function StructurePolesEcole({ onAddMember }: StructurePolesEcoleProps = {}) {
  const { data: users = [], isLoading } = useQuery({
    queryKey: STRUCTURE_STAFF_QUERY_KEY,
    queryFn: fetchStructureStaff,
    staleTime: 1000 * 60 * 2,
  });

  const byService = useMemo(() => groupByService(users), [users]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-48 rounded-xl border border-border/60" />
        <Skeleton className="h-48 rounded-xl border border-border/60" />
        <Skeleton className="h-48 rounded-xl border border-border/60" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <Users className="size-10 text-muted-foreground/50" />
          <p className="max-w-md text-sm text-muted-foreground">
            Ajoutez des personnes, puis renseignez le <strong>pôle interne</strong> dans le volet{' '}
            <strong>Effectifs</strong> : les cartes par pôle se mettront à jour automatiquement.
          </p>
          {onAddMember ? (
            <Button type="button" variant="outline" size="sm" onClick={onAddMember}>
              Ajouter un membre
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10">
          <LayoutGrid className="size-5 text-sky-700 dark:text-sky-300" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground md:text-xl">Pôles de l&apos;école</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Regroupement selon le <strong>pôle interne</strong> choisi dans le volet Effectifs (ou le rôle par défaut).
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(['TRAINER_POOL', 'PEDAGOGICAL', 'HR_ADMIN'] as const).map((key) => {
          const meta = SERVICE_META[key];
          const members = byService[key];
          return (
            <Card
              key={key}
              className={cn(
                'border shadow-none transition-shadow hover:shadow-sm',
                key === 'TRAINER_POOL' && 'border-violet-500/25 bg-violet-500/[0.03]',
                key === 'PEDAGOGICAL' && 'border-sky-500/25 bg-sky-500/[0.03]',
                key === 'HR_ADMIN' && 'border-emerald-500/25 bg-emerald-500/[0.03]',
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">{meta.label}</CardTitle>
                <p className="text-xs text-muted-foreground">{meta.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>Effectif</span>
                  <Badge variant="secondary">{members.length}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {members.slice(0, 12).map((u) => {
                    const t = displayName(u);
                    const src = u.avatar ? getAvatarUrl(u.avatar) : undefined;
                    return (
                      <Avatar key={u.id} className="size-9 border border-border/60" title={t}>
                        {src ? <AvatarImage src={src} alt="" /> : null}
                        <AvatarFallback className="text-[10px] font-bold">{getInitials(t)}</AvatarFallback>
                      </Avatar>
                    );
                  })}
                  {members.length > 12 ? (
                    <div className="flex size-9 items-center justify-center rounded-full border border-dashed border-border bg-muted/40 text-[10px] font-bold text-muted-foreground">
                      +{members.length - 12}
                    </div>
                  ) : null}
                </div>
                {members.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucun profil dans ce pôle.</p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function StructureOrganigramme({ onAddMember }: StructureOrganigrammeProps = {}) {
  const { data: users = [], isLoading } = useQuery({
    queryKey: STRUCTURE_STAFF_QUERY_KEY,
    queryFn: fetchStructureStaff,
    staleTime: 1000 * 60 * 2,
  });

  const { roots, children } = useMemo(() => computeHierarchy(users), [users]);

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-64 rounded-xl border border-border/60" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <Users className="size-10 text-muted-foreground/50" />
          <p className="max-w-md text-sm text-muted-foreground">
            Ajoutez des personnes avec le bouton <strong>Ajouter un membre</strong>, puis définissez le{' '}
            <strong>N+1</strong> dans le volet <strong>Effectifs</strong> : l’arbre hiérarchique se met à jour tout seul.
            Les formateurs n’ont pas de N+1 dans cet écran.
          </p>
          {onAddMember ? (
            <Button type="button" variant="outline" size="sm" onClick={onAddMember}>
              Ajouter un membre
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
          <Network className="size-5 text-primary/80" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground md:text-xl">Organigramme</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Arbre à partir du <strong>N+1</strong> défini dans le volet Effectifs. Les pôles sont dans leur propre
            volet.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-border/70 shadow-none">
        <CardHeader className="border-b border-border/60 bg-muted/20 py-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <GitBranch className="size-4 text-violet-600 dark:text-violet-400" />
            Hiérarchie N+1
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6">
          {roots.length === 0 && users.length > 0 ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
              Aucune racine hiérarchique : chaque personne a un N+1 dans la liste (cycle ou chaîne fermée). Corrigez la
              colonne <strong>N+1</strong> dans le volet Effectifs pour retrouver un organigramme lisible.
            </div>
          ) : null}
          {roots.map((root) => (
            <OrgBranch
              key={root.id}
              user={root}
              childrenMap={children}
              ancestors={new Set()}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
