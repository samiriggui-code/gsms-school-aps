'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
  ToolbarActions,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { Button } from '@repo/ui/button';
import { QualiopiClasseurView } from './components/qualiopi-classeur-view';
import { QualiopiGapsAssistantPanel } from '../components/qualiopi-gaps-assistant-panel';

export default function QualiopiClasseurPage() {
  const { title, description } = usePageToolbarMeta('/gestion-ressources/qualiopi/classeur');

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" size="sm" asChild>
              <Link href="/gestion-ressources/qualiopi">
                <ArrowLeft className="size-4 mr-1" />
                Retour hub
              </Link>
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>
      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <QualiopiGapsAssistantPanel />
        <QualiopiClasseurView />
      </Container>
    </>
  );
}
