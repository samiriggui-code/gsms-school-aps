'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, RefreshCw, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type { LandingTeamOfferApiRow } from '@/lib/catalog-team-serialize';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LandingTeamAddDialog } from './landing-team-add-dialog';
import { LandingTeamEditSheet } from './landing-team-edit-sheet';

export const landingTeamQueryKey = ['landing-team-catalog'] as const;

const VOLET_LABELS: Record<string, string> = {
  direction: 'Direction',
  formateur: 'Formateurs',
  pedagogique: 'Équipe pédagogique',
  rh: 'RH & administration',
};

const STATUS_VARIANT: Record<string, 'success' | 'secondary' | 'outline'> = {
  ACTIVE: 'success',
  DRAFT: 'secondary',
  ARCHIVED: 'outline',
};

async function fetchTeam(): Promise<LandingTeamOfferApiRow[]> {
  const res = await apiFetch('/api/sections/communication-contenu/cms/landing-team');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as { error?: { message?: string } }).error?.message ?? 'Chargement impossible',
    );
  }
  const data = unwrapSectionApiData<{ items: LandingTeamOfferApiRow[] }>(json);
  return data?.items ?? [];
}

export function LandingTeamList() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editMember, setEditMember] = useState<LandingTeamOfferApiRow | null>(null);

  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: landingTeamQueryKey,
    queryFn: fetchTeam,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(
        '/api/sections/communication-contenu/cms/landing-team/sync-from-rh',
        { method: 'POST' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (json as { error?: { message?: string } }).error?.message ?? 'Synchronisation impossible',
        );
      }
      return unwrapSectionApiData<{ published: number }>(json) ?? { published: 0 };
    },
    onSuccess: (result) => {
      toast.success(
        result.published > 0
          ? `${result.published} membre(s) publié(s) sur le landing`
          : 'Aucun membre à publier (vérifiez les équipes RH)',
      );
      void qc.invalidateQueries({ queryKey: landingTeamQueryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiFetch(
        `/api/sections/communication-contenu/cms/landing-team/${encodeURIComponent(userId)}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          (json as { error?: { message?: string } }).error?.message ?? 'Suppression impossible',
        );
      }
    },
    onSuccess: () => {
      toast.success('Membre retiré du catalogue landing');
      void qc.invalidateQueries({ queryKey: landingTeamQueryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grouped = ['direction', 'formateur', 'pedagogique', 'rh'].map((volet) => ({
    volet,
    label: VOLET_LABELS[volet] ?? volet,
    items: data.filter((m) => m.volet === volet),
  }));

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2 mb-4">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={syncMutation.isPending}
          onClick={() => syncMutation.mutate()}
        >
          {syncMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Synchroniser depuis équipes RH
        </Button>
        <Button type="button" className="gap-2" onClick={() => setAddOpen(true)}>
          <UserPlus className="size-4" />
          Ajouter au catalogue équipe
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Impossible de charger le catalogue équipe.{' '}
            <button type="button" className="text-primary underline" onClick={() => void refetch()}>
              Réessayer
            </button>
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground space-y-3">
            <p>
              Aucun membre publié sur le landing. Utilisez{' '}
              <span className="font-medium text-foreground">Synchroniser depuis équipes RH</span> pour
              reprendre les formateurs, l&apos;équipe pédagogique et l&apos;équipe RH déjà constitués dans
              le CRM.
            </p>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={syncMutation.isPending}
              onClick={() => syncMutation.mutate()}
            >
              {syncMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Synchroniser maintenant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <Card key={group.volet}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{group.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun membre pour ce volet.</p>
                ) : (
                  group.items.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <Avatar className="size-10">
                        <AvatarImage src={member.avatarUrl ?? undefined} alt={member.name} />
                        <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{member.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{member.title}</p>
                      </div>
                      <Badge variant={STATUS_VARIANT[member.catalogStatus] ?? 'secondary'}>
                        {member.catalogStatus}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditMember(member)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={removeMutation.isPending}
                          onClick={() => removeMutation.mutate(member.userId)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LandingTeamAddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={() => void qc.invalidateQueries({ queryKey: landingTeamQueryKey })}
      />
      <LandingTeamEditSheet
        member={editMember}
        open={Boolean(editMember)}
        onOpenChange={(open) => {
          if (!open) setEditMember(null);
        }}
        onSaved={() => void qc.invalidateQueries({ queryKey: landingTeamQueryKey })}
      />
    </>
  );
}
