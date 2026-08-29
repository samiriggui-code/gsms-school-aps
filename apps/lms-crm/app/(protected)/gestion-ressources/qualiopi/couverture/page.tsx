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
import { buildQualiopiCoverage } from '@/lib/of/qualiopi-coverage';

/** G9 — couverture des indicateurs Qualiopi via EvidenceIndicatorLink. */
export default async function QualiopiCouverturePage() {
  const data = await buildQualiopiCoverage(prisma);

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Couverture Qualiopi</ToolbarTitle>
          <ToolbarDescription>
            G9 — {data.referentialVersion} : preuves liées via EvidenceIndicatorLink (
            {data.coveredCount}/{data.totalIndicators}, {data.coveragePct} %). Les liens se créent
            sur les nouveaux changements de statut du classeur — pas de migration legacy.
          </ToolbarDescription>
        </ToolbarHeading>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-ressources/qualiopi/classeur">Classeur</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-ressources/qualiopi">Retour Qualiopi</Link>
          </Button>
        </div>
      </Toolbar>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{data.coveredCount}</div>
          <div className="text-muted-foreground text-sm">Indicateurs couverts</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{data.uncoveredCount}</div>
          <div className="text-muted-foreground text-sm">Sans preuve liée</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{data.coveragePct} %</div>
          <div className="text-muted-foreground text-sm">Taux de couverture</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">Code</th>
              <th className="p-2 font-medium">Indicateur</th>
              <th className="p-2 font-medium">Preuves</th>
              <th className="p-2 font-medium">Dernière preuve</th>
              <th className="p-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {data.indicators.map((ind) => (
              <tr key={ind.code} className="border-b last:border-0">
                <td className="p-2 font-mono text-xs">{ind.code}</td>
                <td className="p-2">
                  <div className="font-medium">
                    I{String(ind.indicator).padStart(2, '0')} — {ind.label}
                  </div>
                  <div className="text-muted-foreground text-xs">Critère {ind.criterion}</div>
                </td>
                <td className="p-2">{ind.evidenceCount}</td>
                <td className="p-2 text-xs">
                  {ind.latestEvidence ? (
                    <>
                      <span className="font-mono">{ind.latestEvidence.eventName ?? '—'}</span>
                      <div className="text-muted-foreground">
                        {ind.latestEvidence.createdAt.slice(0, 10)} · {ind.latestEvidence.sourceType}
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-2 text-xs">{ind.covered ? 'couvert' : 'non couvert'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-muted-foreground mt-4 text-xs">
        API :{' '}
        <code className="font-mono">GET /api/sections/gestion-ressources/qualiopi/coverage</code>
      </p>
    </Container>
  );
}
