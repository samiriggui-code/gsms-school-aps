'use client';

import { useState } from 'react';
import { Check, UserIcon } from 'lucide-react';
import { getAvatarUrl, getInitials } from '@/lib/helpers';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { User } from '@/app/models/user';

interface UserHeroProps {
  user: User | undefined;
  isLoading: boolean;
  /** Aligné sur le volet gauche des fiches RH (sheet « page »). */
  variant?: 'inline' | 'sidebar';
}

const UserHero = ({ user, isLoading, variant = 'inline' }: UserHeroProps) => {
  const LoadingSidebar = () => (
    <div className="space-y-4 py-5 lg:pe-5">
      <Skeleton className="h-[240px] w-full rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );

  const Loading = () =>
    variant === 'sidebar' ? (
      <LoadingSidebar />
    ) : (
      <div className="flex items-center gap-5 mb-5">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>
    );

  const Content = () => {
    const { copyToClipboard } = useCopyToClipboard();
    const [showCopied, setShowCopied] = useState(false);

    if (!user) return null;

    const handleUserIdCopy = () => {
      copyToClipboard(user.id);
      setShowCopied(true);
      setTimeout(() => {
        setShowCopied(false);
      }, 2000);
    };

    const avatarUrl = user.avatar ? getAvatarUrl(user.avatar) : null;

    if (variant === 'sidebar') {
      return (
        <div className="w-full shrink-0 space-y-4 py-5 lg:pe-5">
          <div className="relative flex h-[240px] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/10">
            {avatarUrl ?
              <img
                src={avatarUrl}
                alt={user.name || ''}
                className="size-full object-cover"
              />
            : <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <UserIcon className="size-10 opacity-60" />
                <span className="text-xs font-medium">Pas de photo</span>
              </div>
            }
          </div>
          <div className="space-y-3 text-2sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Nom</span>
              <span className="max-w-[150px] truncate font-semibold text-foreground">{user.name}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">E-mail</span>
              <span className="max-w-[150px] truncate font-semibold text-foreground">{user.email}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Rôle</span>
              <span className="max-w-[150px] truncate font-semibold text-foreground">{user.role?.name ?? '—'}</span>
            </div>
            <TooltipProvider>
              <Tooltip delayDuration={50}>
                <TooltipTrigger className="w-full cursor-pointer text-start" type="button" onClick={handleUserIdCopy}>
                  <Badge variant="secondary" className="w-full justify-center gap-1.5 px-2 py-1">
                    <span className="truncate text-[11px]">ID&nbsp;: {user.id}</span>
                    {showCopied && <Check className="text-success size-3 shrink-0" />}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Copier</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-5 mb-5">
        <Avatar className="h-14 w-14">
          {avatarUrl ?
            <AvatarImage src={avatarUrl} alt={user.name || ''} />
          : <AvatarFallback className="text-xl">{getInitials(user.name || user.email)}</AvatarFallback>}
        </Avatar>
        <div className="space-y-px">
          <div className="font-medium text-base">{user.name}</div>
          <div className="text-muted-foreground text-sm">{user.email}</div>
          <div>
            <TooltipProvider>
              <Tooltip delayDuration={50}>
                <TooltipTrigger className="cursor-pointer">
                  <Badge variant="secondary" className="gap-1.5 px-2 py-0.5" onClick={handleUserIdCopy}>
                    <span>User ID: {user.id}</span>
                    {showCopied && <Check className="text-success size-3" />}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Copier</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    );
  };

  return isLoading || !user ? <Loading /> : <Content />;
};

export default UserHero;
