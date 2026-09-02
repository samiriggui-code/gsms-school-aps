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
import { CreateSubcontractorForm } from './create-subcontractor-form';
import { SubcontractorStatusActions } from './subcontractor-status-actions';

/** WF-39 — qualification sous-traitants (SM + dossier pièces Compliance). */
export default async function SousTraitantsPage() {
  const rows = await prisma.subcontractorRecord.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 100,
    include: { company: { select: { name: true } } },
  });

  const byStatus = await prisma.subcontractorRecord.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const statusCounts = Object.fromEntries(
    byStatus.map((s) => [s.status, s._count._all]),
  ) as Partial<Record<SubcontractorQualificationStatus, number>>;

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Sous-traitants (qualification)</ToolbarTitle>
          <ToolbarDescription>
            WF-39 — cycle PENDING_VALIDATION → APPROVED → ACTIVE → REVIEW_REQUIRED → SUSPENDED.
            Pièces via ComplianceDossier SUBCONTRACTOR_QUALIFICATION. Evidence
            SUBCONTRACTOR_STATUS_CHANGED (Q-I27).
          </ToolbarDescription>
        </ToolbarHeading>
        <Button variant="outline" size="sm" asChild>
          <Link href="/gestion-ressources/rh">Retour RH</Link>
        </Button>
      </Toolbar>

      <div className="mb-6 grid gap-3 sm:grid-cols-5">
        {(
          [
            SubcontractorQualificationStatus.PENDING_VALIDATION,
            SubcontractorQualificationStatus.APPROVED,
            SubcontractorQualificationStatus.ACTIVE,
            SubcontractorQualificationStatus.REVIEW_REQUIRED,
            SubcontractorQualificationStatus.SUSPENDED,
          ] as const
        ).map((st) => (
          <div key={st} className="rounded-md border p-3">
            <div className="text-2xl font-semibold">{statusCounts[st] ?? 0}</div>
            <div className="text-muted-foreground text-[10px] leading-tight">{st}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Nouveau</h2>
      <CreateSubcontractorForm />

      <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Registre</h2>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">Libellé</th>
              <th className="p-2 font-medium">SIRET</th>
              <th className="p-2 font-medium">Société</th>
              <th className="p-2 font-medium">Statut</th>
              <th className="p-2 font-medium">Dossier pièces</th>
              <th className="p-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-2">
                  <div className="font-medium">{r.label}</div>
                  <div className="text-muted-foreground font-mono text-[10px]">{r.id}</div>
                </td>
                <td className="p-2 font-mono text-xs">{r.siret ?? '—'}</td>
                <td className="p-2 text-xs">{r.company?.name ?? '—'}</td>
                <td className="p-2 font-mono text-xs">{r.status}</td>
                <td className="p-2 font-mono text-[10px]">
                  {r.complianceDossierId ? r.complianceDossierId.slice(0, 8) + '…' : '—'}
                </td>
                <td className="p-2">
                  <SubcontractorStatusActions id={r.id} status={r.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-4" colSpan={6}>
                  Aucun sous-traitant — créer un enregistrement ci-dessus.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
