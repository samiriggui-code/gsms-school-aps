'use client';

import { useState } from 'react';
import { Theater } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/helpers';

type SalleThumbnailProps = {
  imageUrl?: string | null;
  label?: string;
  className?: string;
  imageClassName?: string;
};

export function SalleThumbnail({
  imageUrl,
  label,
  className,
  imageClassName,
}: SalleThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const src = imageUrl?.trim() && !failed ? getAvatarUrl(imageUrl.trim()) : null;

  return (
    <div
      className={cn(
        'overflow-hidden bg-muted/20 flex items-center justify-center shrink-0',
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={label ? `Photo — ${label}` : 'Photo salle'}
          className={cn('h-full w-full object-cover', imageClassName)}
          onError={() => setFailed(true)}
        />
      ) : (
        <Theater className="size-9 text-primary" />
      )}
    </div>
  );
}
