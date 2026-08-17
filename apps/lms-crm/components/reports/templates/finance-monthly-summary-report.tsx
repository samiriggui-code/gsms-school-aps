'use client';

import {
  ReportCallout,
  ReportDataTable,
  ReportKpiGrid,
  ReportPageBreak,
  ReportSection,
  ReportStatusPill,
} from '@/components/reports/report-ui-primitives';

export type FinanceMonthlyReportData = {
  summary: string;
  methodology?: string;
  kpis: { label: string; value: string | number; subtitle: string }[];
  overdueRows: {
    reference: string;
    title: string;
    amount: string;
    daysOverdue: number;
    candidate: string;
  }[];
  pipelineTable?: {
    id: string;
    reference: string;
    title: string;
    status: string;
    amount: string;
    lead: string;
    updated: string;
  }[];
};

export function FinanceMonthlySummaryReport({ data }: { data: FinanceMonthlyReportData }) {
  return (
    <div className="space-y-10">
      <ReportCallout title="Synthèse financière mensuelle" tone="info">
        {data.summary}
        {data.methodology ? <p className="mt-2">{data.methodology}</p> : null}
      </ReportCallout>

      <ReportSection title="Indicateurs financiers">
        <ReportKpiGrid items={data.kpis} columns={4} />
      </ReportSection>

      <ReportSection
        title="Tableau des impayés"
        description="Devis avec solde restant dû — base des relances et justificatifs financeurs."
        breakable
      >
        <ReportDataTable
          rows={data.overdueRows.map((r) => ({ ...r, id: r.reference }))}
          columns={[
            { key: 'reference', header: 'Référence', cell: (r) => <span className="font-mono text-[10px]">{r.reference}</span> },
            { key: 'title', header: 'Objet', cell: (r) => r.title },
            { key: 'candidate', header: 'Client / stagiaire', cell: (r) => r.candidate },
            { key: 'amount', header: 'Montant dû', align: 'right', cell: (r) => r.amount },
            {
              key: 'daysOverdue',
              header: 'Retard (j)',
              align: 'center',
              cell: (r) => (
                <ReportStatusPill
                  label={String(r.daysOverdue)}
                  tone={r.daysOverdue >= 15 ? 'alert' : r.daysOverdue >= 7 ? 'review' : 'ok'}
                />
              ),
            },
          ]}
        />
      </ReportSection>

      {data.pipelineTable?.length ? (
        <>
          <ReportPageBreak />
          <ReportSection
            title="Annexe — Pipeline devis"
            description="État commercial du mois (émission, acceptation, facturation)."
            breakable
          >
            <ReportDataTable
              dense
              rows={data.pipelineTable}
              columns={[
                { key: 'reference', header: 'Réf.', cell: (r) => <span className="font-mono text-[10px]">{r.reference}</span> },
                { key: 'title', header: 'Titre', cell: (r) => r.title },
                { key: 'status', header: 'Statut', cell: (r) => r.status },
                { key: 'amount', header: 'Montant TTC', align: 'right', cell: (r) => r.amount },
                { key: 'lead', header: 'Contact', cell: (r) => r.lead },
                { key: 'updated', header: 'MAJ', cell: (r) => r.updated },
              ]}
            />
          </ReportSection>
        </>
      ) : null}
    </div>
  );
}
