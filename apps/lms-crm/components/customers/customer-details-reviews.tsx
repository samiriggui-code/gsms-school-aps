'use client';

import { CardDate } from './components/card-date';

type Props = {
  catalogSlug?: string | null;
  formationSubtitle?: string | null;
};

export function CustomerDetailsReviews({ catalogSlug, formationSubtitle }: Props) {
  return <CardDate formationSlug={catalogSlug} formationSubtitle={formationSubtitle} />;
}
