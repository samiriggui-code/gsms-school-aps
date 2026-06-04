'use client';

import { ModuleWorkspacePage } from '@/components/workspace/module-workspace-page';
import {
  QualiteDistributionChart,
  QualiteEvolutionChart,
} from '../components';

export default function Page() {
  return (
    <ModuleWorkspacePage
      viewKey="support-incidents"
      charts={
        <>
          <QualiteDistributionChart />
          <QualiteEvolutionChart />
        </>
      }
    />
  );
}
