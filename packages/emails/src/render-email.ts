import { render } from '@react-email/render';
import type { ReactElement } from 'react';

/** Rendu HTML avec Tailwind Barebone — utiliser partout (landing, CRM). */
export async function renderEmail(element: ReactElement): Promise<string> {
  return render(element);
}
