import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDevisPlaquetteData } from '@/lib/devis-plaquette-server';
import { verifyPlaquettePublicToken } from '@/lib/devis-plaquette-public-token';
import { DevisPlaquetteDocument } from '@/app/(protected)/administration-facturation/finance/devis/[devisId]/plaquette/devis-plaquette-document';
import { DevisPlaquettePrintBar } from '@/app/(protected)/administration-facturation/finance/devis/[devisId]/plaquette/plaquette-print-bar';

export const metadata: Metadata = {
  title: 'Proposition commerciale',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ devisId: string }>;
  searchParams: Promise<{ print?: string; t?: string }>;
};

export default async function PublicDevisPlaquettePage({ params, searchParams }: PageProps) {
  const { devisId } = await params;
  const sp = await searchParams;
  const raw = typeof sp.t === 'string' ? sp.t.trim() : '';
  if (!raw) notFound();

  const verified = verifyPlaquettePublicToken(raw);
  if (!verified || verified.devisId !== devisId) notFound();

  const data = await getDevisPlaquetteData(devisId, { forPublicViewer: true });
  if (!data) notFound();

  return (
    <>
      <DevisPlaquettePrintBar autoPrint={sp.print === '1'} />
      <DevisPlaquetteDocument data={data} devisHubUrl={null} variant="public" publicToken={raw} />
    </>
  );
}
