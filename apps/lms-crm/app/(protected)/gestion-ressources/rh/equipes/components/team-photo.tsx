'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/helpers';
import { teamVisualSrc } from '../lib/team-display';

type TeamLike = {
  image?: string | null;
  leader?: { avatar?: string | null } | null;
};

interface TeamPhotoProps {
  team: TeamLike;
  alt?: string;
  className?: string;
  imgClassName?: string;
  fallback?: React.ReactNode;
}

/** Photo équipe avec repli sur l'avatar du chef si le fichier est introuvable. */
export function TeamPhoto({
  team,
  alt = '',
  className,
  imgClassName,
  fallback = null,
}: TeamPhotoProps) {
  const primary = teamVisualSrc(team);
  const leaderFallback = team.leader?.avatar
    ? getAvatarUrl(team.leader.avatar)
    : undefined;

  const [src, setSrc] = useState<string | undefined>(primary);

  useEffect(() => {
    setSrc(teamVisualSrc(team));
  }, [team.image, team.leader?.avatar]);

  if (!src) return <>{fallback}</>;

  return (
    <div className={cn('overflow-hidden', className)}>
      <img
        src={src}
        alt={alt}
        className={cn('size-full', imgClassName)}
        onError={() => {
          if (leaderFallback && src !== leaderFallback) {
            setSrc(leaderFallback);
            return;
          }
          setSrc(undefined);
        }}
      />
    </div>
  );
}
