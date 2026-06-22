'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, FileText, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { DATAGRID_TOOLBAR_ACTIONS } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SuiviFormationsStats } from './components/suivi-formations-stats';
import { SuiviStagiairesList } from './components/suivi-stagiaires-list';
import { SuiviJournalList } from './components/suivi-journal-list';
import { SuiviDocumentsList } from './components/suivi-documents-list';
import {
  SUIVI_SESSION_PHASE_LABELS,
  type SuiviSessionOption,
} from './types/suivi-formations-api';

export default function Page() {
  const { title, description } = usePageToolbarMeta(
    '/gestion-academique/vie-scolaire/suivi-formations',
  );
  const [mainTab, setMainTab] = useState<'stagiaires' | 'journal' | 'documents'>('stagiaires');
  const [sessionId, setSessionId] = useState('');

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'sessions'],
    queryFn: async () => {
      const res = await apiFetch(
        '/api/sections/gestion-academique/vie-scolaire/suivi-formations/sessions',
      );
      if (!res.ok) throw new Error('Sessions indisponibles.');
      const j = await res.json();
      if (!j?.success || !j?.data?.items) throw new Error('Réponse sessions invalide.');
      return j.data.items as SuiviSessionOption[];
    },
    staleTime: 60_000,
  });

  const sessions = sessionsData ?? [];

  useEffect(() => {
    if (sessionId || sessions.length === 0) return;
    const preferred =
      sessions.find((s) => s.phase === 'running') ??
      sessions.find((s) => s.phase === 'upcoming') ??
      sessions[0];
    if (preferred) setSessionId(preferred.id);
  }, [sessions, sessionId]);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === sessionId) ?? null,
    [sessions, sessionId],
  );

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className={DATAGRID_TOOLBAR_ACTIONS} />
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <SuiviFormationsStats sessionId={sessionId || null} variant="row" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Session suivie
            </p>
            <Select
              value={sessionId}
              onValueChange={setSessionId}
              disabled={sessionsLoading || sessions.length === 0}
            >
              <SelectTrigger className="h-11 w-full sm:w-[min(100%,520px)]">
                <SelectValue
                  placeholder={
                    sessionsLoading
                      ? 'Chargement des sessions…'
                      : sessions.length === 0
                        ? 'Aucune session éligible'
                        : 'Choisir une session'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex flex-col items-start gap-0.5">
                      <span>
                        {s.formation.name} — {s.dateDisplayLabel}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {SUIVI_SESSION_PHASE_LABELS[s.phase]} · {s.participantCount} stagiaire
                        {s.participantCount > 1 ? 's' : ''}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSession ? (
            <Badge variant="secondary" appearance="outline" className="self-start sm:self-center">
              {SUIVI_SESSION_PHASE_LABELS[selectedSession.phase]}
            </Badge>
          ) : null}
        </div>

        <Tabs
          value={mainTab}
          onValueChange={(v) => setMainTab(v as 'stagiaires' | 'journal' | 'documents')}
          className="w-full"
        >
          <TabsList className="bg-muted/50 border border-border/50 p-1 flex-wrap h-auto w-full sm:w-auto">
            <TabsTrigger
              value="stagiaires"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Users className="size-4" />
              Stagiaires
            </TabsTrigger>
            <TabsTrigger
              value="journal"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <CalendarDays className="size-4" />
              Journal quotidien
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <FileText className="size-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stagiaires" className="mt-4">
            <SuiviStagiairesList sessionId={sessionId || null} />
          </TabsContent>

          <TabsContent value="journal" className="mt-4">
            <SuiviJournalList sessionId={sessionId || null} />
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <SuiviDocumentsList sessionId={sessionId || null} />
          </TabsContent>
        </Tabs>
      </Container>
    </>
  );
}
