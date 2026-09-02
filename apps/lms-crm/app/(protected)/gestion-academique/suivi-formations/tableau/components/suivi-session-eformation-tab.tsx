'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDateTime } from '@/lib/helpers';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { Badge } from '@repo/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Alert, AlertDescription } from '@repo/ui/alert';
import { LmsContentReviewPanel } from './eformation';
import { SuiviSessionStagiairesDatagrid } from './suivi-session-stagiaires-datagrid';

type AutomationRunRow = {
  id: string;
  circuitKey: string;
  status: string;
  n8nExecutionId: string | null;
  startedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
};

const AUTOMATION_STATUS_LABELS: Record<string, string> = {
  RUNNING: 'En cours',
  COMPLETED: 'Terminé',
  FAILED: 'Échec',
  CANCELLED: 'Annulé',
};

export function SuiviSessionEformationTab({ sessionId }: { sessionId: string | null }) {
  const { t } = useTranslation();

  const { data: automationRuns } = useQuery({
    queryKey: ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'automation-runs', sessionId],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/automation-runs`,
      );
      if (!res.ok) return [] as AutomationRunRow[];
      const j = await res.json();
      return (j?.data?.items ?? []) as AutomationRunRow[];
    },
    enabled: Boolean(sessionId),
    staleTime: 30_000,
  });

  if (!sessionId) {
    return (
      <Alert variant="secondary" appearance="outline">
        <AlertDescription>{t('vieScolaire.suivi.pickSessionForElearning')}</AlertDescription>
      </Alert>
    );
  }

  const runs = automationRuns ?? [];

  return (
    <div className="space-y-5">
      <Card className="border-border/70 shadow-none">
        <CardHeader className="py-4">
          <CardTitle className="text-base">{t('vieScolaire.suivi.elearningProgressTitle')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('vieScolaire.suivi.elearningProgressDesc')}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <SuiviSessionStagiairesDatagrid
            sessionId={sessionId}
            variant="embedded"
            title={t('vieScolaire.suivi.elearningTraineesTitle')}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader className="py-4">
          <CardTitle className="text-base">{t('vieScolaire.suivi.qualiopiCircuitTitle')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('vieScolaire.suivi.qualiopiCircuitDesc')}</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('vieScolaire.suivi.noAutomationRuns')}</p>
          ) : (
            runs.map((run) => (
              <div
                key={run.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">{run.circuitKey}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(run.startedAt)}
                    {run.n8nExecutionId ? ` · n8n ${run.n8nExecutionId}` : ''}
                  </p>
                </div>
                <Badge variant="secondary" appearance="outline">
                  {AUTOMATION_STATUS_LABELS[run.status] ?? run.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <LmsContentReviewPanel />
    </div>
  );
}
