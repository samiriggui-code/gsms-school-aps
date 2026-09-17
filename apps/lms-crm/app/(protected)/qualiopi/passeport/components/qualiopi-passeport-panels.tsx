'use client';

import Link from 'next/link';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import type {
  QualiopiComplianceFinding,
  QualiopiEvaluationResult,
  QualiopiEvaluationStatus,
  QualiopiSessionEvaluatePayload,
} from '@/lib/of/qualiopi-evaluation-types';

function statusVariant(
  status: QualiopiEvaluationStatus,
): 'success' | 'destructive' | 'warning' | 'secondary' {
  switch (status) {
    case 'PASS':
      return 'success';
    case 'FAIL':
      return 'destructive';
    case 'WARNING':
    case 'NOT_VERIFIABLE':
      return 'warning';
    case 'NOT_APPLICABLE':
      return 'secondary';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function statusLabel(status: QualiopiEvaluationStatus): string {
  switch (status) {
    case 'PASS':
      return 'PASS';
    case 'FAIL':
      return 'FAIL';
    case 'WARNING':
      return 'WARNING';
    case 'NOT_APPLICABLE':
      return 'N/A';
    case 'NOT_VERIFIABLE':
      return 'NON VÉRIFIABLE';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

type SummaryProps = {
  summary: QualiopiSessionEvaluatePayload['summary'];
  session: QualiopiSessionEvaluatePayload['session'];
  rulesVersion: string;
  evaluatedAt: string;
};

export function QualiopiPasseportSummary({
  summary,
  session,
  rulesVersion,
  evaluatedAt,
}: SummaryProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border p-4">
        <div className="font-medium">{session.formationName}</div>
        <div className="text-muted-foreground text-sm">
          {session.label ?? session.id} · readiness {session.readinessStatus} ·{' '}
          {session.participantCount} participant(s)
        </div>
        <div className="text-muted-foreground mt-1 text-xs">
          {rulesVersion} · évalué {new Date(evaluatedAt).toLocaleString('fr-FR')}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        {(
          [
            ['PASS', summary.pass],
            ['FAIL', summary.fail],
            ['WARNING', summary.warning],
            ['N/A', summary.notApplicable],
            ['N/V', summary.notVerifiable],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-md border p-3">
            <div className="text-2xl font-semibold tabular-nums">{value}</div>
            <div className="text-muted-foreground text-xs uppercase">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

type EvaluationsProps = {
  evaluations: QualiopiEvaluationResult[];
};

export function QualiopiPasseportEvaluations({ evaluations }: EvaluationsProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 border-b">
          <tr>
            <th className="p-2 font-medium">Code</th>
            <th className="p-2 font-medium">Indicateur</th>
            <th className="p-2 font-medium">Scope</th>
            <th className="p-2 font-medium">Statut</th>
            <th className="p-2 font-medium">Attendu / Observé</th>
          </tr>
        </thead>
        <tbody>
          {evaluations.map((ev) => (
            <tr key={ev.indicatorCode} className="border-b last:border-0 align-top">
              <td className="p-2 font-mono text-xs">{ev.indicatorCode}</td>
              <td className="p-2">
                <div className="font-medium">{ev.label}</div>
                <div className="text-muted-foreground text-xs">{ev.explanation}</div>
              </td>
              <td className="p-2 text-xs">{ev.scope}</td>
              <td className="p-2">
                <Badge variant={statusVariant(ev.status)}>{statusLabel(ev.status)}</Badge>
              </td>
              <td className="p-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Attendu :</span> {ev.expected}
                </div>
                <div>
                  <span className="text-muted-foreground">Observé :</span> {ev.observed}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type FindingsProps = {
  findings: QualiopiComplianceFinding[];
};

export function QualiopiPasseportFindings({ findings }: FindingsProps) {
  if (findings.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucun finding — aucun FAIL / WARNING / NOT_VERIFIABLE sur les règles pilotes.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {findings.map((f) => (
        <li
          key={`${f.indicatorCode}-${f.reasonCode}-${f.entityId ?? 'org'}`}
          className="rounded-md border p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-medium">{f.indicatorCode}</span>
            <Badge variant={statusVariant(f.status)}>{statusLabel(f.status)}</Badge>
            <span className="text-muted-foreground text-xs">{f.reasonCode}</span>
          </div>
          <p className="mt-1 text-sm">{f.explanation}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Attendu : {f.expected} · Observé : {f.observed}
          </p>
          <div className="mt-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={f.actionTarget}>Corriger dans le métier</Link>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
