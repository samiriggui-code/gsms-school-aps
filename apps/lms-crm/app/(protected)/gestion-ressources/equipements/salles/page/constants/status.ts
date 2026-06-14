import type { VenueRoomRow } from '../types';

export function getSalleStatusProps(status: VenueRoomRow['status']) {
  switch (status) {
    case 'AVAILABLE':
      return { label: 'Disponible', variant: 'success' as const };
    case 'RESERVED':
      return { label: 'Réservée', variant: 'warning' as const };
    case 'MAINTENANCE':
      return { label: 'Maintenance', variant: 'destructive' as const };
    case 'INACTIVE':
    default:
      return { label: 'Inactive', variant: 'secondary' as const };
  }
}
