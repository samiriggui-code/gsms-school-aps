'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ParcoursSessionCertificationsPanel } from './certifications';

export function SuiviSessionCertificationsTab({ sessionId }: { sessionId: string | null }) {
  const { t } = useTranslation();

  if (!sessionId) {
    return (
      <Alert variant="secondary" appearance="outline">
        <AlertDescription>{t('vieScolaire.suivi.pickSessionForCertifications')}</AlertDescription>
      </Alert>
    );
  }

  return <ParcoursSessionCertificationsPanel sessionId={sessionId} embedded />;
}
