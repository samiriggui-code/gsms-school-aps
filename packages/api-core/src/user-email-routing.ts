/**
 * Routage des boîtes mail utilisateur LMS.
 *
 * - proEmail : identifiant de connexion (prenom.nom@fqdn) + rapports / workers / workflows métier
 * - email    : contact personnel (accès, réinitialisation, infos candidat)
 */

export type UserMailboxFields = {
  email?: string | null;
  proEmail?: string | null;
};

export function userPersonalMailbox(user: UserMailboxFields): string | null {
  const v = user.email?.trim();
  return v || null;
}

export function userProfessionalMailbox(user: UserMailboxFields): string | null {
  const v = user.proEmail?.trim();
  return v || null;
}

/** Inscription, identifiants, reset mot de passe, infos. */
export function userTransactionalMailbox(user: UserMailboxFields): string | null {
  return userPersonalMailbox(user);
}

/** Rapports pilotage, workers, workflows CRM. */
export function userReportMailbox(user: UserMailboxFields): string | null {
  return userProfessionalMailbox(user);
}
