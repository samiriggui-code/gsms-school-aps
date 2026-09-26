import { Suspense } from 'react';
import { RouteTransitionLoader } from '@/components/common/route-transition-loader';
import { InstructorStagiairesPage } from '@/components/instructor/instructor-stagiaires-page';

export default function FormateurStagiairesPage() {
  return (
    <Suspense fallback={<RouteTransitionLoader />}>
      <InstructorStagiairesPage />
    </Suspense>
  );
}
