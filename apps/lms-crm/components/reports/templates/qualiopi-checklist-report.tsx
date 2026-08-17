'use client';

import {
  ReportCallout,
  ReportDataTable,
  ReportKpiGrid,
  ReportPageBreak,
  ReportSection,
  ReportStatusPill,
} from '@/components/reports/report-ui-primitives';

const STATUS_LABEL: Record<string, string> = {
  ok: 'Conforme',
  review: 'À revoir',
  alert: 'Alerte',
};

const STATUS_TONE: Record<string, 'ok' | 'review' | 'alert'> = {
  ok: 'ok',
  review: 'review',
  alert: 'alert',
};

export type QualiopiChecklistReportData = {
  quarter: number;
  year: number;
  summary: string;
  methodology?: string;
  indicators: { id: number; label: string; status: string; detail: string }[];
  rnmCriteria?: {
    id: number;
    title: string;
    indicators: string;
    objectif: string;
  }[];
  formationsTable?: {
    id: string;
    name: string;
    duration: string;
    qualiopi: string;
    cpf: string;
    satisfaction: string;
  }[];
  sessionsTable?: {
    id: string;
    formation: string;
    period: string;
    trainer: string;
    participants: number;
  }[];
  trainersTable?: {
    id: string;
    name: string;
    qualification: string;
    cartePro: string;
    status: string;
  }[];
  candidaturesTable?: {
    id: string;
    candidate: string;
    formation: string;
    status: string;
    updated: string;
  }[];
  satisfactionTable?: {
    id: string;
    formation: string;
    satisfaction: string;
    success: string;
  }[];
};

export function QualiopiChecklistReport({ data }: { data: QualiopiChecklistReportData }) {
  const alertCount = data.indicators.filter((i) => i.status === 'alert').length;
  const reviewCount = data.indicators.filter((i) => i.status === 'review').length;

  return (
    <div className="space-y-10">
      <ReportCallout title={`Revue Qualiopi — T${data.quarter} ${data.year}`} tone="info">
        {data.summary}
        {data.methodology ? <p className="mt-2">{data.methodology}</p> : null}
      </ReportCallout>

      <ReportSection
        title="Synthèse exécutive"
        description="Positionnement global sur la période de revue (RNQ — 7 critères, 32 indicateurs)."
      >
        <ReportKpiGrid
          columns={3}
          items={[
            { label: 'Indicateurs suivis', value: data.indicators.length, subtitle: 'Checklist CRM' },
            { label: 'À revoir', value: reviewCount, subtitle: 'Action planifiée' },
            { label: 'Alertes', value: alertCount, subtitle: 'Priorité haute' },
          ]}
        />
      </ReportSection>

      {data.rnmCriteria?.length ? (
        <ReportSection
          title="Référentiel national qualité (RNQ)"
          description="Les 7 critères Qualiopi et leur objet — base de l’audit de certification."
          breakable
        >
          <ReportDataTable
            rows={data.rnmCriteria}
            columns={[
              { key: 'id', header: 'Critère', align: 'center', cell: (r) => r.id },
              { key: 'title', header: 'Intitulé', cell: (r) => r.title },
              { key: 'indicators', header: 'Indicateurs', cell: (r) => r.indicators },
              { key: 'objectif', header: 'Objectif', cell: (r) => r.objectif },
            ]}
          />
        </ReportSection>
      ) : null}

      <ReportSection
        title="Tableau de bord — indicateurs opérationnels"
        description="Correspondance simplifiée avec les preuves disponibles dans le CRM."
        breakable
      >
        <ReportDataTable
          rows={data.indicators}
          columns={[
            { key: 'id', header: 'N°', align: 'center', cell: (r) => r.id },
            { key: 'label', header: 'Indicateur', cell: (r) => r.label },
            { key: 'detail', header: 'Preuve / métrique', cell: (r) => r.detail },
            {
              key: 'status',
              header: 'Statut',
              cell: (r) => (
                <ReportStatusPill
                  label={STATUS_LABEL[r.status] ?? r.status}
                  tone={STATUS_TONE[r.status] ?? 'review'}
                />
              ),
            },
          ]}
        />
      </ReportSection>

      <ReportPageBreak />

      {data.formationsTable?.length ? (
        <ReportSection
          title="Annexe 1 — Offre de formation (critère 1)"
          description="Catalogue actif : transparence, éligibilités et satisfaction."
          breakable
        >
          <ReportDataTable
            dense
            rows={data.formationsTable}
            columns={[
              { key: 'name', header: 'Formation', cell: (r) => r.name },
              { key: 'duration', header: 'Durée', cell: (r) => r.duration },
              { key: 'qualiopi', header: 'Qualiopi', align: 'center', cell: (r) => r.qualiopi },
              { key: 'cpf', header: 'CPF', align: 'center', cell: (r) => r.cpf },
              { key: 'satisfaction', header: 'Satisfaction', align: 'right', cell: (r) => r.satisfaction },
            ]}
          />
        </ReportSection>
      ) : null}

      {data.trainersTable?.length ? (
        <ReportSection
          title="Annexe 2 — Formateurs (critère 5)"
          description="Qualification et validité des habilitations."
          breakable
        >
          <ReportDataTable
            dense
            rows={data.trainersTable}
            columns={[
              { key: 'name', header: 'Formateur', cell: (r) => r.name },
              { key: 'qualification', header: 'Qualification', cell: (r) => r.qualification },
              { key: 'cartePro', header: 'Échéance carte pro', cell: (r) => r.cartePro },
              {
                key: 'status',
                header: 'Statut',
                cell: (r) => (
                  <ReportStatusPill
                    label={r.status}
                    tone={r.status === 'Valide' ? 'ok' : 'review'}
                  />
                ),
              },
            ]}
          />
        </ReportSection>
      ) : null}

      {data.sessionsTable?.length ? (
        <ReportSection
          title="Annexe 3 — Sessions et déroulement (critère 6)"
          description="Inscriptions, formateurs référents et effectifs."
          breakable
        >
          <ReportDataTable
            dense
            rows={data.sessionsTable}
            columns={[
              { key: 'formation', header: 'Formation', cell: (r) => r.formation },
              { key: 'period', header: 'Période', cell: (r) => r.period },
              { key: 'trainer', header: 'Formateur', cell: (r) => r.trainer },
              { key: 'participants', header: 'Inscrits', align: 'center', cell: (r) => r.participants },
            ]}
          />
        </ReportSection>
      ) : null}

      {data.satisfactionTable?.length ? (
        <ReportSection
          title="Annexe 4 — Résultats et satisfaction (critère 7)"
          description="Indicateurs de satisfaction et réussite déclarés."
        >
          <ReportDataTable
            dense
            rows={data.satisfactionTable}
            columns={[
              { key: 'formation', header: 'Formation', cell: (r) => r.formation },
              { key: 'satisfaction', header: 'Satisfaction', align: 'right', cell: (r) => r.satisfaction },
              { key: 'success', header: 'Réussite', align: 'right', cell: (r) => r.success },
            ]}
          />
        </ReportSection>
      ) : null}

      {data.candidaturesTable?.length ? (
        <ReportSection title="Annexe 5 — Parcours candidats" description="Suivi des entrées en formation.">
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
      ) : null}
    </div>
  );
}
