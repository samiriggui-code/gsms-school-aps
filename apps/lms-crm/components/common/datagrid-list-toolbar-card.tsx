import type { ReactNode } from 'react';
import { Card, CardHeader } from '@repo/ui/card';
import { cn } from '@/lib/utils';

type DatagridListToolbarCardProps = {
  title: string;
  description?: string;
  /** Recherche, filtres, sync, toggle vue — à droite ou sous le titre. */
  actions?: ReactNode;
  /** Contenu additionnel sous la ligne principale (onglets locaux, recherche pleine largeur). */
  children?: ReactNode;
  className?: string;
};

/** Zone ④ — barre liste RH (Card séparée au-dessus du DataGrid). */
export function DatagridListToolbarCard({
  title,
  description,
  actions,
  children,
  className,
}: DatagridListToolbarCardProps) {
  return (
    <Card className={cn('mb-5 border-border shadow-none', className)}>
      <CardHeader className="space-y-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-1">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">{actions}</div>
          ) : null}
        </div>
        {children}
      </CardHeader>
    </Card>
  );
}
