import { Suspense } from 'react';
import { RouteTransitionLoader } from '@/components/common/route-transition-loader';
import { InstructorSessionsDatagridPage } from '@/components/instructor/instructor-sessions-datagrid-page';

export default function FormateurSessionsPage() {
  return (
    <Suspense fallback={<RouteTransitionLoader />}>
      <InstructorSessionsDatagridPage />
    </Suspense>
  );
}
