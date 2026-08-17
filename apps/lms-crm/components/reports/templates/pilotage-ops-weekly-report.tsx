'use client';

import {
  ReportCallout,
  ReportDataTable,
  ReportKpiGrid,
  ReportPageBreak,
  ReportKeyValueList,
  ReportSection,
} from '@/components/reports/report-ui-primitives';

export type OpsWeeklyReportData = {
  summary: string;
  methodology?: string;
  kpis: { label: string; value: string | number; subtitle: string }[];
  financeHighlights: { label: string; value: string }[];
  candidaturesTable?: {
    id: string;
    candidate: string;
    formation: string;
    status: string;
    updated: string;
  }[];
  sessionsTable?: {
    id: string;
    formation: string;
    dates: string;
    room: string;
    participants: number;
  }[];
};

export function PilotageOpsWeeklyReport({ data }: { data: OpsWeeklyReportData }) {
  return (
    <div className="space-y-10">
      <ReportCallout title="Synthèse opérationnelle hebdomadaire">{data.summary}</ReportCallout>

      {data.methodology ? (
        <p className="text-xs leading-relaxed text-slate-600">{data.methodology}</p>
      ) : null}

      <ReportSection title="Indicateurs de la semaine">
        <ReportKpiGrid items={data.kpis} columns={4} />
      </ReportSection>

      {data.financeHighlights.length > 0 ? (
        <ReportSection title="Aperçu finance">
          <ReportKeyValueList items={data.financeHighlights} />
        </ReportSection>
      ) : null}

      {data.sessionsTable?.length ? (
        <ReportSection title="Sessions à venir" description="Planning pédagogique sur l'horizon proche.">
          <ReportDataTable
            dense
            rows={data.sessionsTable}
            columns={[
              { key: 'formation', header: 'Formation', cell: (r) => r.formation },
              { key: 'dates', header: 'Dates', cell: (r) => r.dates },
              { key: 'room', header: 'Salle', cell: (r) => r.room },
              { key: 'participants', header: 'Inscrits', align: 'center', cell: (r) => r.participants },
            ]}
          />
        </ReportSection>
      ) : null}

      {data.candidaturesTable?.length ? (
        <>
          <ReportPageBreak />
          <ReportSection title="Pipeline candidatures" description="Dossiers ouverts à suivre." breakable>
            <ReportDataTable
              dense
              rows={data.candidaturesTable}
              columns={[
                { key: 'candidate', header: 'Candidat', cell: (r) => r.candidate },
                { key: 'formation', header: 'Formation', cell: (r) => r.formation },
                { key: 'status', header: 'Statut', cell: (r) => r.status },
                { key: 'updated', header: 'MAJ', cell: (r) => r.updated },
              ]}
            />
          </ReportSection>
        </>
      ) : null}
    </div>
  );
}
