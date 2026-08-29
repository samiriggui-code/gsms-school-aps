import { createHmac, timingSafeEqual } from 'node:crypto';

const B64 = 'base64url';

function resolveSecret(): string | null {
  const dedicated = process.env.CANDIDATURE_ASSESSMENT_LINK_SECRET?.trim();
  if (dedicated) return dedicated;
  return process.env.NEXTAUTH_SECRET?.trim() || null;
}

function getSecret(): string {
  const s = resolveSecret();
  if (!s) {
    throw new Error(
      'Aucun secret pour signer les liens assessment : CANDIDATURE_ASSESSMENT_LINK_SECRET ou NEXTAUTH_SECRET.',
    );
  }
  return s;
}

export function isCandidatureAssessmentPublicLinkConfigured(): boolean {
  return resolveSecret() != null;
}

export function signCandidatureAssessmentPublicToken(assessmentId: string, expiresAtMs: number): string {
  const secret = getSecret();
  const payload = JSON.stringify({ a: assessmentId, exp: expiresAtMs });
  const payloadB64 = Buffer.from(payload, 'utf8').toString(B64);
  const sig = createHmac('sha256', secret).update(payloadB64).digest(B64);
  return `${payloadB64}.${sig}`;
}

export function verifyCandidatureAssessmentPublicToken(
  token: string,
): { assessmentId: string } | null {
  const secret = resolveSecret();
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
    const payload = JSON.parse(json) as { a?: unknown; exp?: unknown };
    if (typeof payload.a !== 'string' || typeof payload.exp !== 'number') return null;
    if (Date.now() > payload.exp) return null;
    return { assessmentId: payload.a };
  } catch {
    return null;
  }
}
