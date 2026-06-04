'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import i18n from 'i18next';

/** Palettes pour icône + badge (+ puces des sous-sections). */
export type MenuCardTone =
  | 'sky'
  | 'violet'
  | 'emerald'
  | 'fuchsia'
  | 'orange'
  | 'amber'
  | 'rose'
  | 'cyan'
  | 'indigo'
  | 'teal';

const TONE_STYLES: Record<
  MenuCardTone,
  { wrap: string; icon: string; badge: string; dot: string }
> = {
  sky: {
    wrap: 'bg-sky-500/15 border-sky-400/45 shadow-sm shadow-sky-500/10 dark:bg-sky-950/45 dark:border-sky-500/35',
    icon: 'text-sky-600 dark:text-sky-400',
    badge:
      'border-sky-500/45 bg-gradient-to-r from-sky-500/30 to-sky-600/20 text-sky-950 dark:from-sky-500/35 dark:to-sky-600/25 dark:text-sky-50',
    dot: 'bg-sky-500 dark:bg-sky-400',
  },
  violet: {
    wrap: 'bg-violet-500/15 border-violet-400/45 shadow-sm shadow-violet-500/10 dark:bg-violet-950/45 dark:border-violet-500/35',
    icon: 'text-violet-600 dark:text-violet-400',
    badge:
      'border-violet-500/45 bg-gradient-to-r from-violet-500/30 to-violet-600/20 text-violet-950 dark:from-violet-500/35 dark:to-violet-600/25 dark:text-violet-50',
    dot: 'bg-violet-500 dark:bg-violet-400',
  },
  emerald: {
    wrap: 'bg-emerald-500/15 border-emerald-400/45 shadow-sm shadow-emerald-500/10 dark:bg-emerald-950/45 dark:border-emerald-500/35',
    icon: 'text-emerald-600 dark:text-emerald-400',
    badge:
      'border-emerald-500/45 bg-gradient-to-r from-emerald-500/30 to-emerald-600/20 text-emerald-950 dark:from-emerald-500/35 dark:to-emerald-600/25 dark:text-emerald-50',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
  },
  fuchsia: {
    wrap: 'bg-fuchsia-500/15 border-fuchsia-400/45 shadow-sm shadow-fuchsia-500/10 dark:bg-fuchsia-950/45 dark:border-fuchsia-500/35',
    icon: 'text-fuchsia-600 dark:text-fuchsia-400',
    badge:
      'border-fuchsia-500/45 bg-gradient-to-r from-fuchsia-500/30 to-fuchsia-600/20 text-fuchsia-950 dark:from-fuchsia-500/35 dark:to-fuchsia-600/25 dark:text-fuchsia-50',
    dot: 'bg-fuchsia-500 dark:bg-fuchsia-400',
  },
  orange: {
    wrap: 'bg-orange-500/15 border-orange-400/45 shadow-sm shadow-orange-500/10 dark:bg-orange-950/45 dark:border-orange-500/35',
    icon: 'text-orange-600 dark:text-orange-400',
    badge:
      'border-orange-500/45 bg-gradient-to-r from-orange-500/30 to-orange-600/20 text-orange-950 dark:from-orange-500/35 dark:to-orange-600/25 dark:text-orange-50',
    dot: 'bg-orange-500 dark:bg-orange-400',
  },
  amber: {
    wrap: 'bg-amber-500/15 border-amber-400/45 shadow-sm shadow-amber-500/10 dark:bg-amber-950/45 dark:border-amber-500/35',
    icon: 'text-amber-700 dark:text-amber-400',
    badge:
      'border-amber-500/45 bg-gradient-to-r from-amber-500/30 to-amber-600/20 text-amber-950 dark:from-amber-500/35 dark:to-amber-600/25 dark:text-amber-50',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  rose: {
    wrap: 'bg-rose-500/15 border-rose-400/45 shadow-sm shadow-rose-500/10 dark:bg-rose-950/45 dark:border-rose-500/35',
    icon: 'text-rose-600 dark:text-rose-400',
    badge:
      'border-rose-500/45 bg-gradient-to-r from-rose-500/30 to-rose-600/20 text-rose-950 dark:from-rose-500/35 dark:to-rose-600/25 dark:text-rose-50',
    dot: 'bg-rose-500 dark:bg-rose-400',
  },
  cyan: {
    wrap: 'bg-cyan-500/15 border-cyan-400/45 shadow-sm shadow-cyan-500/10 dark:bg-cyan-950/45 dark:border-cyan-500/35',
    icon: 'text-cyan-600 dark:text-cyan-400',
    badge:
      'border-cyan-500/45 bg-gradient-to-r from-cyan-500/30 to-cyan-600/20 text-cyan-950 dark:from-cyan-500/35 dark:to-cyan-600/25 dark:text-cyan-50',
    dot: 'bg-cyan-500 dark:bg-cyan-400',
  },
  indigo: {
    wrap: 'bg-indigo-500/15 border-indigo-400/45 shadow-sm shadow-indigo-500/10 dark:bg-indigo-950/45 dark:border-indigo-500/35',
    icon: 'text-indigo-600 dark:text-indigo-400',
    badge:
      'border-indigo-500/45 bg-gradient-to-r from-indigo-500/30 to-indigo-600/20 text-indigo-950 dark:from-indigo-500/35 dark:to-indigo-600/25 dark:text-indigo-50',
    dot: 'bg-indigo-500 dark:bg-indigo-400',
  },
  teal: {
    wrap: 'bg-teal-500/15 border-teal-400/45 shadow-sm shadow-teal-500/10 dark:bg-teal-950/45 dark:border-teal-500/35',
    icon: 'text-teal-600 dark:text-teal-400',
    badge:
      'border-teal-500/45 bg-gradient-to-r from-teal-500/30 to-teal-600/20 text-teal-950 dark:from-teal-500/35 dark:to-teal-600/25 dark:text-teal-50',
    dot: 'bg-teal-500 dark:bg-teal-400',
  },
};

interface MenuCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  badge?: string;
  /** Identifiants des enfants (ex. slugs de modules) — affichés via `subSectionLabels` ou formatés. */
  subSections?: string[];
  /** Libellés affichés pour chaque puce (même ordre que `subSections`). */
  subSectionLabels?: string[];
  backgroundImage?: string;
  moduleKey?: string;
  /** Couleur icône + badge (+ puces). Sans ton, style primaire existant. */
  tone?: MenuCardTone;
}

