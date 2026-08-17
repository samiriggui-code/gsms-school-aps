'use client';

import { WelcomeCallout, SectionBMenuCards, SupportStats } from './components';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { useModuleLayout } from '@/hooks/use-module-layout';

export default function SectionBLandingPage() {
  const { title, description } = usePageToolbarMeta('/support-qualite');
  const { isVisible } = useModuleLayout('support-landing');

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
        {isVisible('stats') ? <SupportStats /> : null}

        {(isVisible('welcome') || isVisible('stats')) && (
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 lg:grid-cols-3 lg:gap-8">
            {isVisible('welcome') ? (
              <div className={`min-w-0 ${isVisible('stats') ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                <WelcomeCallout className="h-full" />
              </div>
            ) : null}
            {isVisible('stats') ? (
              <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-5 lg:col-span-1">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Module unique</p>
                <p className="text-sm leading-relaxed text-secondary-foreground">
                  Tickets helpdesk et incidents qualité sont regroupés sous un seul module Support — pas de doublon RH ni base d&apos;aide.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>· <span className="font-medium text-foreground">Tickets</span> — demandes utilisateurs</li>
                  <li>· <span className="font-medium text-foreground">Incidents</span> — matériel &amp; processus</li>
                </ul>
              </div>
            ) : null}
          </div>
        )}

        {isVisible('menu-cards') ? <SectionBMenuCards /> : null}
      </Container>
    </>
  );
}
