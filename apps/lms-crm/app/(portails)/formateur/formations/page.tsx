import { Suspense } from 'react';
import { RouteTransitionLoader } from '@/components/common/route-transition-loader';
import { InstructorFormationsDatagridPage } from '@/components/instructor/instructor-formations-datagrid-page';

export default function FormateurFormationsPage() {
  return (
    <Suspense fallback={<RouteTransitionLoader />}>
      <InstructorFormationsDatagridPage />
    </Suspense>
  );
}
