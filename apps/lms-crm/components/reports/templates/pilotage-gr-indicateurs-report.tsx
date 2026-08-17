'use client';

import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  ReportCallout,
  ReportDataTable,
  ReportKpiGrid,
  ReportPageBreak,
  ReportSection,
  ReportStatusPill,
} from '@/components/reports/report-ui-primitives';

const REPORT_CHART_COLORS = ['#4f46e5', '#7c3aed', '#d97706', '#059669', '#dc2626'];

export type PilotageIndicateursReportData = {
  periodLabel?: string;
  methodology?: string;
  kpis: { label: string; value: string | number; subtitle: string }[];
  evolution: { label: string; value: number }[];
  evolutionTitle: string;
  distribution: { name: string; value: number }[];
  distributionTitle: string;
  secondaryDistribution?: { name: string; value: number }[];
  secondaryDistributionTitle?: string;
  equipmentTable?: {
    id: string;
    label: string;
    serial: string;
    type: string;
    status: string;
    site: string;
  }[];
  complianceTable?: {
    id: string;
    name: string;
    function: string;
    cartePro: string;
    permit: string;
    status: string;
  }[];
  roomsTable?: {
    id: string;
    name: string;
    code: string;
    capacity: number | string;
    status: string;
  }[];
  maintenanceTable?: {
    id: string;
    equipment: string;
    serial: string;
    scheduled: string;
    title: string;
  }[];
  absencesTable?: {
    id: string;
    name: string;
    from: string;
    to: string;
    type: string;
  }[];
  risksTable?: {
    id: string;
    risk: string;
    severity: string;
    exposure: number;
    measure: string;
  }[];
};

function statusTone(status: string): 'ok' | 'review' | 'alert' | 'neutral' {
  if (status === 'Conforme' || status === 'ACTIVE' || status === 'AVAILABLE') return 'ok';
  if (status.includes('30') || status === 'Échéance < 30 j' || status === 'Moyenne') return 'review';
  if (status === 'Expiré' || status === 'OUT_OF_SERVICE' || status === 'Élevée') return 'alert';
  return 'neutral';
}

export function PilotageGrIndicateursReport({ data }: { data: PilotageIndicateursReportData }) {
  return (
    <div className="space-y-10">
      {data.methodology ? (
        <ReportCallout title="Objet du document" tone="info">
          {data.methodology}
        </ReportCallout>
      ) : null}

      <ReportSection title="Synthèse — indicateurs clés" description="Vue consolidée ressources humaines, parc matériel et salles.">
        <ReportKpiGrid items={data.kpis} columns={3} />
      </ReportSection>

      <ReportSection
        title="Analyse graphique"
        description="Évolution des mouvements de stock et répartition du parc équipements."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">{data.evolutionTitle}</h3>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.evolution}>
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} width={28} />
                  <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">{data.distributionTitle}</h3>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="50%"
                    outerRadius="78%"
                    paddingAngle={2}
                    stroke="none"
                  >
                    {data.distribution.map((_, i) => (
                      <Cell key={i} fill={REPORT_CHART_COLORS[i % REPORT_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {data.distribution.map((item) => (
                <span key={item.name} className="text-[10px] font-medium text-slate-600">
                  {item.name}: <strong>{item.value}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </ReportSection>

      {data.complianceTable?.length ? (
        <>
          <ReportPageBreak />
          <ReportSection
            title="Annexe A — Conformité collaborateurs"
            description="État des cartes professionnelles et titres de séjour (critère Qualiopi n°5 — qualification du personnel)."
            breakable
          >
            <ReportDataTable
              caption="Registre RH — pièces réglementaires"
              dense
              rows={data.complianceTable}
              columns={[
                { key: 'name', header: 'Collaborateur', cell: (r) => r.name },
                { key: 'function', header: 'Fonction', cell: (r) => r.function },
                { key: 'cartePro', header: 'Carte pro', cell: (r) => r.cartePro },
                { key: 'permit', header: 'Titre séjour', cell: (r) => r.permit },
                {
                  key: 'status',
                  header: 'Statut',
                  cell: (r) => <ReportStatusPill label={r.status} tone={statusTone(r.status)} />,
                },
              ]}
            />
          </ReportSection>
        </>
      ) : null}

      {data.equipmentTable?.length ? (
        <ReportSection
          title="Annexe B — Inventaire équipements"
          description="Extrait du parc matériel (critère Qualiopi n°4 — moyens pédagogiques)."
          breakable
        >
          <ReportDataTable
            dense
            rows={data.equipmentTable}
            columns={[
              { key: 'label', header: 'Libellé', cell: (r) => r.label },
              { key: 'serial', header: 'N° série', cell: (r) => <span className="font-mono text-[10px]">{r.serial}</span> },
              { key: 'type', header: 'Type', cell: (r) => r.type },
              {
                key: 'status',
                header: 'Statut',
                cell: (r) => <ReportStatusPill label={r.status} tone={statusTone(r.status)} />,
              },
              { key: 'site', header: 'Site', cell: (r) => r.site },
            ]}
          />
        </ReportSection>
      ) : null}

      {data.roomsTable?.length ? (
        <ReportSection title="Annexe C — Salles de formation" description="Capacité et disponibilité des locaux.">
          <ReportDataTable
            dense
            rows={data.roomsTable}
            columns={[
              { key: 'name', header: 'Salle', cell: (r) => r.name },
              { key: 'code', header: 'Code', cell: (r) => r.code },
              { key: 'capacity', header: 'Capacité', align: 'center', cell: (r) => r.capacity },
              {
                key: 'status',
                header: 'Statut',
                cell: (r) => <ReportStatusPill label={r.status} tone={statusTone(r.status)} />,
              },
            ]}
          />
        </ReportSection>
      ) : null}

      {data.maintenanceTable?.length ? (
        <ReportSection title="Maintenances planifiées (< 30 j)" description="Interventions à anticiper sur le parc.">
          <ReportDataTable
            dense
            rows={data.maintenanceTable}
            columns={[
              { key: 'equipment', header: 'Équipement', cell: (r) => r.equipment },
              { key: 'scheduled', header: 'Date prévue', cell: (r) => r.scheduled },
              { key: 'title', header: 'Intervention', cell: (r) => r.title },
            ]}
          />
        </ReportSection>
      ) : null}

      {data.absencesTable?.length ? (
        <ReportSection title="Absences en cours" description="Collaborateurs absents sur la période.">
          <ReportDataTable
            dense
            rows={data.absencesTable}
            columns={[
              { key: 'name', header: 'Collaborateur', cell: (r) => r.name },
              { key: 'type', header: 'Type', cell: (r) => r.type },
              { key: 'from', header: 'Du', cell: (r) => r.from },
              { key: 'to', header: 'Au', cell: (r) => r.to },
            ]}
          />
        </ReportSection>
      ) : null}

      {data.risksTable?.length ? (
        <>
          <ReportPageBreak />
          <ReportSection
            title="Registre des risques identifiés"
            description="Points de vigilance et mesures correctives recommandées."
            breakable
          >
            <ReportDataTable
              rows={data.risksTable}
              columns={[
                { key: 'risk', header: 'Risque', cell: (r) => r.risk },
                {
                  key: 'severity',
                  header: 'Gravité',
                  cell: (r) => <ReportStatusPill label={r.severity} tone={statusTone(r.severity)} />,
                },
                { key: 'exposure', header: 'Exposition', align: 'center', cell: (r) => r.exposure },
                { key: 'measure', header: 'Mesure', cell: (r) => r.measure },
              ]}
            />
          </ReportSection>
        </>
      ) : null}
    </div>
  );
}
