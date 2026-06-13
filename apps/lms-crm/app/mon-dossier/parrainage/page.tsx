import { ParrainageInviteForm } from '@/components/portal/parrainage/parrainage-invite-form';
import { PortalPageHero } from '@/components/portal/layout/portal-page-hero';
import { PortalPageShell } from '@/components/portal/layout/portal-page-shell';

export default function MonDossierParrainagePage() {
  return (
    <PortalPageShell width="wide">
      <PortalPageHero
        title="Parrainer un ami"
        description="Recommandez l’école à vos proches — lien personnel et invitations."
        badge="Ambassadeur"
      />
      <div className="mt-6">
        <ParrainageInviteForm />
      </div>
    </PortalPageShell>
  );
}
