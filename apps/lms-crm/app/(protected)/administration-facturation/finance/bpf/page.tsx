import Link from 'next/link';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { buildBpfAggregates } from '@/lib/finance/bpf-aggregates';

type PageProps = { searchParams: Promise<{ year?: string }> };

function euro(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

/** G11 — Bilan pédagogique & financier : agrégats déterministes (pas de PDF Cerfa). */
export default async function BpfPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const current = new Date().getUTCFullYear();
  const yearRaw = params.year ? Number(params.year) : current - 1;
  const year =
    Number.isInteger(yearRaw) && yearRaw >= 2000 && yearRaw <= current + 1
      ? yearRaw
      : current - 1;

  const data = await buildBpfAggregates(prisma, year);
  const years = [current, current - 1, current - 2, current - 3];

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>BPF</ToolbarTitle>
          <ToolbarDescription>
            Agrégats Cerfa déterministes (G11) — exercice {data.year} ({data.periodStart} →{' '}
            {data.periodEnd}). Pas d’export PDF officiel dans cette passe.
          </ToolbarDescription>
        </ToolbarHeading>
        <Button variant="outline" size="sm" asChild>
          <Link href="/administration-facturation/finance">Retour finance</Link>
        </Button>
      </Toolbar>

      <div className="mb-6 flex flex-wrap gap-2">
        {years.map((y) => (
          <Button key={y} size="sm" variant={y === year ? 'primary' : 'outline'} asChild>
            <Link href={`/administration-facturation/finance/bpf?year=${y}`}>{y}</Link>
          </Button>
        ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{data.stagiairesCount}</div>
          <div className="text-muted-foreground text-sm">Stagiaires (distincts)</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{data.sessionsCount}</div>
          <div className="text-muted-foreground text-sm">Sessions</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{data.hoursCatalog}</div>
          <div className="text-muted-foreground text-sm">Heures catalogue</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{data.hoursAttendedProxy}</div>
          <div className="text-muted-foreground text-sm">Heures émargées (proxy)</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{data.fundingCasesCount}</div>
          <div className="text-muted-foreground text-sm">Dossiers FundingCase</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{euro(data.amountRequested)}</div>
          <div className="text-muted-foreground text-sm">Montant demandé</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{euro(data.amountApproved)}</div>
          <div className="text-muted-foreground text-sm">Montant accordé</div>
        </div>
      </div>

      <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Par type financeur</h2>
      <div className="mb-8 overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">Type</th>
              <th className="p-2 font-medium">Dossiers</th>
              <th className="p-2 font-medium">Demandé</th>
              <th className="p-2 font-medium">Accordé</th>
            </tr>
          </thead>
          <tbody>
            {data.byFunderType.map((row) => (
              <tr key={row.funderType} className="border-b last:border-0">
                <td className="p-2">{row.funderType}</td>
                <td className="p-2">{row.cases}</td>
                <td className="p-2">{euro(row.requested)}</td>
                <td className="p-2">{euro(row.approved)}</td>
              </tr>
            ))}
            {data.byFunderType.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-4" colSpan={4}>
                  Aucun FundingCase sur l’exercice — chiffres à zéro attendus.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {data.controls.length > 0 ? (
        <>
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Contrôles</h2>
          <ul className="mb-8 space-y-2">
            {data.controls.map((c) => (
              <li
                key={c.code}
                className={`rounded-md border p-3 text-sm ${
                  c.severity === 'warn' ? 'border-amber-500/40' : 'border-muted'
                }`}
              >
                <span className="font-mono text-xs">{c.code}</span> — {c.message}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Méthodologie</h2>
      <ul className="text-muted-foreground mb-4 list-disc space-y-1 pl-5 text-sm">
        {data.methodology.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="text-muted-foreground text-xs">
        API :{' '}
        <code className="font-mono">
          GET /api/sections/administration-facturation/finance/bpf/stats?year={year}
        </code>
      </p>
    </Container>
  );
}
