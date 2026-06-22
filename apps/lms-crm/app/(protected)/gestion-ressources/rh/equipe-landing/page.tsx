import { redirect } from 'next/navigation';

/** Ancienne URL RH — équipe landing centralisée sous Communication > CMS. */
export default function EquipeLandingLegacyRedirect() {
  redirect('/communication-contenu/cms/equipe-landing');
}
