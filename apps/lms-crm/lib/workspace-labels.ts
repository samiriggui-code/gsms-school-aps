import type { useTranslation } from '@/hooks/useTranslation';

type TFn = ReturnType<typeof useTranslation>['t'];

export function workspaceStatLabel(
  t: TFn,
  workspaceKey: string,
  statKey: string,
  field: 'label' | 'subtitle',
  params?: Record<string, string | number>,
  fallback = '',
) {
  return t(`workspace.${workspaceKey}.stats.${statKey}.${field}`, {
    ...params,
    defaultValue: fallback,
  });
}

export function workspaceColumnLabel(
  t: TFn,
  workspaceKey: string,
  columnKey: string,
  fallback = '',
) {
  return t(`workspace.${workspaceKey}.columns.${columnKey}`, { defaultValue: fallback });
}

export function workspaceFieldLabel(
  t: TFn,
  workspaceKey: string,
  fieldName: string,
  fallback = '',
) {
  return t(`workspace.${workspaceKey}.fields.${fieldName}`, { defaultValue: fallback });
}

export function workspaceStatusLabel(
  t: TFn,
  workspaceKey: string,
  statusKey: string,
  fallback = '',
) {
  return t(`workspace.${workspaceKey}.status.${statusKey}`, { defaultValue: fallback });
}

export function workspaceActionLabel(
  t: TFn,
  workspaceKey: string,
  actionKey: string,
  fallback = '',
) {
  return t(`workspace.${workspaceKey}.actions.${actionKey}`, { defaultValue: fallback });
}
