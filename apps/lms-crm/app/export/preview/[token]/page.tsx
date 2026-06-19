import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getCache } from '@repo/redis';
import { DatagridExportPrintTrigger } from '@/components/datagrid/datagrid-export-print-trigger';
import { DatagridExportReport } from '@/components/datagrid/datagrid-export-report';
import {
  DATAGRID_EXPORT_CACHE_PREFIX,
  type DatagridExportDocument,
} from '@/lib/datagrid/export-document-types';
import { loadReportDocumentBrand } from '@/lib/reports/document-brand';

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

export default async function DatagridExportPreviewPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { print } = await searchParams;

  const document = await getCache<DatagridExportDocument>(
    `${DATAGRID_EXPORT_CACHE_PREFIX}${token}`,
  );
  if (!document) notFound();

  const origin = await resolveOrigin();
  const brand = await loadReportDocumentBrand(origin);
  const autoPrint = print !== '0';

  return (
    <>
      {autoPrint ? <DatagridExportPrintTrigger /> : null}
      <DatagridExportReport document={document} brand={brand} />
    </>
  );
}
