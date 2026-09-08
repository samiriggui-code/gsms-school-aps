'use client';

import Link from 'next/link';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { Button } from '@repo/ui/button';
import { QualiopiPasseportView } from './components/qualiopi-passeport-view';

/** Q3 — Passeport Qualiopi Session : stress test + findings + liens métier. */
export default function QualiopiPasseportPage() {
  const { title, description } = usePageToolbarMeta(
    '/gestion-ressources/qualiopi/passeport',
  );

  return (
    <Container className="space-y-5 pb-8">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>{title || 'Passeport session'}</ToolbarTitle>
          <ToolbarDescription>
            {description ||
              'Choisir une session, lancer un stress test déterministe, corriger dans le métier.'}
          </ToolbarDescription>
        </ToolbarHeading>
        <ToolbarActions>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-ressources/qualiopi/couverture">Couverture</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gestion-ressources/qualiopi">Hub Qualiopi</Link>
          </Button>
        </ToolbarActions>
      </Toolbar>

      <QualiopiPasseportView />
    </Container>
  );
}
