import { OfficialExportRendererClient } from '@/components/official-documents/official-export-renderer-client';
import type { ReportDocumentBrand } from '@/lib/reports/document-brand';
import { loadCompanyProfileForOfficialExport } from '@/lib/official-export/company-profile';
import { loadUserForOfficialExport } from '@/lib/official-export/load-user';
import type { OfficialExportJob } from '@/lib/official-export/types';

type Props = {
  job: OfficialExportJob;
  brand: ReportDocumentBrand;
};

export async function OfficialExportRenderer({ job, brand }: Props) {
  const user = await loadUserForOfficialExport(job.userId);
  if (!user) {
    return (
      <div className="p-8 text-sm text-slate-600">Profil introuvable ou archivé.</div>
    );
  }

  const companyProfile = await loadCompanyProfileForOfficialExport();

  return (
    <OfficialExportRendererClient
      job={job}
      brand={brand}
      user={user as never}
      companyProfile={companyProfile}
    />
  );
}
