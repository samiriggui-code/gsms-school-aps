export type DevisWorkflowSettings = {
  defaultValidityDays: number;
  autoExpireDays: number;
  requirePlaquetteBeforeSend: boolean;
  notifyOnAccept: boolean;
};

export const DEFAULT_DEVIS_WORKFLOW_SETTINGS: DevisWorkflowSettings = {
  defaultValidityDays: 30,
  autoExpireDays: 30,
  requirePlaquetteBeforeSend: true,
  notifyOnAccept: true,
};

export function mergeDevisWorkflowSettings(
  value: Record<string, unknown> | null | undefined,
): DevisWorkflowSettings {
  if (!value || typeof value !== 'object') return DEFAULT_DEVIS_WORKFLOW_SETTINGS;
  return {
    defaultValidityDays:
      Number(value.defaultValidityDays) || DEFAULT_DEVIS_WORKFLOW_SETTINGS.defaultValidityDays,
    autoExpireDays:
      Number(value.autoExpireDays) || DEFAULT_DEVIS_WORKFLOW_SETTINGS.autoExpireDays,
    requirePlaquetteBeforeSend:
      value.requirePlaquetteBeforeSend !== undefined
        ? Boolean(value.requirePlaquetteBeforeSend)
        : DEFAULT_DEVIS_WORKFLOW_SETTINGS.requirePlaquetteBeforeSend,
    notifyOnAccept:
      value.notifyOnAccept !== undefined
        ? Boolean(value.notifyOnAccept)
        : DEFAULT_DEVIS_WORKFLOW_SETTINGS.notifyOnAccept,
  };
}
