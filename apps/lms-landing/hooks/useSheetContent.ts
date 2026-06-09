import type { TFunction } from '@repo/i18n';
import { useTranslation } from '@/hooks/useTranslation';
import type {
  SheetCertStep,
  SheetPresentation,
  SheetPrerequisiteRow,
  SheetProgramModule,
} from '@/lib/sheet-content-types';

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function sheetPath(base: string, suffix?: string) {
  return suffix ? `${base}.${suffix}` : base;
}

export function getSheetModules(t: TFunction, path: string): SheetProgramModule[] {
  return asArray<SheetProgramModule>(t(`${path}.modules`, { returnObjects: true }));
}

export function getSheetPrerequisites(t: TFunction, path: string): SheetPrerequisiteRow[] {
  return asArray<SheetPrerequisiteRow>(t(`${path}.prerequisites.rows`, { returnObjects: true }));
}

export function getSheetCertSteps(t: TFunction, path: string): SheetCertStep[] {
  return asArray<SheetCertStep>(t(`${path}.certification.steps`, { returnObjects: true }));
}

export function getSheetPresentation(t: TFunction, path: string): SheetPresentation | null {
  const value = t(`${path}.presentation`, { returnObjects: true });
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as SheetPresentation;
}

export function useSheetContent(path: string) {
  const { t } = useTranslation();
  return {
    t,
    path,
    modules: getSheetModules(t, path),
    prerequisites: getSheetPrerequisites(t, path),
    certSteps: getSheetCertSteps(t, path),
    presentation: getSheetPresentation(t, path),
    label: (key: string, params?: Record<string, string | number>) =>
      t(`${path}.${key}`, params as Record<string, string>),
    common: (key: string, params?: Record<string, string | number>) =>
      t(`landing.sheetContent.common.${key}`, params as Record<string, string>),
  };
}
