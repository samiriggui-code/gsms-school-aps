import { redirect } from 'next/navigation';
import { InstructorProfilPage } from '@/components/instructor/instructor-profil-page';

export default async function FormateurProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  if (params.tab === 'settings') {
    redirect('/formateur/parametres');
  }

  return <InstructorProfilPage />;
}
