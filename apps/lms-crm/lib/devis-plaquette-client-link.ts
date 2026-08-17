import { apiFetch, unwrapSectionApiData } from '@/lib/api';

export type PublicPlaquetteLinkResult = {
  url: string;
  expiresAt: string;
};

/** Demande un lien plaquette signé (`/p/devis/.../plaquette?t=…`) — accessible sans compte CRM. */
export async function fetchPublicPlaquetteLink(
  devisId: string,
  ttlDays = 60,
): Promise<PublicPlaquetteLinkResult> {
  const res = await apiFetch(
    `/api/sections/administration-facturation/finance/devis/${devisId}/plaquette-public-link`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttlDays }),
    },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } }).error?.message ?? 'Génération du lien impossible.';
    throw new Error(msg);
  }
  const payload = unwrapSectionApiData<PublicPlaquetteLinkResult>(json);
  if (!payload?.url) {
    throw new Error('Réponse serveur inattendue.');
  }
  return payload;
}
