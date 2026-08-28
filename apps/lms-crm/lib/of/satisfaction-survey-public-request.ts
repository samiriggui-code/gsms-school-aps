import type { NextRequest } from 'next/server';
import { verifySatisfactionSurveyPublicToken } from '@/lib/of/satisfaction-survey-public-token';

export function getSatisfactionSurveyPublicTokenFromRequest(request: NextRequest): string | null {
  const t = request.nextUrl.searchParams.get('t')?.trim();
  return t || null;
}

export function verifySatisfactionSurveyTokenForSurvey(
  request: NextRequest,
  surveyId: string,
): { ok: true } | { ok: false; status: number; message: string } {
  const raw = getSatisfactionSurveyPublicTokenFromRequest(request);
  if (!raw) return { ok: false, status: 401, message: 'Jeton manquant (paramètre t).' };
  const v = verifySatisfactionSurveyPublicToken(raw);
  if (!v || v.surveyId !== surveyId) return { ok: false, status: 403, message: 'Lien invalide ou expiré.' };
  return { ok: true };
}
