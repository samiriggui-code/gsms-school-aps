/** Helpers UI présence — module client-safe (aucun import serveur). */

export type UserPresenceStatus = 'online' | 'busy' | 'away' | 'offline';

export function presenceDotClass(status: UserPresenceStatus): string {
  switch (status) {
    case 'online':
      return 'bg-emerald-500';
    case 'busy':
      return 'bg-destructive';
    case 'away':
      return 'bg-amber-500';
    default:
      return 'bg-muted-foreground/50';
  }
}

export function presenceLabel(status: UserPresenceStatus): string {
  switch (status) {
    case 'online':
      return 'En ligne';
    case 'busy':
      return 'Occupé';
    case 'away':
      return 'Absent';
    default:
      return 'Hors ligne';
  }
}

export function presenceDescription(status: UserPresenceStatus): string {
  switch (status) {
    case 'online':
      return 'Disponible pour le chat et les messages.';
    case 'busy':
      return 'Occupé — réponse plus tard.';
    case 'away':
      return 'Absent — indisponible temporairement.';
    default:
      return 'Invisible aux autres utilisateurs.';
  }
}
