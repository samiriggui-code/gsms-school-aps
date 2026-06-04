import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const ACCENT = {
  'violet-sky': {
    shell: 'from-violet-500/5 via-background to-sky-500/5',
    eyebrow: 'text-violet-600 dark:text-violet-400',
  },
  'slate-primary': {
    shell: 'from-slate-500/5 via-background to-primary/5',
    eyebrow: 'text-primary',
  },
  neutral: {
    shell: 'from-muted/15 via-background to-muted/25',
    eyebrow: 'text-muted-foreground',
  },
} as const;

export type PageHeroZoneAccent = keyof typeof ACCENT;

/** Conteneur visuel (bordure + dégradé) partagé avec `Toolbar` en mode hero. */
export function PageHeroZoneShell({
  accent = 'neutral',
  className,
  children,
}: {
  accent?: PageHeroZoneAccent;
  className?: string;
  children: ReactNode;
}) {
  const tone = ACCENT[accent];
  return (
    <div
      className={cn(
        'mb-5 rounded-xl border border-border/60 bg-gradient-to-br px-5 py-6 md:mb-6 md:px-8 md:py-8',
        tone.shell,
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface PageHeroZoneProps {
  /** Titre court au-dessus du h1 (souvent en majuscules). */
  eyebrow?: ReactNode;
  /** Classes de la pastille / surlignage (remplace la couleur liée à `accent` pour l’eyebrow). */
  eyebrowClassName?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Boutons ou liens à droite (desktop). */
  actions?: ReactNode;
  /** Dégradé de fond + couleur d’eyebrow par défaut. */
  accent?: PageHeroZoneAccent;
  className?: string;
  rowClassName?: string;
  descriptionClassName?: string;
}

/**
 * Zone d’en-tête de page (carte arrondie, surtitre, titre, description, actions).
 * Un seul composant à importer sur chaque page : tu passes le texte en props, pas besoin de dupliquer le fichier.
 */
export function PageHeroZone({
  eyebrow,
  eyebrowClassName,
  title,
  description,
  actions,
  accent = 'neutral',
  className,
  rowClassName,
  descriptionClassName,
}: PageHeroZoneProps) {
  const tone = ACCENT[accent];

  return (
    <PageHeroZoneShell accent={accent} className={className}>
      <div
        className={cn(
          'flex flex-col gap-4 md:flex-row md:items-start md:justify-between',
          rowClassName,
        )}
      >
        <div className="min-w-0">
          {eyebrow != null && eyebrow !== '' ? (
            <p
              className={cn(
                'text-[11px] font-bold uppercase tracking-[0.2em]',
                eyebrowClassName ?? tone.eyebrow,
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={cn(
              'text-lg font-semibold tracking-tight text-foreground',
              eyebrow != null && eyebrow !== '' && 'mt-1',
            )}
          >
            {title}
          </h1>
          {description != null && description !== '' ? (
            <div
              className={cn(
                'mt-2 max-w-3xl text-sm leading-snug text-muted-foreground',
                descriptionClassName,
              )}
            >
              {typeof description === 'string' ? <p>{description}</p> : description}
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2 self-start md:mt-1">{actions}</div> : null}
      </div>
    </PageHeroZoneShell>
  );
}
