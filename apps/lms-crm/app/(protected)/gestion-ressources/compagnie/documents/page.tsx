'use client';

import { Container } from '@/components/common/container';
import { PageHeroZone } from '@/components/common/page-hero-zone';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { DocumentsList } from './components/documents-list';
import { DocumentsStats } from './components/documents-stats';

export default function Page() {
  const { title, description } = usePageToolbarMeta('/gestion-ressources/compagnie/documents');

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
      <Container>
        <PageHeroZone
          accent="slate-primary"
          eyebrow="Dossier administratif"
          title="Pièces officielles de l&apos;établissement"
          descriptionClassName="leading-relaxed space-y-3"
          description={
            <>
              <p>
                Chaque type de document dispose d&apos;une <strong className="text-foreground">fiche</strong>{' '}
                (références, dates, notes internes) et d&apos;un{' '}
                <strong className="text-foreground">fichier joint</strong> optionnel (PDF, scan). Ce dossier complète le
                profil légal : bilan, agréments, assurance, bail, etc.
              </p>
              <p>
                Les pièces sont classées par thématique. Chaque enregistrement ou pièce jointe est tracé (auteur, date)
                ; utilisez la visionneuse pour consulter un PDF sans quitter la page.
              </p>
            </>
          }
        />
      </Container>

      <Container className="space-y-5 pb-10 lg:space-y-7.5">
        <DocumentsStats variant="row" />
        <DocumentsList />
      </Container>
    </>
  );
}
