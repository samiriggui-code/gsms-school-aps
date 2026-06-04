import type { NextRequest } from 'next/server';
import { verifyPlaquettePublicToken } from '@/lib/devis-plaquette-public-token';

export function getPlaquettePublicTokenFromRequest(request: NextRequest): string | null {
  const t = request.nextUrl.searchParams.get('t')?.trim();
  return t || null;
}

export function verifyPlaquetteTokenForDevis(
  request: NextRequest,
  devisId: string,
): { ok: true } | { ok: false; status: number; message: string } {
  const raw = getPlaquettePublicTokenFromRequest(request);
  if (!raw) return { ok: false, status: 401, message: 'Jeton manquant (paramètre t).' };
  const v = verifyPlaquettePublicToken(raw);
  if (!v || v.devisId !== devisId) return { ok: false, status: 403, message: 'Lien invalide ou expiré.' };
  return { ok: true };
}
