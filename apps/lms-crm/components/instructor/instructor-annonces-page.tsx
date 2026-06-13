'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { INSTRUCTOR_ANNOUNCEMENTS_API, INSTRUCTOR_SESSIONS_API } from '@/lib/instructor/instructor-paths';
import type { InstructorAnnouncementRow, InstructorSessionRow } from '@/lib/instructor/instructor-types';
import { PortalPageHero } from '@/components/portal/layout/portal-page-hero';
import { PortalPageShell } from '@/components/portal/layout/portal-page-shell';
import { PortalSection } from '@/components/portal/layout/portal-section';
import { portalMuted, portalSectionTitle } from '@/components/portal/layout/portal-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatPortalDate } from '@/lib/portal/format-portal-date';
import { toast } from 'sonner';
import { ModuleKpiStatsRow } from '@/components/common/module-kpi-stats-row';
import { instructorAnnoncesKpis } from '@/lib/instructor/instructor-kpi-stats';

const STATE_LABEL: Record<InstructorAnnouncementRow['state'], string> = {
  draft: 'Brouillon',
  scheduled: 'Planifiée',
  live: 'Publiée',
};

const STATE_VARIANT: Record<
  InstructorAnnouncementRow['state'],
  'secondary' | 'outline' | 'primary'
> = {
  draft: 'secondary',
  scheduled: 'outline',
  live: 'primary',
};

type PublishMode = 'now' | 'draft' | 'schedule';

