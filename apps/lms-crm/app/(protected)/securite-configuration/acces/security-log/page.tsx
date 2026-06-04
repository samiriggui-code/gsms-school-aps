import { redirect } from 'next/navigation';

/** Ancienne URL — journal unique sous /acces/logs */
export default function AccessSecurityLogRedirectPage() {
  redirect('/securite-configuration/acces/logs');
}
