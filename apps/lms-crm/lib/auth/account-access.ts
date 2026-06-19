/** Contrôle d'accès compte utilisateur (login + espaces). */

export type AccountBlockReason =
  | 'pending'
  | 'inactive'
  | 'blocked'
  | 'banned'
  | 'archived';

export type AccountAccessUser = {
  status: string;
  isTrashed: boolean;
  isProtected?: boolean;
};

export function resolveAccountBlockReason(
  user: AccountAccessUser,
): AccountBlockReason | null {
  if (user.isTrashed) return 'archived';
  if (user.status === 'ACTIVE') return null;
  if (user.status === 'PENDING') return 'pending';
  if (user.status === 'BLOCKED') return 'blocked';
  if (user.status === 'BANNED') return 'banned';
  return 'inactive';
}

export function accountBlockMessage(reason: AccountBlockReason): string {
  switch (reason) {
    case 'archived':
      return 'Ce compte a été archivé. Contactez l’administration pour le réactiver.';
    case 'blocked':
      return 'Votre compte a été suspendu par un administrateur. Contactez l’établissement pour plus d’informations.';
    case 'banned':
      return 'Ce compte est définitivement désactivé.';
    case 'pending':
      return 'Compte en attente d’activation. Vérifiez votre email ou contactez l’établissement.';
    default:
      return 'Votre compte a été désactivé. Contactez l’administration pour le réactiver.';
  }
}

export function accountBlockTitle(reason: AccountBlockReason): string {
  switch (reason) {
    case 'archived':
      return 'Compte archivé';
    case 'blocked':
      return 'Compte suspendu';
    case 'banned':
      return 'Compte banni';
    case 'pending':
      return 'Compte en attente';
    default:
      return 'Compte désactivé';
  }
}

export function assertLoginAllowed(user: AccountAccessUser): void {
  const reason = resolveAccountBlockReason(user);
  if (!reason) return;
  throw new Error(
    JSON.stringify({
      code: 'ACCOUNT_DEACTIVATED',
      reason,
      message: accountBlockMessage(reason),
    }),
  );
}

export function isAccountAccessAllowed(user: AccountAccessUser): boolean {
  return resolveAccountBlockReason(user) === null;
}
