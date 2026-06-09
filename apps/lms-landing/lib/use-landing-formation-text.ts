import type { TFunction } from '@repo/i18n';

export type TranslatedFormation = {
  id: string;
  category: string;
  featured?: boolean;
  name: string;
  tag: string;
  duration: string;
  description: string;
  modules: string[];
  outcomes: string[];
};

export function translateFormation(
  t: TFunction,
  id: string,
  category: string,
  featured?: boolean,
): TranslatedFormation {
  const base = `landing.pricing.formations.${id}`;
  const modules = t(`${base}.modules`, { returnObjects: true }) as string[] | string;
  const outcomes = t(`${base}.outcomes`, { returnObjects: true }) as string[] | string;

  return {
    id,
    category,
    featured,
    name: t(`${base}.name`),
    tag: t(`${base}.tag`),
    duration: t(`${base}.duration`),
    description: t(`${base}.description`),
    modules: Array.isArray(modules) ? modules : [],
    outcomes: Array.isArray(outcomes) ? outcomes : [],
  };
}
