'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, FolderOpen, Headphones } from 'lucide-react';
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
    title: 'Mon parcours',
    description: 'UV, vidéos et progression de votre formation en ligne.',
    href: '/e-formation?tab=parcours',
    icon: BookOpen,
    cta: 'Voir le parcours',
  },
  {
    title: 'Mon dossier',
    description: 'CNAPS, session, financement et pièces administratives.',
    href: '/mon-dossier',
    icon: FolderOpen,
    cta: 'Ouvrir le dossier',
  },
  {
    title: 'Besoin d’aide ?',
    description: 'Contactez le secrétariat pédagogique via votre dossier candidat.',
    href: '/mon-dossier',
    icon: Headphones,
    cta: 'Obtenir de l’aide',
  },
];

export function EFormationActionTiles({ className }: { className?: string }) {
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
