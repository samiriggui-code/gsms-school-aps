'use client';

import { SessionsByFormation } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/sessions-by-formation';

export function CustomerDetailsReviews({
  formationSlug,
}: {
  formationSlug: string | null;
}) {
  return <SessionsByFormation formationSlug={formationSlug} />;
}
