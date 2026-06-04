import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { nextPublicPathPrefix } from '@/lib/next-public-path-prefix';
import { getDevisPlaquetteData } from '@/lib/devis-plaquette-server';
import { DevisPlaquetteDocument } from './devis-plaquette-document';
import { DevisPlaquettePrintBar } from './plaquette-print-bar';

type PageProps = {
  params: Promise<{ devisId: string }>;
  searchParams: Promise<{ print?: string }>;
};

export default async function DevisPlaquettePage({ params, searchParams }: PageProps) {
  const { devisId } = await params;
  const sp = await searchParams;
  const data = await getDevisPlaquetteData(devisId);
  if (!data) notFound();

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const origin = `${proto}://${host}`;
  const prefix = nextPublicPathPrefix();
  const path = `${prefix}/administration-facturation/finance/devis`.replace(/\/+/g, '/');
  const devisHubUrl = `${origin}${path}?devisId=${encodeURIComponent(data.devis.id)}`;

  return (
    <>
      <DevisPlaquettePrintBar autoPrint={sp.print === '1'} />
      <DevisPlaquetteDocument data={data} devisHubUrl={devisHubUrl} variant="crm" />
    </>
  );
}
