import { redirect } from 'next/navigation';

/** Ancienne URL notif — page inexistante. */
export default function QuoteLeadsRedirectPage() {
  redirect('/communication-contenu/marketing/formulaires-leads');
}
