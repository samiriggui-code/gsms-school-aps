import { redirect } from 'next/navigation';

/** Paramètres système : UI canonique sous `/parametres/settings` (API reste sous `acces/settings`). */
export default function AccesSettingsRedirectPage() {
  redirect('/securite-configuration/parametres/settings');
}