// Fonction pour formater les noms de sections en titres lisibles
const formatSectionName = (section: string): string => {
  return section
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/** Badge « N page(s) » pour les cartes module (atterrissage section). */
export function menuCardPagesBadge(pageCount: number): string {
  return i18n.t('menuCard.pages', { count: pageCount });
}

export const MenuCard = ({
  title,
  description,
  icon: Icon,
  path,
  badge,
  subSections,
  subSectionLabels,
  backgroundImage = 'bg-3',
  moduleKey,
  tone,
}: MenuCardProps) => {
  const { t } = useTranslation();
  const toneStyles = tone ? TONE_STYLES[tone] : null;

  return (
    <Fragment>
      <style>
        {`
          .menu-card-bg-${backgroundImage} {
            background-image: url('${toAbsoluteUrl(`/media/images/2600x1600/${backgroundImage}.png`)}');
          }
          .dark .menu-card-bg-${backgroundImage} {
            background-image: url('${toAbsoluteUrl(`/media/images/2600x1600/${backgroundImage}-dark.png`)}');
          }
        `}
      </style>

      <Card className="border flex flex-col" data-module-key={moduleKey}>
        <CardContent
          className={`p-5 lg:p-8 flex-1 bg-cover rtl:bg-[left_top_-1.7rem] bg-[right_top_-1.7rem] bg-no-repeat menu-card-bg-${backgroundImage}`}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className={cn(
                'flex items-center justify-center size-12 rounded-xl border',
                toneStyles ? toneStyles.wrap : 'bg-primary/10 border-primary/20',
              )}
            >
              <Icon className={cn('size-6', toneStyles ? toneStyles.icon : 'text-primary')} />
            </div>
            {badge && (
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-md border px-2.5 py-1 font-bold uppercase tracking-wider text-[10px]',
                  toneStyles ? toneStyles.badge : 'bg-primary/15 text-primary border-primary/25 dark:bg-primary/20 dark:text-primary dark:border-primary/30',
                )}
              >
                {badge}
              </span>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{description}</p>
            {subSections && subSections.length > 0 && (
              <div className="space-y-1">
                {subSections.slice(0, 4).map((section, index) => (
                  <div key={index} className="flex items-center text-xs text-muted-foreground">
                    <div
                      className={cn(
                        'size-1 rounded-full mr-2 flex-shrink-0',
                        toneStyles ? toneStyles.dot : 'bg-muted-foreground',
                      )}
                    />
                    <span>{subSectionLabels?.[index] ?? formatSectionName(section)}</span>
                  </div>
                ))}
                {subSections.length > 4 && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <div
                      className={cn(
                        'size-1 rounded-full mr-2 flex-shrink-0',
                        toneStyles ? toneStyles.dot : 'bg-muted-foreground',
                      )}
                    />
                    <span>{t('menuCard.moreSections', { count: subSections.length - 4 })}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="px-5 lg:px-8 py-4 flex items-center justify-center min-h-[80px]">
          <Button
            asChild
            variant="outline"
            className={cn(
              'w-full',
              tone === 'sky' && 'text-sky-700 border-sky-300 hover:bg-sky-500/10 dark:text-sky-300 dark:border-sky-600',
              tone === 'violet' && 'text-violet-700 border-violet-300 hover:bg-violet-500/10 dark:text-violet-300 dark:border-violet-600',
              tone === 'emerald' && 'text-emerald-700 border-emerald-300 hover:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-600',
              tone === 'fuchsia' && 'text-fuchsia-700 border-fuchsia-300 hover:bg-fuchsia-500/10 dark:text-fuchsia-300 dark:border-fuchsia-600',
              tone === 'orange' && 'text-orange-700 border-orange-300 hover:bg-orange-500/10 dark:text-orange-300 dark:border-orange-600',
              tone === 'amber' && 'text-amber-800 border-amber-300 hover:bg-amber-500/10 dark:text-amber-300 dark:border-amber-600',
              tone === 'rose' && 'text-rose-700 border-rose-300 hover:bg-rose-500/10 dark:text-rose-300 dark:border-rose-600',
              tone === 'cyan' && 'text-cyan-700 border-cyan-300 hover:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-600',
              tone === 'indigo' && 'text-indigo-700 border-indigo-300 hover:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-600',
              tone === 'teal' && 'text-teal-700 border-teal-300 hover:bg-teal-500/10 dark:text-teal-300 dark:border-teal-600',
            )}
          >
            <Link href={path}>
              {t('menuCard.access')}
              <ArrowRight className="size-4 ml-2" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Fragment>
  );
};
