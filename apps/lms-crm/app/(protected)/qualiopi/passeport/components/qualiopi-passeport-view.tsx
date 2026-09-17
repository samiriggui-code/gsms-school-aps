'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@repo/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { useQualiopiPasseport } from '../hooks/use-qualiopi-passeport';
import {
  QualiopiPasseportEvaluations,
  QualiopiPasseportFindings,
  QualiopiPasseportSummary,
} from './qualiopi-passeport-panels';

/** Orchestrateur Passeport Qualiopi Session — stress test read-only. */
export function QualiopiPasseportView() {
  const {
    sessionId,
    setSessionId,
    sessions,
    sessionsLoading,
    sessionsError,
    evaluation,
    evaluateLoading,
    evaluateError,
    evaluateErrorMessage,
    runStressTest,
  } = useQualiopiPasseport();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <label className="text-sm font-medium" htmlFor="qualiopi-passeport-session">
            Session
          </label>
          {sessionsLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Chargement des sessions…
            </div>
          ) : sessionsError ? (
            <p className="text-destructive text-sm">Impossible de charger les sessions.</p>
          ) : (
            <Select value={sessionId || undefined} onValueChange={setSessionId}>
              <SelectTrigger id="qualiopi-passeport-session" className="w-full">
                <SelectValue placeholder="Choisir une session…" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.formationName}
                    {s.label ? ` — ${s.label}` : ''} ({s.participantCount} part.)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button
          type="button"
          disabled={!sessionId || evaluateLoading}
          onClick={() => runStressTest()}
        >
          {evaluateLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Stress test…
            </>
          ) : (
            'Lancer le stress test'
          )}
        </Button>
      </div>

      <p className="text-muted-foreground text-xs">
        Read-only — n’écrit rien en base. Règles pilotes Q1 (6 indicateurs). CODE CALCULE ;
        EVE n’intervient pas.
      </p>

      {evaluateError ? (
        <div className="border-destructive/40 bg-destructive/5 rounded-md border p-4 text-sm">
          {evaluateErrorMessage === 'SESSION_NOT_FOUND'
            ? 'Session introuvable.'
            : 'Évaluation impossible. Réessayez.'}
        </div>
      ) : null}

      {evaluation ? (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide uppercase">État Qualiopi</h2>
            <QualiopiPasseportSummary
              summary={evaluation.summary}
              session={evaluation.session}
              rulesVersion={evaluation.rulesVersion}
              evaluatedAt={evaluation.evaluatedAt}
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              Indicateurs applicables (pilotes)
            </h2>
            <QualiopiPasseportEvaluations evaluations={evaluation.evaluations} />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide uppercase">Findings → Corriger</h2>
            <QualiopiPasseportFindings findings={evaluation.findings} />
          </section>

          <p className="text-muted-foreground text-[10px]">{evaluation.disclaimer}</p>
        </div>
      ) : null}
    </div>
  );
}
