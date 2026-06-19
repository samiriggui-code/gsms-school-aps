'use client';

import { ReportDocumentShell } from '@/components/reports/report-document-shell';
import { CollaborateurContractTemplate } from '@/app/(protected)/gestion-ressources/rh/collaborateurs/components/collaborateur-details-documents';
import { CollaborateurFicheTemplate } from '@/app/(protected)/gestion-ressources/rh/collaborateurs/components/collaborateur-details-sheet';
import {
  EtudiantFicheTemplate,
  type FicheParcoursAnnex,
} from '@/app/(protected)/gestion-academique/vie-scolaire/etudiants/components/etudiant-details-sheet';
import type { ReportDocumentBrand } from '@/lib/reports/document-brand';
import type { OfficialExportJob } from '@/lib/official-export/types';
import type { OfficialDocumentKind } from '@/lib/reports/official-document-types';
import type { User } from '@/app/models/user';

type CompanyProfilePayload = Awaited<
  ReturnType<typeof import('@/lib/official-export/company-profile').loadCompanyProfileForOfficialExport>
>;

type Props = {
  job: OfficialExportJob;
  brand: ReportDocumentBrand;
  user: User;
  companyProfile: CompanyProfilePayload;
};

function userDisplayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string;
}) {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.name?.trim() ||
    user.email ||
    '—'
  );
}

export function OfficialExportRendererClient({ job, brand, user, companyProfile }: Props) {
  const fullName = userDisplayName(user);

  let title = fullName;
  let subtitle = 'Document officiel';
  let periodLabel = 'Dossier administratif';
  let reference = user.id.slice(0, 12).toUpperCase();
  let kind: OfficialDocumentKind = 'corporate';
  let body: React.ReactNode = null;

  switch (job.templateKey) {
    case 'rh.fiche-collaborateur':
      title = `Fiche collaborateur — ${fullName}`;
      subtitle = 'Ressources humaines';
      periodLabel = 'Dossier RH collaborateur';
      body = (
        <CollaborateurFicheTemplate
          collaborateur={user}
          companyProfile={companyProfile}
          embedded
          theme="collaborateur"
        />
      );
      break;
    case 'rh.fiche-formateur':
      title = `Fiche formateur — ${fullName}`;
      subtitle = 'Ressources humaines';
      periodLabel = 'Dossier RH formateur';
      body = (
        <CollaborateurFicheTemplate
          collaborateur={user}
          companyProfile={companyProfile}
          embedded
          theme="formateur"
        />
      );
      break;
    case 'rh.contrat-travail':
      title = 'Contrat de travail';
      subtitle = 'Contrat à durée indéterminée';
      periodLabel = `${fullName} — accord entreprise / salarié`;
      reference = `CTR-${user.id.slice(0, 8).toUpperCase()}`;
      kind = 'legal';
      body = (
        <CollaborateurContractTemplate
          collaborateur={user}
          companyProfile={companyProfile}
          signatureDateOverride={job.options?.signatureDate}
          embedded
        />
      );
      break;
    case 'academic.fiche-etudiant':
      title = `Fiche apprenant — ${fullName}`;
      subtitle = 'Gestion académique';
      periodLabel = 'Dossier administratif candidat / apprenant';
      body = (
        <EtudiantFicheTemplate
          Etudiant={user}
          companyProfile={companyProfile}
          parcoursAnnex={job.options?.parcoursAnnex as FicheParcoursAnnex | undefined}
          embedded
        />
      );
      break;
    default:
      break;
  }

  return (
    <ReportDocumentShell
      title={title}
      subtitle={subtitle}
      periodLabel={periodLabel}
      generatedAt={job.generatedAt}
      author={job.author}
      reference={reference}
      brand={brand}
      kind={kind}
    >
      {body}
    </ReportDocumentShell>
  );
}
