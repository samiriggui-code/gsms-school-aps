import { redirect } from 'next/navigation';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy path — le workspace vit sous Suivi formations → Tableau. */
export default async function VieScolaireSuiviRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.trim()) qs.set(key, value.trim());
  }
  const suffix = qs.toString();
  redirect(
    `/gestion-academique/suivi-formations/tableau${suffix ? `?${suffix}` : ''}`,
  );
}
