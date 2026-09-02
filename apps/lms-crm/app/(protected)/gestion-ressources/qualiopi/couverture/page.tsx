import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import {
  QualiopiCouverturePageClient,
  QualiopiCouvertureToolbarActions,
} from '../components/qualiopi-couverture-page-client';

/** G9 — couverture des indicateurs Qualiopi via EvidenceIndicatorLink (client + API). */
export default function QualiopiCouverturePage() {
  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Couverture Qualiopi</ToolbarTitle>
          <ToolbarDescription>
            G9 — preuves liées via EvidenceIndicatorLink. Les liens se créent sur les nouveaux
            changements de statut du classeur — pas de migration legacy.
          </ToolbarDescription>
        </ToolbarHeading>
        <QualiopiCouvertureToolbarActions />
      </Toolbar>

      <QualiopiCouverturePageClient />
    </Container>
  );
}
