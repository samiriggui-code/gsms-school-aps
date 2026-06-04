const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  IN_USE: 'En service',
  MAINTENANCE: 'En maintenance',
  OUT_OF_SERVICE: 'Hors service',
};

export function getEquipmentStatusLabel(status: string): string {
  return STATUS_LABELS[status?.toUpperCase()] || status || 'Inconnu';
}
