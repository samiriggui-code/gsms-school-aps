import { redirect } from 'next/navigation';

/**
 * Anciennes notifs pointaient vers /devis/[id] (page inexistante hors plaquette).
 * On ouvre la liste avec le sheet via ?devisId=.
 */
export default async function DevisDeepLinkPage({
  params,
}: {
  params: Promise<{ devisId: string }>;
}) {
  const { devisId } = await params;
  const base = '/administration-facturation/finance/devis';
  if (!devisId?.trim()) redirect(base);
  redirect(`${base}?devisId=${encodeURIComponent(devisId.trim())}`);
}
