import { redirect } from 'next/navigation';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CertificationsRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  qs.set('tab', 'certifications');
  const sessionId = params.sessionId;
  if (typeof sessionId === 'string' && sessionId.trim()) {
    qs.set('sessionId', sessionId.trim());
  }
  redirect(`/gestion-academique/suivi-formations/tableau?${qs.toString()}`);
}
