import type { Metadata } from 'next';
import { verifySatisfactionSurveyPublicToken } from '@/lib/of/satisfaction-survey-public-token';
import { SatisfactionSurveyAccessGate } from './satisfaction-survey-access-gate';
import { SatisfactionSurveyForm } from './satisfaction-survey-form';

export const metadata: Metadata = {
  title: 'Enquête de satisfaction',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ surveyId: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function PublicSatisfactionSurveyPage({ params, searchParams }: PageProps) {
  const { surveyId } = await params;
  const sp = await searchParams;
  const raw = typeof sp.t === 'string' ? sp.t.trim() : '';

  if (!raw) {
    return <SatisfactionSurveyAccessGate reason="missing" />;
  }

  const verified = verifySatisfactionSurveyPublicToken(raw);
  if (!verified || verified.surveyId !== surveyId) {
    return <SatisfactionSurveyAccessGate reason="invalid" />;
  }

  return <SatisfactionSurveyForm surveyId={surveyId} token={raw} />;
}
