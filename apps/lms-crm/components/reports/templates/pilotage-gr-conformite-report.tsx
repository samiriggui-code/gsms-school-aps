'use client';

import {
  ReportCallout,
  ReportDataTable,
  ReportKpiGrid,
  ReportPageBreak,
  ReportSection,
  ReportStatusPill,
} from '@/components/reports/report-ui-primitives';

export type GrConformiteReportData = {
  kpis: { label: string; value: string | number; subtitle: string }[];
  criticalRows: {
    name: string;
    email: string;
    function: string;
    carteProExpiry: string;
    permitExpiry: string;
  }[];
  soonRows: {
    name: string;
    email: string;
    carteProExpiry: string;
    permitExpiry: string;
  }[];
};

export function PilotageGrConformiteReport({ data }: { data: GrConformiteReportData }) {
  return (
    <div className="space-y-10">
      <ReportCallout title="Registre de conformité RH" tone="warning">
        Document destiné aux audits internes, contrôles URSSAF/CNAPS et dossiers financeurs exigeant la
        traçabilité des habilitations du personnel formateur et encadrant.
      </ReportCallout>

      <ReportSection title="Synthèse des échéances">
        <ReportKpiGrid items={data.kpis} columns={4} />
      </ReportSection>

      <ReportSection
        title="Registre critique — échéances &lt; 7 jours"
        description="Collaborateurs nécessitant une action immédiate."
        breakable
      >
        <ReportDataTable
          rows={data.criticalRows.map((r, i) => ({ ...r, id: String(i) }))}
          emptyLabel="Aucune échéance critique — parc conforme sur ce seuil."
          columns={[
            { key: 'name', header: 'Collaborateur', cell: (r) => r.name },
            { key: 'function', header: 'Fonction', cell: (r) => r.function },
            { key: 'carteProExpiry', header: 'Carte pro', cell: (r) => r.carteProExpiry },
            { key: 'permitExpiry', header: 'Titre séjour', cell: (r) => r.permitExpiry },
            {
              key: 'status',
              header: 'Priorité',
              cell: () => <ReportStatusPill label="Critique" tone="alert" />,
            },
          ]}
        />
      </ReportSection>

      {data.soonRows.length > 0 ? (
        <>
          <ReportPageBreak />
          <ReportSection
            title="Échéances à 30 jours"
            description="Planifier les renouvellements avant blocage affectation session."
            breakable
          >
            <ReportDataTable
              rows={data.soonRows.map((r, i) => ({ ...r, id: String(i) }))}
              columns={[
                { key: 'name', header: 'Collaborateur', cell: (r) => r.name },
                { key: 'carteProExpiry', header: 'Carte pro', cell: (r) => r.carteProExpiry },
                { key: 'permitExpiry', header: 'Titre séjour', cell: (r) => r.permitExpiry },
                {
                  key: 'status',
                  header: 'Priorité',
                  cell: () => <ReportStatusPill label="À planifier" tone="review" />,
                },
              ]}
            />
          </ReportSection>
        </>
      ) : null}
    </div>
  );
}
