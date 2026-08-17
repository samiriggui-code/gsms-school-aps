import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getDevisPlaquetteData } from '@/lib/devis-plaquette-server';
import { verifyPlaquettePublicToken } from '@/lib/devis-plaquette-public-token';
import { loadReportDocumentBrand } from '@/lib/reports/document-brand';
import { DevisPlaquetteDocument } from '@/app/(protected)/administration-facturation/finance/devis/[devisId]/plaquette/devis-plaquette-document';
import { DevisPlaquettePrintBar } from '@/app/(protected)/administration-facturation/finance/devis/[devisId]/plaquette/plaquette-print-bar';
import { PlaquetteAccessGate } from '@/app/(protected)/administration-facturation/finance/devis/[devisId]/plaquette/plaquette-access-gate';

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

  if (!raw) {
    return <PlaquetteAccessGate reason="missing" />;
  }

  const verified = verifyPlaquettePublicToken(raw);
  if (!verified || verified.devisId !== devisId) {
    return <PlaquetteAccessGate reason="invalid" />;
  }

  const data = await getDevisPlaquetteData(devisId, { forPublicViewer: true });
  if (!data) {
    return <PlaquetteAccessGate reason="invalid" />;
  }

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const brand = await loadReportDocumentBrand(`${proto}://${host}`);

  return (
    <>
      <DevisPlaquettePrintBar autoPrint={sp.print === '1'} />
      <DevisPlaquetteDocument
        data={data}
        devisHubUrl={null}
        variant="public"
        publicToken={raw}
        brand={brand}
      />
    </>
  );
}
