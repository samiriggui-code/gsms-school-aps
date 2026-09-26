import { DatagridExportPrintTrigger } from '@/components/datagrid/datagrid-export-print-trigger';
import { OfficialExportRenderer } from '@/components/official-documents/official-export-renderer';
import { loadReportDocumentBrand } from '@/lib/reports/document-brand';
import {
  OFFICIAL_EXPORT_CACHE_PREFIX,
  type OfficialExportJob,
} from '@/lib/official-export/types';
import { getCache } from '@repo/redis';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ print?: string }>;
};

async function resolveOrigin(): Promise<string | undefined> {
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  const proto = headerList.get('x-forwarded-proto') ?? 'http';
  if (!host) return undefined;
  return `${proto}://${host}`;
}

export default async function OfficialExportPreviewPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { print } = await searchParams;

  const job = await getCache<OfficialExportJob>(`${OFFICIAL_EXPORT_CACHE_PREFIX}${token}`);
  if (!job) notFound();

  const origin = await resolveOrigin();
  const brand = await loadReportDocumentBrand(origin);
  const autoPrint = print !== '0';

  return (
    <>
      {autoPrint ? <DatagridExportPrintTrigger /> : null}
      <OfficialExportRenderer job={job} brand={brand} />
    </>
  );
}
