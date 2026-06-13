'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Search } from 'lucide-react';
import { ReactNode } from 'react';
import { DocsGroupIcon } from '@/components/docs/docs-group-icon';
import { DocsThemeToggle } from '@/components/docs/docs-theme-toggle';
import { cn } from '@/lib/utils';
import { getDocsBrandName, getDocsNavigation, resolveDocsLocale, slugToTitle } from '@/lib/docs-navigation';
import type { DocsLocale } from '@/lib/docs-types';

function LocaleSwitch({ locale }: { locale: DocsLocale }) {
  const other: DocsLocale = locale === 'fr' ? 'en' : 'fr';
  const href = other === 'en' ? '/docs/en/introduction' : '/docs/introduction';
  return (
    <Link
      href={href}
      className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {other === 'en' ? 'EN' : 'FR'}
    </Link>
  );
}

export function DocsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/docs';
  const slugParts = pathname.replace(/^\/docs\/?/, '').split('/').filter(Boolean);
  const locale = resolveDocsLocale(slugParts);
  const nav = getDocsNavigation(locale);
  const currentSlug = slugParts.join('/') || 'introduction';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-3 px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="size-4" />
            </span>
            <span className="hidden sm:inline">{getDocsBrandName()}</span>
          </Link>
          <div className="mx-auto hidden max-w-md flex-1 md:flex">
            <label className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                disabled
                placeholder={locale === 'en' ? 'Search (coming soon)' : 'Rechercher (bientôt)'}
                className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-9 pr-3 text-sm text-muted-foreground"
              />
            </label>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <LocaleSwitch locale={locale} />
            <DocsThemeToggle />
            <Link
              href="/accueil"
              className="hidden rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted sm:inline"
            >
              CRM
            </Link>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-border bg-muted/15 p-4 md:block lg:w-72">
          <nav className="space-y-6 text-sm">
            {nav.map((group) => (
              <div key={group.group}>
                <p className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <DocsGroupIcon name={group.icon} />
                  {group.group}
                </p>
                <ul className="space-y-0.5">
                  {group.pages.map((slug) => {
                    const active = currentSlug === slug;
                    return (
                      <li key={slug}>
                        <Link
                          href={`/docs/${slug}`}
                          className={cn(
                            'block rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
                            active
                              ? 'bg-primary/10 font-medium text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          )}
                        >
                          {slugToTitle(slug)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-6 py-8 md:px-10 md:py-10 lg:max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
