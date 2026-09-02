import Link from 'next/link';
import {
  ComplianceDossierKind,
  ComplianceSubjectType,
  CrmCompanyKind,
} from '@repo/database';
import { ComplianceService } from '@repo/api-core';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { Button } from '@repo/ui/button';
import { prisma } from '@/lib/prisma';
import { QUALIOPI_SCHOOL_SUBJECT_ID } from '@/lib/of/qualiopi-indicators';
import { ensureDisabilityReferentTemplate } from '@/lib/organisation/ensure-disability-referent-template';
import { ChecklistActions } from './checklist-actions';
import { ReferentContactForm } from './referent-contact-form';

/** WF-40 — référent handicap (SystemSetting + Compliance DISABILITY_REFERENT + Company PARTNER). */
export default async function ReferentHandicapPage() {
  await ensureDisabilityReferentTemplate();

  const settings = await prisma.systemSetting.findFirst({
    orderBy: { id: 'asc' },
    select: {
      disabilityReferentName: true,
      disabilityReferentEmail: true,
      disabilityReferentPhone: true,
    },
  });

  const compliance = new ComplianceService(prisma);
  const dossier = await compliance.ensureDossier({
    kind: ComplianceDossierKind.DISABILITY_REFERENT,
    subjectType: ComplianceSubjectType.SCHOOL,
    subjectId: QUALIOPI_SCHOOL_SUBJECT_ID,
  });
  const summary = await compliance.getDossierSummary(dossier.id);

  const items = await prisma.complianceDossierItem.findMany({
    where: { dossierId: dossier.id },
    orderBy: { code: 'asc' },
    select: {
      id: true,
      code: true,
      label: true,
      status: true,
      rejectionReason: true,
      validatedAt: true,
    },
  });

  const partners = await prisma.company.findMany({
    where: { kind: CrmCompanyKind.PARTNER, isActive: true },
    orderBy: { name: 'asc' },
    take: 50,
    select: { id: true, name: true, email: true, phone: true },
  });

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Référent handicap</ToolbarTitle>
          <ToolbarDescription>
            WF-40 — contact SystemSetting, checklist Compliance DISABILITY_REFERENT, partenaires
            Company.kind=PARTNER. Evidence DISABILITY_REFERENT_ACTION_RECORDED (Q-I20, Q-I26).
          </ToolbarDescription>
        </ToolbarHeading>
        <Button variant="outline" size="sm" asChild>
          <Link href="/gestion-ressources/rh">Retour RH</Link>
        </Button>
      </Toolbar>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{summary?.completenessPct ?? 0}%</div>
          <div className="text-muted-foreground text-[10px] leading-tight">Complétude checklist</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{partners.length}</div>
          <div className="text-muted-foreground text-[10px] leading-tight">Partenaires actifs</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="truncate text-sm font-medium">
            {settings?.disabilityReferentName?.trim() || 'Non renseigné'}
          </div>
          <div className="text-muted-foreground text-[10px] leading-tight">Référent actuel</div>
        </div>
      </div>

      <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Contact référent</h2>
      <ReferentContactForm initial={settings} />

      <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Checklist maintenance</h2>
      <p className="text-muted-foreground mb-2 text-xs">
        Dossier {dossier.id.slice(0, 8)}… — marquer une pièce fait émet l’événement SD-06.
      </p>
      <ChecklistActions items={items} />

      <h2 className="mt-8 mb-2 text-sm font-semibold tracking-wide uppercase">
        Partenaires (Company PARTNER)
      </h2>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">Nom</th>
              <th className="p-2 font-medium">Email</th>
              <th className="p-2 font-medium">Téléphone</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-2 font-medium">{p.name}</td>
                <td className="p-2 text-xs">{p.email ?? '—'}</td>
                <td className="p-2 text-xs">{p.phone ?? '—'}</td>
              </tr>
            ))}
            {partners.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-4" colSpan={3}>
                  Aucun partenaire actif — créer des Company avec kind=PARTNER (Cap emploi,
                  AGEFIPH…).
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
