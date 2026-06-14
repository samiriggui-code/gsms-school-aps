'use client';

import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
const REPORT_CHART_COLORS = ['#2563eb', '#7c3aed', '#d97706', '#059669', '#dc2626'];

export type PilotageIndicateursReportData = {
  kpis: { label: string; value: string | number; subtitle: string }[];
  evolution: { label: string; value: number }[];
  evolutionTitle: string;
  distribution: { name: string; value: number }[];
  distributionTitle: string;
};

export function PilotageGrIndicateursReport({ data }: { data: PilotageIndicateursReportData }) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">Indicateurs clés</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{kpi.value}</p>
              <p className="text-xs text-slate-500">{kpi.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">{data.evolutionTitle}</h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.evolution}>
                <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} width={28} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
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
            {data.distribution.map((item, i) => (
              <span key={item.name} className="text-[10px] font-medium text-slate-600">
                {item.name}: <strong>{item.value}</strong>
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
