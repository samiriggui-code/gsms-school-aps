import { InAppNotificationsHubPage } from '@/components/notifications/in-app-notifications-hub-page';

export default function MonDossierNotificationsPage() {
  return (
    <InAppNotificationsHubPage
      kind="stagiaire"
      description="Suivi de dossier, convocations, messages établissement et support — sans contenu admin ou finance."
    />
  );
}
