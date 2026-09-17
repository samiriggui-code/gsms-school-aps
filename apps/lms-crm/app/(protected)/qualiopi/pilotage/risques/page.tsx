import { redirect } from 'next/navigation';

/** Vague 2 — risques OF = écarts Qualiopi (plus de second cockpit). */
export default function Page() {
  redirect('/qualiopi/referentiel/ecarts');
}
