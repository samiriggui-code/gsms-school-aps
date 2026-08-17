import { userPersonalMailbox, userProfessionalMailbox } from '@/lib/user-email-routing';

type StructurePerson = {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  proEmail?: string | null;
};

/** Nom affiché (prénom + nom, pas le libellé seed « Candidat Dev N » si first/last renseignés). */
export function structurePersonName(u: StructurePerson): string {
  const parts = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  if (parts) return parts;
  return (u.name || '').trim() || structureLoginEmail(u) || '—';
}

/** Email de connexion / professionnel — jamais la boîte personnelle en priorité d'affichage structure. */
export function structureLoginEmail(u: StructurePerson): string | null {
  return userProfessionalMailbox(u) ?? userPersonalMailbox(u);
}
