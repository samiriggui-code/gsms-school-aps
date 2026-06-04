import { createHmac, timingSafeEqual } from 'node:crypto';

const B64 = 'base64url';

/**
 * Secret dédié recommandé en production. À défaut, on retombe sur NEXTAUTH_SECRET
 * pour que les liens plaquette fonctionnent en local sans variable supplémentaire.
 */
function resolvePlaquetteSigningSecret(): string | null {
  const dedicated = process.env.DEVIS_PLAQUETTE_LINK_SECRET?.trim();
  if (dedicated) return dedicated;
  return process.env.NEXTAUTH_SECRET?.trim() || null;
}

function getSecret(): string {
  const s = resolvePlaquetteSigningSecret();
  if (!s) {
    throw new Error(
      'Aucun secret pour signer les liens plaquette : renseignez DEVIS_PLAQUETTE_LINK_SECRET ou NEXTAUTH_SECRET.',
    );
  }
  return s;
}

/** Indique si les liens publics plaquette peuvent être émis / vérifiés. */
export function isPlaquettePublicLinkConfigured(): boolean {
  return resolvePlaquetteSigningSecret() != null;
}

/**
 * Jeton opaque : payload signé (HMAC-SHA256), expiration absolue en ms.
 * Format : `<base64url(payload)>.<base64url(signature)>`
 */
export function signPlaquettePublicToken(devisId: string, expiresAtMs: number): string {
  const secret = getSecret();
  const payload = JSON.stringify({ d: devisId, exp: expiresAtMs });
  const payloadB64 = Buffer.from(payload, 'utf8').toString(B64);
  const sig = createHmac('sha256', secret).update(payloadB64).digest(B64);
  return `${payloadB64}.${sig}`;
}

export function verifyPlaquettePublicToken(token: string): { devisId: string } | null {
  const secret = resolvePlaquetteSigningSecret();
  if (!secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;
  const expected = createHmac('sha256', secret).update(payloadB64).digest(B64);
  const a = Buffer.from(sig, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const json = Buffer.from(payloadB64, B64).toString('utf8');
    const payload = JSON.parse(json) as { d?: unknown; exp?: unknown };
    if (typeof payload.d !== 'string' || typeof payload.exp !== 'number') return null;
    if (Date.now() > payload.exp) return null;
    return { devisId: payload.d };
  } catch {
    return null;
  }
}
