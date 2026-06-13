import docsConfig from '@/content/docs/docs.json';
import type { DocsLocale, DocsNavGroup } from '@/lib/docs-types';

type DocsJson = {
  navigation: {
    languages: Array<{
      language: string;
      tabs?: Array<{
        groups?: Array<{ group: string; icon?: string; pages: string[] }>;
      }>;
    }>;
  };
};

const config = docsConfig as DocsJson;

export function getDocsNavigation(locale: DocsLocale = 'fr'): DocsNavGroup[] {
  const lang = config.navigation.languages.find((l) => l.language === locale);
  const tab = lang?.tabs?.[0];
  return (tab?.groups ?? []).map((g) => ({
    group: g.group,
    icon: g.icon,
    pages: g.pages,
  }));
}

export function resolveDocsLocale(slugParts: string[]): DocsLocale {
  return slugParts[0] === 'en' ? 'en' : 'fr';
}

export function slugToTitle(slug: string) {
  const last = slug.split('/').pop() ?? slug;
  return last.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export function getDocsBrandName() {
  return (docsConfig as { name?: string }).name ?? "Guide FORM'SSI";
}
