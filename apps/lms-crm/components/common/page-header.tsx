'use client';

import { ReactNode } from 'react';
import { Breadcrumb } from '@/components/layouts/protected/components/breadcrumb';
import { cn } from '@/lib/utils';
import { PageHeroZoneShell, type PageHeroZoneAccent } from '@/components/common/page-hero-zone';

export interface PageHeaderProps {
  /**
   * Titre principal de la page
   */
  title?: string;
  /**
   * Description / phrase d'accroche (même style que `ToolbarDescription`)
   */
  description?: string;
  /**
   * Contenu personnalisé du header (remplace title/description)
   */
  children?: ReactNode;
  /**
   * Afficher le breadcrumb
   * @default false
   */
  showBreadcrumb?: boolean;
  /**
   * Classes CSS personnalisées pour le conteneur
   */
  className?: string;
  /**
   * Classes CSS personnalisées pour le titre
   */
  titleClassName?: string;
  /**
   * Classes CSS personnalisées pour la description
   */
  descriptionClassName?: string;
  /**
   * Même famille visuelle que `PageHeroZone` / `Toolbar` (dégradé léger).
   */
  accent?: PageHeroZoneAccent;
}

/**
 * En-tête de page aligné sur les atterrissages modules (`ToolbarTitle` + `ToolbarDescription`).
 */
export function PageHeader({
  title,
  description,
  children,
  showBreadcrumb = false,
  className,
  titleClassName,
  descriptionClassName,
  accent = 'neutral',
}: PageHeaderProps) {
  const inner = (
    <div className="flex flex-col gap-3">
      {showBreadcrumb && (
        <div className="mb-1">
          <Breadcrumb />
        </div>
      )}

      {children ? (
        children
      ) : (
        <div className="flex min-w-0 flex-col gap-1">
          {title && (
            <h1 className={cn('text-lg font-semibold text-foreground', titleClassName)}>{title}</h1>
          )}
          {description && (
            <p
              className={cn(
                'max-w-3xl text-sm font-normal leading-snug text-muted-foreground',
                descriptionClassName,
              )}
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <PageHeroZoneShell accent={accent} className={className}>
      {inner}
    </PageHeroZoneShell>
  );
}
