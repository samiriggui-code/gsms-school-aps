import type { Metadata } from 'next';
import { MonDossierClient } from './mon-dossier-client';

export const metadata: Metadata = {
  title: 'Mon dossier',
};

export default async function MonDossierPage({
  searchParams,
}: {
  searchParams: Promise<{ cnaps?: string }>;
}) {
  const params = await searchParams;
  const openCnaps = params.cnaps === '1' || params.cnaps === 'true';
  return <MonDossierClient initialCnapsOpen={openCnaps} />;
}
