'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, CalendarDays, GraduationCap, Megaphone, Users } from 'lucide-react';
import { portalLabel, portalMuted, portalSectionTitle } from '@/components/portal/layout/portal-ui';
import { cn } from '@/lib/utils';

type Tile = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  cta: string;
};

const TILES: Tile[] = [
  {
    title: 'Mes formations',
    description: 'Catalogue école où vous intervenez comme formateur référent.',
    href: '/formateur/formations',
    icon: GraduationCap,
    cta: 'Voir les formations',
  },
  {
    title: 'Mes sessions',
    description: 'Sessions catalogue assignées par l’administration.',
    href: '/formateur/sessions',
    icon: CalendarDays,
    cta: 'Voir les sessions',
  },
  {
    title: 'Mes parcours',
    description: 'Contenu e-formation : UV, leçons et quiz liés à vos formations.',
    href: '/formateur/parcours',
    icon: BookOpen,
    cta: 'Gérer le contenu',
  },
  {
    title: 'Mes stagiaires',
    description: 'Progression LMS et effectifs par session assignée.',
    href: '/formateur/stagiaires',
    icon: Users,
    cta: 'Suivre les stagiaires',
  },
];

export function InstructorActionTiles({ className }: { className?: string }) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-3', className)}>
      {TILES.map((tile) => (
        <Link
          key={tile.title}
          href={tile.href}
          className="group flex flex-col rounded-xl border bg-card p-4 shadow-xs transition-all hover:border-primary/25 hover:shadow-sm"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
            <tile.icon className="size-4" />
          </span>
          <h3 className={cn('mt-3', portalSectionTitle)}>{tile.title}</h3>
          <p className={cn('mt-1 flex-1', portalMuted)}>{tile.description}</p>
          <span className={cn('mt-3 font-medium text-primary', portalLabel, 'normal-case tracking-normal')}>
            {tile.cta} →
          </span>
        </Link>
      ))}
    </div>
  );
}

export function InstructorAnnounceTile({ className }: { className?: string }) {
  return (
    <Link
      href="/formateur/annonces"
      className={cn(
        'group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs transition-all hover:border-primary/25 hover:shadow-sm',
        className,
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <Megaphone className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className={portalSectionTitle}>Annonces pédagogiques</h3>
        <p className={cn('mt-0.5', portalMuted)}>
          Publier des messages pour vos stagiaires (session ou formation).
        </p>
      </div>
      <span className={cn('shrink-0 font-medium text-primary', portalLabel, 'normal-case tracking-normal')}>
        Ouvrir →
      </span>
    </Link>
  );
}
