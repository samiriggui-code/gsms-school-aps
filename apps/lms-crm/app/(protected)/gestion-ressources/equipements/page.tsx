'use client';

import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import {
  EquipmentStats,
  EquipmentWelcomeCallout,
  EquipmentRecentAffectationsTable,
  EquipmentAlerts,
  EquipmentDistributionChart,
  EquipmentEvolutionChart,
} from './components';

export default function EquipementsLandingPage() {
  const { title, description } = usePageToolbarMeta('/gestion-ressources/equipements');
  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>
      <Container className="space-y-5 lg:space-y-7.5">
        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <EquipmentStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <EquipmentWelcomeCallout />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <EquipmentAlerts />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <EquipmentRecentAffectationsTable />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 h-full lg:col-span-1">
            <EquipmentDistributionChart />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <EquipmentEvolutionChart />
          </div>
        </div>
      </Container>
</>
  );
}
