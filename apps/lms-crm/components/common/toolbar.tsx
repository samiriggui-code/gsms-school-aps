import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PageHeroZoneShell, type PageHeroZoneAccent } from '@/components/common/page-hero-zone';

export interface ToolbarActionsProps {
  children?: ReactNode;
  className?: string;
}

export interface ToolbarProps {
  children?: ReactNode;
  /**
   * `hero` : même carte dégradée que `PageHeroZone` (défaut, toutes les pages outil).
   * `plain` : ancien bandeau ligne simple — ex. sous une `PageHeroZone` déjà affichée.
   */
  surface?: 'hero' | 'plain';
  accent?: PageHeroZoneAccent;
  className?: string;
}

export interface ToolbarTitleProps {
  children: ReactNode;
  className?: string;
}

export interface ToolbarHeadingProps {
  className?: string;
  children: ReactNode;
}

export const Toolbar = ({
  children,
  surface = 'hero',
  accent = 'slate-primary',
  className,
}: ToolbarProps) => {
  if (children == null || children === false) {
    return null;
  }

  if (surface === 'plain') {
    return (
      <div
        className={cn(
          'mb-5 flex min-w-0 grow flex-wrap items-center justify-between gap-x-2.5 gap-y-2 pb-5 md:mb-6',
          className,
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <PageHeroZoneShell accent={accent} className={className}>
      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-x-2.5 md:gap-y-2">
        {children}
      </div>
    </PageHeroZoneShell>
  );
};

export const ToolbarHeading = ({
  children,
  className,
}: ToolbarHeadingProps) => {
  return (
    <div className={cn('flex min-w-0 flex-col flex-wrap gap-1', className)}>
      {children}
    </div>
  );
};

export const ToolbarTitle = ({ className, children }: ToolbarTitleProps) => {
  return (
    <h1 className={cn('font-semibold text-foreground text-lg', className)}>
      {children}
    </h1>
  );
};

export interface ToolbarDescriptionProps {
  children: ReactNode;
  className?: string;
}

/** Sous-titre / phrase d’accroche sous le titre de page (aligné sur les atterrissages type Compagnie). */
export const ToolbarDescription = ({ className, children }: ToolbarDescriptionProps) => {
  return (
    <p className={cn('max-w-3xl text-sm font-normal leading-snug text-muted-foreground', className)}>
      {children}
    </p>
  );
};

export const ToolbarActions = ({ children, className }: ToolbarActionsProps) => {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5 self-start md:mt-1 lg:gap-3.5', className)}>
      {children}
    </div>
  );
};
