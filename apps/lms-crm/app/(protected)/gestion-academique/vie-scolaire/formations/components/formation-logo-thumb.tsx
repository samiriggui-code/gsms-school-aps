'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { resolveFormationCatalogLogoUrl } from '../utils/formation-logo-public-url';

type Props = {
  name: string;
  slug: string;
  logoUrl?: string | null;
  /** Conteneur (cercle / carré arrondi). */
  className?: string;
  /** Image : `object-cover` remplit la zone. */
  imageClassName?: string;
};

/** Logo formation (pas formateur) : URL catalogue ou fallback initiales. */
export function FormationLogoThumb({ name, slug, logoUrl, className, imageClassName }: Props) {
  const src = resolveFormationCatalogLogoUrl({ logoUrl, slug });
  if (src) {
    return (
      <div
        className={cn(
          'relative shrink-0 overflow-hidden border-2 border-background bg-muted shadow-md',
          className,
        )}
      >
        <img src={src} alt="" className={cn('size-full object-cover', imageClassName)} />
      </div>
    );
  }
  return (
    <Avatar className={cn('shrink-0 border-2 border-background shadow-md', className)}>
      <AvatarFallback className="text-sm font-semibold">{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
