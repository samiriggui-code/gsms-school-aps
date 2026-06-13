import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { EFormationDashboard } from '@/components/portal/e-formation/e-formation-dashboard';

export const metadata: Metadata = {
  title: 'E-formation',
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      Chargement…
    </div>
  );
}

export default function EFormationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EFormationDashboard />
    </Suspense>
  );
}
