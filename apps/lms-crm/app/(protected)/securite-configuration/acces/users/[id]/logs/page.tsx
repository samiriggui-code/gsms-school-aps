import { redirect } from 'next/navigation';

/** Ancienne route ; les journaux système sont sur l’onglet « Journal » de la fiche utilisateur. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/securite-configuration/acces/users/${id}?tab=journal`);
}
