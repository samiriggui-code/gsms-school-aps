import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { EFormationQuizPage } from '@/components/portal/e-formation/e-formation-quiz-page';

export const metadata: Metadata = {
  title: 'Mes quiz',
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      Chargement…
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EFormationQuizPage />
    </Suspense>
  );
}
