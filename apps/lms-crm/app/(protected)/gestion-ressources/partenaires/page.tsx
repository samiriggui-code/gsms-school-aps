import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ComplianceDossierKind, ComplianceSubjectType } from '@repo/database';
import { ComplianceService } from '@repo/api-core';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { prisma } from '@/lib/prisma';
import { QUALIOPI_SCHOOL_SUBJECT_ID } from '@/lib/of/qualiopi-indicators';

/** Module Partenaires & accessibilité — sous-traitants (I27) + référent handicap (I20/I26). */
export default async function PartenairesLandingPage() {
  const subcontractorCount = await prisma.subcontractorRecord.count();
  const subcontractorActive = await prisma.subcontractorRecord.count({
    where: { status: 'ACTIVE' },
  });

  const compliance = new ComplianceService(prisma);
  const dossier = await compliance.ensureDossier({
    kind: ComplianceDossierKind.DISABILITY_REFERENT,
    subjectType: ComplianceSubjectType.SCHOOL,
    subjectId: QUALIOPI_SCHOOL_SUBJECT_ID,
  });
  const summary = await compliance.getDossierSummary(dossier.id);

  return (
    <CrmWiredLeaf path="/gestion-ressources/partenaires" level="module">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Sous-traitants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-6">
              <div>
                <div className="text-2xl font-semibold">{subcontractorCount}</div>
                <div className="text-xs text-muted-foreground">Enregistrés</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{subcontractorActive}</div>
                <div className="text-xs text-muted-foreground">Actifs</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              WF-39 — qualification SM, dossier pièces Compliance (Q-I27).
            </p>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/gestion-ressources/partenaires/sous-traitants">
                Ouvrir
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Référent handicap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-2xl font-semibold">{summary?.completenessPct ?? 0}%</div>
              <div className="text-xs text-muted-foreground">Complétude checklist</div>
            </div>
            <p className="text-sm text-muted-foreground">
              WF-40 — contact, checklist Compliance DISABILITY_REFERENT (Q-I20, Q-I26).
            </p>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/gestion-ressources/partenaires/referent-handicap">
                Ouvrir
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </CrmWiredLeaf>
  );
}