export function InstructorAnnoncesPage() {
  const qc = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formationId, setFormationId] = useState('');
  const [sessionId, setSessionId] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publishMode, setPublishMode] = useState<PublishMode>('now');
  const [scheduleAt, setScheduleAt] = useState('');

  const announcementsQuery = useQuery({
    queryKey: ['instructor-announcements'],
    queryFn: async () => {
      const res = await apiFetch(INSTRUCTOR_ANNOUNCEMENTS_API);
      const json = (await res.json()) as {
        success?: boolean;
        data?: { items: InstructorAnnouncementRow[] };
      };
      if (!res.ok || !json.success) throw new Error('Chargement impossible');
      return json.data?.items ?? [];
    },
  });

  const sessionsQuery = useQuery({
    queryKey: ['instructor-sessions'],
    queryFn: async () => {
      const res = await apiFetch(INSTRUCTOR_SESSIONS_API);
      const json = (await res.json()) as {
        success?: boolean;
        data?: { items: InstructorSessionRow[] };
      };
      if (!res.ok || !json.success) throw new Error('Sessions indisponibles');
      return json.data?.items ?? [];
    },
  });

  const formations = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const s of sessionsQuery.data ?? []) {
      map.set(s.formation.id, { id: s.formation.id, name: s.formation.name });
    }
    return Array.from(map.values());
  }, [sessionsQuery.data]);

  const sessionsForFormation = useMemo(
    () =>
      (sessionsQuery.data ?? []).filter((s) => !formationId || s.formation.id === formationId),
    [sessionsQuery.data, formationId],
  );

  useEffect(() => {
    if (!formationId && formations[0]) setFormationId(formations[0].id);
  }, [formations, formationId]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const isPublished = publishMode !== 'draft';
      let publishedAt: string | null = null;
      if (publishMode === 'schedule' && scheduleAt) {
        publishedAt = new Date(scheduleAt).toISOString();
      } else if (publishMode === 'now') {
        publishedAt = new Date().toISOString();
      } else {
        publishedAt = new Date().toISOString();
      }

      const res = await apiFetch(INSTRUCTOR_ANNOUNCEMENTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formationId,
          sessionId: sessionId === 'all' ? null : sessionId,
          title,
          content,
          isPublished,
          publishedAt,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Erreur');
    },
    onSuccess: () => {
      toast.success(
        publishMode === 'draft'
          ? 'Brouillon enregistré.'
          : publishMode === 'schedule'
            ? 'Annonce planifiée.'
            : 'Annonce publiée — les stagiaires sont notifiés.',
      );
      void qc.invalidateQueries({ queryKey: ['instructor-announcements'] });
      setSheetOpen(false);
      setTitle('');
      setContent('');
      setPublishMode('now');
      setScheduleAt('');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`${INSTRUCTOR_ANNOUNCEMENTS_API}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: true, publishedAt: new Date().toISOString() }),
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Erreur');
    },
    onSuccess: () => {
      toast.success('Annonce publiée.');
      void qc.invalidateQueries({ queryKey: ['instructor-announcements'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`${INSTRUCTOR_ANNOUNCEMENTS_API}/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Erreur');
    },
    onSuccess: () => {
      toast.success('Annonce supprimée.');
      void qc.invalidateQueries({ queryKey: ['instructor-announcements'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  const items = announcementsQuery.data ?? [];

  return (
    <PortalPageShell width="full">
      <PortalPageHero
        title="Annonces pédagogiques"
        description="Messages visibles dans l’espace stagiaire (e-formation) et notification en haut de page. Ciblez une session ou toute la formation."
        badge="Phase 1b"
        actions={
          <Button size="sm" onClick={() => setSheetOpen(true)} disabled={formations.length === 0}>
            <Plus className="me-2 size-4" />
            Nouvelle annonce
          </Button>
        }
      />

      <div className="mt-6">
        <ModuleKpiStatsRow items={instructorAnnoncesKpis(items)} />
      </div>

      <div className="mt-6 space-y-4">
        <p className={portalMuted}>
          <strong className="font-medium text-foreground">Brouillon</strong> : visible uniquement ici.{' '}
          <strong className="font-medium text-foreground">Planifiée</strong> : publication automatique à
          la date choisie. <strong className="font-medium text-foreground">Publiée</strong> : visible
          stagiaires + notification immédiate.
        </p>

        {announcementsQuery.isLoading ? (
          <p className={portalMuted}>Chargement…</p>
        ) : items.length === 0 ? (
          <PortalSection title="Aucune annonce" icon={Megaphone}>
            <p className={portalMuted}>
              Publiez un message pour informer vos stagiaires (horaires, consignes, documents à apporter…).
            </p>
          </PortalSection>
        ) : (
          <ul className="space-y-3">
            {items.map((ann) => (
              <li
                key={ann.id}
                className="rounded-xl border bg-card p-4 shadow-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={STATE_VARIANT[ann.state]} appearance="light" size="sm">
                        {STATE_LABEL[ann.state]}
                      </Badge>
                      <Badge variant="outline" size="sm" className="text-[10px]">
                        {ann.scope === 'session'
                          ? `Session · ${ann.sessionLabel ?? '—'}`
                          : `Formation · ${ann.formationName}`}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {formatPortalDate(ann.publishedAt)}
                      </span>
                    </div>
                    <h3 className={cn('mt-2', portalSectionTitle)}>{ann.title}</h3>
                    <p className={cn('mt-1 whitespace-pre-line', portalMuted)}>{ann.content}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {ann.state !== 'live' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => publishMutation.mutate(ann.id)}
                        disabled={publishMutation.isPending}
                      >
                        Publier
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(ann.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Nouvelle annonce</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Formation</Label>
              <Select value={formationId} onValueChange={setFormationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {formations.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Portée</Label>
              <Select value={sessionId} onValueChange={setSessionId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toute la formation (toutes mes sessions)</SelectItem>
                  {sessionsForFormation.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      Session · {s.dateDisplayLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-title">Titre</Label>
              <Input
                id="ann-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Consignes pour demain"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-content">Message</Label>
              <Textarea
                id="ann-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Contenu visible par les stagiaires…"
              />
            </div>
            <div className="space-y-2">
              <Label>Publication</Label>
              <Select value={publishMode} onValueChange={(v) => setPublishMode(v as PublishMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Publier maintenant (+ notification)</SelectItem>
                  <SelectItem value="draft">Enregistrer en brouillon</SelectItem>
                  <SelectItem value="schedule">Planifier une date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {publishMode === 'schedule' ? (
              <div className="space-y-2">
                <Label htmlFor="ann-schedule">Date et heure de publication</Label>
                <Input
                  id="ann-schedule"
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                />
              </div>
            ) : null}
          </SheetBody>
          <SheetFooter>
            <Button
              className="w-full"
              disabled={!title.trim() || !content.trim() || !formationId || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PortalPageShell>
  );
}
