'use client';

import { useQuery } from '@tanstack/react-query';
import { Award, BookOpen, Linkedin, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getInitials, getAvatarUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { servicePoleShortLabel, type OrgChartUser } from './structure-organigramme';
import { StructureEquipeEditor } from './structure-equipe-editor';

type ProfileTab = 'formateur' | 'collaborateur' | 'interne';

type SchoolService = 'TRAINER_POOL' | 'PEDAGOGICAL' | 'HR_ADMIN';

type StaffRow = {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatar?: string | null;
  jobFunction?: string | null;
  qualification?: string | null;
  role?: { slug?: string | null; name?: string | null } | null;
  formateurProfile?: {
    speciality?: string | null;
    specialties?: string[] | null;
    schoolInternalService?: SchoolService | null;
  } | null;
  collaborateurProfile?: {
    qualification?: string | null;
    jobFunction?: string | null;
    schoolInternalService?: SchoolService | null;
  } | null;
};

async function fetchStaffList(profileType: ProfileTab): Promise<StaffRow[]> {
  const params = new URLSearchParams({
    page: '1',
    limit: '120',
    profileType,
  });
  const response = await apiFetch(
    `/api/sections/gestion-ressources/rh/collaborateurs?${params.toString()}`,
  );
  if (!response.ok) return [];
  const json = (await response.json()) as { data?: StaffRow[] };
  return Array.isArray(json?.data) ? json.data : [];
}

function displayName(u: StaffRow): string {
  const parts = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  if (parts) return parts;
  return u.name?.trim() || u.email || '—';
}

function specialtyLine(u: StaffRow, tab: ProfileTab): string {
  if (tab === 'formateur') {
    const fp = u.formateurProfile;
    if (fp?.speciality?.trim()) return fp.speciality.trim();
    const s = fp?.specialties;
    if (Array.isArray(s) && s.length) return s.filter(Boolean).join(' · ');
  }
  const cp = u.collaborateurProfile;
  if (cp?.jobFunction?.trim()) return cp.jobFunction.trim();
  if (cp?.qualification?.trim()) return cp.qualification.trim();
  if (u.jobFunction?.trim()) return u.jobFunction.trim();
  if (u.qualification?.trim()) return u.qualification.trim();
  return tab === 'formateur'
    ? 'Formateur certifié'
    : tab === 'collaborateur'
      ? 'Équipe pédagogique'
      : 'Équipe administrative';
}

function bioLine(u: StaffRow): string {
  const q = u.qualification || u.collaborateurProfile?.qualification;
  if (q?.trim()) return q.trim();
  return 'Professionnel(le) de terrain, engagé(e) dans la qualité des parcours et la conformité réglementaire.';
}

function TeamGrid({
  profileType,
  onRequestAdd,
}: {
  profileType: ProfileTab;
  onRequestAdd?: () => void;
}) {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['structure-equipe', profileType],
    queryFn: () => fetchStaffList(profileType),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden border-border/70">
            <CardContent className="p-6">
              <div className="h-36 animate-pulse rounded-lg bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Users className="size-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            Aucun profil pour cette catégorie pour le moment.
          </p>
          {onRequestAdd ? (
            <Button type="button" variant="outline" size="sm" onClick={onRequestAdd}>
              Ajouter un membre
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((u) => {
        const title = displayName(u);
        const spec = specialtyLine(u, profileType);
        const avatarSrc = u.avatar ? getAvatarUrl(u.avatar) : undefined;
        return (
          <Card
            key={u.id}
            className="group overflow-hidden border border-border/70 shadow-sm transition-shadow hover:shadow-md"
          >
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-start gap-3">
                <Avatar className="size-12 border border-border/60">
                  {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
                  <AvatarFallback className="bg-violet-500/10 text-sm font-bold text-violet-700 dark:text-violet-300">
                    {getInitials(title)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-base font-bold text-foreground">{title}</h3>
                    <Award className="size-4 shrink-0 text-violet-500" aria-hidden />
                  </div>
                  <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">{spec}</p>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit text-[10px] font-bold uppercase tracking-wide">
                {servicePoleShortLabel(u as OrgChartUser)}
              </Badge>
              <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">{bioLine(u)}</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="size-3.5" />
                    Fiche
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" />
                    École
                  </span>
                </div>
                <a
                  href="#"
                  className={cn(
                    'inline-flex size-8 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors',
                    'hover:border-primary/40 hover:text-primary',
                  )}
                  aria-label="LinkedIn (à compléter)"
                  onClick={(e) => e.preventDefault()}
                >
                  <Linkedin className="size-4" />
                </a>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function StructureEffectifsVolet() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
          Effectifs
        </p>
        <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          Pôle et hiérarchie (N+1)
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Modifiez le pôle interne et le responsable direct : les changements sont enregistrés tout de suite. Utilisez
          le bouton <strong className="text-foreground">Ajouter un membre</strong> en haut de page pour créer un
          accès.
        </p>
      </div>
      <StructureEquipeEditor />
    </div>
  );
}

export function StructureAnnuaireMetiersVolet({ onRequestAdd }: { onRequestAdd?: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
          Annuaire
        </p>
        <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">Fiches par métier</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Vue cartes par rôle — même données que le tableau des effectifs.
        </p>
      </div>

      <Tabs defaultValue="formateur" className="w-full">
        <TabsList className="inline-flex h-auto flex-wrap gap-1 rounded-full border border-border/80 bg-muted/40 p-1">
          <TabsTrigger
            value="formateur"
            className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Formateurs
          </TabsTrigger>
          <TabsTrigger
            value="collaborateur"
            className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Équipe pédagogique
          </TabsTrigger>
          <TabsTrigger
            value="interne"
            className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Équipe RH & admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="formateur" className="mt-6">
          <TeamGrid profileType="formateur" onRequestAdd={onRequestAdd} />
        </TabsContent>
        <TabsContent value="collaborateur" className="mt-6">
          <TeamGrid profileType="collaborateur" onRequestAdd={onRequestAdd} />
        </TabsContent>
        <TabsContent value="interne" className="mt-6">
          <TeamGrid profileType="interne" onRequestAdd={onRequestAdd} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
