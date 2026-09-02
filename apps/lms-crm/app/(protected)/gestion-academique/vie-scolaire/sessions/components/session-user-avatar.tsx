'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar';
import { getAvatarUrl, getInitials } from '@/lib/helpers';
import { cn } from '@/lib/utils';

export function SessionUserAvatar({
  name,
  email,
  avatar,
  className,
  sizeClassName = 'size-9',
  /** Avatar visuellement carré (coins arrondis), ex. carte stats formateur. */
  square = false,
}: {
  name: string | null;
  email: string;
  avatar?: string | null;
  className?: string;
  /** Classes Tailwind pour la taille (ex. size-8, size-10, size-20). */
  sizeClassName?: string;
  square?: boolean;
}) {
  const label = name?.trim() || email;
  const hasPhoto = Boolean(avatar?.trim());
  const radius = square ? 'rounded-lg' : 'rounded-full';
  return (
    <Avatar
      className={cn(
        sizeClassName,
        'border border-border bg-muted/40 shadow-sm',
        square && 'overflow-hidden',
        radius,
        className,
      )}
    >
      {hasPhoto ? (
        <AvatarImage src={getAvatarUrl(avatar)} alt={label} className={cn(square ? 'rounded-lg' : 'rounded-full')} />
      ) : null}
      <AvatarFallback className={cn('text-xs font-semibold', radius)}>{getInitials(label)}</AvatarFallback>
    </Avatar>
  );
}
