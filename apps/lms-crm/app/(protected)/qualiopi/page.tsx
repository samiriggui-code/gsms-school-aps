import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { QualiopiSectionStats } from './components/qualiopi-section-stats';
import { QualiopiSecurityHighlights } from './components/qualiopi-security-highlights';
import { QualiopiSectionWelcomeCallout } from './components/qualiopi-section-welcome-callout';
import { QualiopiMenuCards } from './components/qualiopi-menu-cards';

/** Section Qualiopi — moteur conformité (Référentiel), pilotage et IA. */
export default function QualiopiSectionPage() {
  return (
    <CrmWiredLeaf path="/qualiopi" level="section">
      <div className="space-y-5 lg:space-y-7.5 pb-8">
        <QualiopiSectionStats />

        <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div className="min-w-0 lg:col-span-1">
            <QualiopiSecurityHighlights />
          </div>
          <div className="min-w-0 lg:col-span-2">
            <QualiopiSectionWelcomeCallout />
          </div>
        </div>

        <QualiopiMenuCards />
      </div>
    </CrmWiredLeaf>
  );
}
