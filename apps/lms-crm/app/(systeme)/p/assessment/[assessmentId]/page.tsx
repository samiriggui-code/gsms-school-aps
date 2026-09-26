import type { Metadata } from 'next';
import { verifyCandidatureAssessmentPublicToken } from '@/lib/of/candidature-assessment-public-token';
import { CandidatureAssessmentForm } from './assessment-form';

export const metadata: Metadata = {
  title: 'Questionnaire candidature',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ assessmentId: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function PublicCandidatureAssessmentPage({ params, searchParams }: PageProps) {
  const { assessmentId } = await params;
  const sp = await searchParams;
  const raw = typeof sp.t === 'string' ? sp.t.trim() : '';

  if (!raw) {
    return (
      <main className="mx-auto max-w-lg p-8 text-sm text-muted-foreground">
        Lien incomplet — ouvrez le questionnaire depuis l’e-mail reçu.
      </main>
    );
  }

  const verified = verifyCandidatureAssessmentPublicToken(raw);
  if (!verified || verified.assessmentId !== assessmentId) {
    return (
      <main className="mx-auto max-w-lg p-8 text-sm text-destructive">
        Lien invalide ou expiré.
      </main>
    );
  }

  return <CandidatureAssessmentForm assessmentId={assessmentId} token={raw} />;
}
