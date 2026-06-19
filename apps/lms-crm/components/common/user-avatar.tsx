'use client';

import { useEffect, useState } from 'react';
import { getAvatarUrl, toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';

const DEFAULT_AVATAR = '/media/app/mini-logo-circle-primary.svg';

type UserAvatarProps = {
  avatar?: string | null;
  className?: string;
  alt?: string;
  fallback?: string;
};

export function UserAvatar({
  avatar,
  className,
  alt = '',
  fallback = DEFAULT_AVATAR,
}: UserAvatarProps) {
  const resolved = getAvatarUrl(avatar, fallback);
  const [src, setSrc] = useState(resolved);

  useEffect(() => {
    setSrc(resolved);
  }, [resolved]);

  return (
    <img
      className={cn('object-cover', className)}
      src={src}
      alt={alt}
      onError={() => setSrc(toAbsoluteUrl(fallback))}
    />
  );
}
