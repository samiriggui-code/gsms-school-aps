import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@repo/redis';
import { getClientIP } from '@/lib/api';

/** Profils rate limit routes publiques (SEC-05). */
export type PublicRateLimitProfile = 'preinscription' | 'token-gated';

const PROFILES: Record<
  PublicRateLimitProfile,
  { limit: number; windowSeconds: number }
> = {
  /** Formulaire landing sans jeton — le plus exposé au spam. */
  preinscription: { limit: 5, windowSeconds: 15 * 60 },
  /** POST avec jeton HMAC signé (assessment, satisfaction, plaquette). */
  'token-gated': { limit: 30, windowSeconds: 15 * 60 },
};

function clientIp(request: NextRequest): string {
  const raw = getClientIP(request);
  return raw.split(',')[0]?.trim() || 'unknown';
}

/**
 * Retourne une réponse 429 si la limite est dépassée, sinon `null`.
 */
export async function assertPublicRateLimit(
  request: NextRequest,
  routeKey: string,
  profile: PublicRateLimitProfile = 'token-gated',
): Promise<NextResponse | null> {
  const { limit, windowSeconds } = PROFILES[profile];
  const key = `rl:public:${routeKey}:${clientIp(request)}`;
  const result = await rateLimit(key, limit, windowSeconds);

  if (result.success) return null;

  const retryAfter = Math.max(1, result.reset - Math.floor(Date.now() / 1000));
  return NextResponse.json(
    {
      success: false,
      error: { message: 'Trop de requêtes. Réessayez plus tard.' },
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    },
  );
}
