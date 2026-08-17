'use client';

import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { ParametresStats, ParametresWelcomeCallout } from './components';
import { ParametresModuleMenuCards } from './components/parametres-module-menu-cards';
import { ParametresSettingsSectionCards } from './components/parametres-settings-section-cards';

export default function ParametresLandingPage() {
  const { title, description } = usePageToolbarMeta('/securite-configuration/parametres');
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
      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div className="min-w-0 h-full lg:col-span-1">
            <ParametresStats />
          </div>
          <div className="min-w-0 h-full lg:col-span-2">
            <ParametresWelcomeCallout />
          </div>
        </div>

        <ParametresModuleMenuCards />

        <ParametresSettingsSectionCards />
      </Container>
    </>
  );
}
