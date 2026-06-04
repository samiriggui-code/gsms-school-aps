'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/helpers';

export function resolveEquipmentAvatar(item: {
  avatar?: string | null;
  metadata?: unknown;
}): string | null {
  if (item.avatar?.trim()) return item.avatar.trim();
  if (item.metadata && typeof item.metadata === 'object' && 'avatar' in item.metadata) {
    const fromMeta = (item.metadata as { avatar?: string }).avatar;
    return fromMeta?.trim() ? fromMeta.trim() : null;
  }
  return null;
}

type EquipmentThumbnailProps = {
  avatar?: string | null;
  metadata?: unknown;
  label?: string;
  className?: string;
  imageClassName?: string;
};

export function EquipmentThumbnail({
  avatar: avatarProp,
  metadata,
  label,
  className,
  imageClassName,
}: EquipmentThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const resolved = avatarProp ?? resolveEquipmentAvatar({ metadata });
  const src = resolved && !failed ? getAvatarUrl(resolved) : null;

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
          alt={label ? `Photo — ${label}` : 'Photo équipement'}
          className={cn('h-full w-full object-cover', imageClassName)}
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}
