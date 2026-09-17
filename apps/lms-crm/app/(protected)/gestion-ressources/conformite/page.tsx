import { redirect } from 'next/navigation';

/** Ancien libellé « Conformité » Qualiopi → Écarts détectés. */
export default function Page() {
  redirect('/qualiopi/referentiel/ecarts');
}
