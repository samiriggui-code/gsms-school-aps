'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Award,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Users,
} from 'lucide-react';
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
import { useTranslation } from '@/hooks/useTranslation';
import { DATAGRID_TOOLBAR_ACTIONS } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { Badge } from '@repo/ui/badge';
import { SessionCircuitTriggerButton } from '../../vie-scolaire/sessions/components/session-circuit-trigger-button';
import { SuiviFormationsStats } from './components/suivi-formations-stats';
import { SuiviStagiairesList } from './components/suivi-stagiaires-list';
import { SuiviJournalList } from './components/suivi-journal-list';
import { SuiviDocumentsList } from './components/suivi-documents-list';
import { SuiviSessionExamensTab } from './components/suivi-session-examens-tab';
import { SuiviSessionCertificationsTab } from './components/suivi-session-certifications-tab';
import { SuiviSessionEformationTab } from './components/suivi-session-eformation-tab';
import {
  SuiviSessionContextSheet,
  SuiviSessionContextSheetTrigger,
} from './components/suivi-session-context-sheet';
import {
  SUIVI_SESSION_PHASE_LABELS,
  type SuiviSessionOption,
} from './types/suivi-formations-api';

const MAIN_TABS = [
  'stagiaires',
  'journal',
  'documents',
  'examens',
  'certifications',
  'eformation',
] as const;

type MainTab = (typeof MAIN_TABS)[number];

function isMainTab(value: string | null): value is MainTab {
  return MAIN_TABS.includes(value as MainTab);
}

export default function Page() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { title, description } = usePageToolbarMeta(
    '/gestion-academique/suivi-formations/tableau',
  );

  const tabFromUrl = searchParams.get('tab');
  const [mainTab, setMainTab] = useState<MainTab>(
    isMainTab(tabFromUrl) ? tabFromUrl : 'stagiaires',
  );
  const [sessionId, setSessionId] = useState(searchParams.get('sessionId') ?? '');
  const [contextSheetOpen, setContextSheetOpen] = useState(false);

  useEffect(() => {
    if (isMainTab(tabFromUrl)) setMainTab(tabFromUrl);
  }, [tabFromUrl]);

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

  const syncUrl = (nextTab: MainTab, nextSessionId: string) => {
    const params = new URLSearchParams();
    if (nextTab !== 'stagiaires') params.set('tab', nextTab);
    if (nextSessionId) params.set('sessionId', nextSessionId);
    const qs = params.toString();
    router.replace(
      `/gestion-academique/suivi-formations/tableau${qs ? `?${qs}` : ''}`,
      { scroll: false },
    );
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className={DATAGRID_TOOLBAR_ACTIONS}>
            {selectedSession ? (
              <SessionCircuitTriggerButton
                sessionId={selectedSession.id}
                participantCount={selectedSession.participantCount}
              />
            ) : null}
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <SuiviFormationsStats sessionId={sessionId || null} activeTab={mainTab} variant="row" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('vieScolaire.suivi.trackedSession')}
            </p>
            <Select
              value={sessionId}
              onValueChange={(value) => {
                setSessionId(value);
                syncUrl(mainTab, value);
              }}
              disabled={sessionsLoading || sessions.length === 0}
            >
              <SelectTrigger className="h-11 w-full sm:w-[min(100%,520px)]">
                <SelectValue
                  placeholder={
                    sessionsLoading
                      ? t('vieScolaire.suivi.loadingSessions')
                      : sessions.length === 0
                        ? t('vieScolaire.suivi.noEligibleSession')
                        : t('vieScolaire.suivi.chooseSession')
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
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              <Badge variant="secondary" appearance="outline">
                {SUIVI_SESSION_PHASE_LABELS[selectedSession.phase]}
              </Badge>
              <SuiviSessionContextSheetTrigger
                disabled={!sessionId}
                onClick={() => setContextSheetOpen(true)}
              />
            </div>
          ) : null}
        </div>

        <Tabs
          value={mainTab}
          onValueChange={(v) => {
            const next = v as MainTab;
            setMainTab(next);
            syncUrl(next, sessionId);
          }}
          className="w-full"
        >
          <TabsList className="bg-muted/50 border border-border/50 p-1 flex-wrap h-auto w-full">
            <TabsTrigger
              value="stagiaires"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Users className="size-4" />
              {t('vieScolaire.suivi.tabTrainees')}
            </TabsTrigger>
            <TabsTrigger
              value="journal"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <CalendarDays className="size-4" />
              {t('vieScolaire.suivi.tabJournal')}
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <FileText className="size-4" />
              {t('vieScolaire.suivi.tabDocuments')}
            </TabsTrigger>
            <TabsTrigger
              value="examens"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <ClipboardCheck className="size-4" />
              {t('vieScolaire.suivi.tabExams')}
            </TabsTrigger>
            <TabsTrigger
              value="certifications"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Award className="size-4" />
              {t('vieScolaire.suivi.tabCertifications')}
            </TabsTrigger>
            <TabsTrigger
              value="eformation"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <BookOpenCheck className="size-4" />
              {t('vieScolaire.suivi.tabElearning')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stagiaires" className="mt-4">
            <SuiviStagiairesList sessionId={sessionId || null} />
          </TabsContent>

          <TabsContent value="journal" className="mt-4">
            <SuiviJournalList sessionId={sessionId || null} sessionSummary={selectedSession} />
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <SuiviDocumentsList sessionId={sessionId || null} sessionSummary={selectedSession} />
          </TabsContent>

          <TabsContent value="examens" className="mt-4">
            <SuiviSessionExamensTab sessionId={sessionId || null} />
          </TabsContent>

          <TabsContent value="certifications" className="mt-4">
            <SuiviSessionCertificationsTab sessionId={sessionId || null} />
          </TabsContent>

          <TabsContent value="eformation" className="mt-4">
            <SuiviSessionEformationTab sessionId={sessionId || null} />
          </TabsContent>
        </Tabs>
      </Container>

      <SuiviSessionContextSheet
        open={contextSheetOpen}
        onOpenChange={setContextSheetOpen}
        sessionId={sessionId || null}
        sessionSummary={selectedSession}
      />
    </>
  );
}
