import Link from 'next/link';
import { SubcontractorQualificationStatus } from '@repo/database';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { Button } from '@repo/ui/button';
import { prisma } from '@/lib/prisma';
import { buildComplianceDashboard } from '@/lib/of/compliance-dashboard';

/** Tableau de bord conformité organisme — agrégats lecture seule. */
export default async function ConformiteDashboardPage() {
  const data = await buildComplianceDashboard(prisma);

  const subStatuses = [
    SubcontractorQualificationStatus.PENDING_VALIDATION,
    SubcontractorQualificationStatus.APPROVED,
    SubcontractorQualificationStatus.ACTIVE,
    SubcontractorQualificationStatus.REVIEW_REQUIRED,
    SubcontractorQualificationStatus.SUSPENDED,
  ] as const;

  const fundingTop = Object.entries(data.funding.byStatus)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Conformité (tableau de bord)</ToolbarTitle>
          <ToolbarDescription>
            Vue agrégée lecture seule — Qualiopi, sous-traitants, référent handicap, dossiers
            financeurs (checklists EDOF / OPCO / FT due).
          </ToolbarDescription>
        </ToolbarHeading>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-ressources/qualiopi/couverture">Couverture</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-ressources/rh/sous-traitants">Sous-traitants</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-ressources/rh/referent-handicap">Référent</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/administration-facturation/finance/financeurs">Financeurs</Link>
          </Button>
        </div>
      </Toolbar>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">Qualiopi</h2>
        <div className="mb-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-3">
            <div className="text-2xl font-semibold">{data.qualiopi.coveragePct} %</div>
            <div className="text-muted-foreground text-xs">Couverture Evidence</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-2xl font-semibold">{data.qualiopi.coveredCount}</div>
            <div className="text-muted-foreground text-xs">
              / {data.qualiopi.totalIndicators} indicateurs couverts
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-2xl font-semibold">{data.qualiopi.uncoveredCount}</div>
            <div className="text-muted-foreground text-xs">Sans preuve liée</div>
          </div>
        </div>
        {data.qualiopi.uncoveredCodes.length > 0 ? (
          <p className="text-muted-foreground text-xs">
            Non couverts :{' '}
            <span className="font-mono">{data.qualiopi.uncoveredCodes.join(', ')}</span>
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">Tous les indicateurs ont au moins une preuve.</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">Sous-traitants</h2>
        <div className="mb-2 text-muted-foreground text-xs">Total {data.subcontractors.total}</div>
        <div className="grid gap-3 sm:grid-cols-5">
          {subStatuses.map((st) => (
            <div key={st} className="rounded-md border p-3">
              <div className="text-2xl font-semibold">
                {data.subcontractors.byStatus[st] ?? 0}
              </div>
              <div className="text-muted-foreground text-[10px] leading-tight">{st}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">Référent handicap</h2>
        {data.disabilityReferent.configured ? (
          <div className="rounded-md border p-3 text-sm">
            <div className="font-medium">{data.disabilityReferent.name}</div>
            <div className="text-muted-foreground text-xs">
              {data.disabilityReferent.email ?? '—'} · {data.disabilityReferent.phone ?? '—'}
            </div>
          </div>
        ) : (
          <div className="border-destructive/40 bg-destructive/5 rounded-md border p-3 text-sm">
            <div className="font-medium">Contact référent non renseigné</div>
            <div className="text-muted-foreground mt-1 text-xs">
              Renseigner{' '}
              <Link className="underline" href="/gestion-ressources/rh/referent-handicap">
                Référent handicap
              </Link>{' '}
              (SystemSetting.disabilityReferentName).
            </div>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">FundingCase</h2>
        <div className="mb-3 grid gap-3 sm:grid-cols-4">
          <div className="rounded-md border p-3">
            <div className="text-2xl font-semibold">{data.funding.total}</div>
            <div className="text-muted-foreground text-xs">Dossiers total</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-2xl font-semibold">
              {data.funding.checklistsDue.edof.casesWithDue}
            </div>
            <div className="text-muted-foreground text-xs">
              EDOF avec étapes due ({data.funding.checklistsDue.edof.dueSteps})
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-2xl font-semibold">
              {data.funding.checklistsDue.opco.casesWithDue}
            </div>
            <div className="text-muted-foreground text-xs">
              OPCO avec étapes due ({data.funding.checklistsDue.opco.dueSteps})
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-2xl font-semibold">
              {data.funding.checklistsDue.ftKairos.casesWithDue}
            </div>
            <div className="text-muted-foreground text-xs">
              FT Kairos avec étapes due ({data.funding.checklistsDue.ftKairos.dueSteps})
            </div>
          </div>
        </div>
        {fundingTop.length > 0 ? (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="p-2 font-medium">Statut</th>
                  <th className="p-2 font-medium">Nombre</th>
                </tr>
              </thead>
              <tbody>
                {fundingTop.map(([status, count]) => (
                  <tr key={status} className="border-b last:border-0">
                    <td className="p-2 font-mono text-xs">{status}</td>
                    <td className="p-2">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">Aucun FundingCase.</p>
        )}
      </section>

      <p className="text-muted-foreground text-[10px]">
        API : <code className="font-mono">GET /api/sections/gestion-ressources/conformite/dashboard</code>
      </p>
    </Container>
  );
}
