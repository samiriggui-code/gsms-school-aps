'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import {
  FileText,
  Lock,
  User,
  UserCircle,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { getAvatarUrl } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';

export function UserDropdownMenu({ trigger }: { trigger: ReactNode }) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const profileSecuriteHref = currentUserId
    ? `/securite-configuration/acces/users/${currentUserId}`
    : '/securite-configuration/acces/user-profile';

  const avatarSrc = getAvatarUrl(session?.user?.avatar ?? null, '/media/avatars/300-2.png');
  const mailto = session?.user?.email ? `mailto:${session.user.email}` : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" side="bottom" align="end">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <img
                key={avatarSrc}
                className="w-9 h-9 rounded-full border border-border object-cover"
                src={avatarSrc}
                alt=""
              />
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div className="flex flex-col min-w-0">
              <Link
                href="/mon-profil"
                className="text-sm text-mono hover:text-primary font-semibold truncate"
              >
                {session?.user.name || ''}
              </Link>
              {mailto ? (
                <Link
                  href={mailto}
                  className="text-xs text-muted-foreground hover:text-primary truncate"
                >
                  {session?.user.email || ''}
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground truncate">
                  {session?.user.email || ''}
                </span>
              )}
            </div>
          </div>
          <Badge variant="primary" appearance="light" size="sm">
            {t('userMenu.active')}
          </Badge>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/mon-profil" className="flex items-center gap-2">
            <UserCircle />
            {t('userMenu.publicProfile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={profileSecuriteHref} className="flex items-center gap-2">
            <User />
            {t('userMenu.profile')}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href={`/lockscreen?email=${encodeURIComponent(session?.user.email || '')}&avatar=${encodeURIComponent(session?.user.avatar || '')}`}
            className="flex items-center gap-2"
          >
            <Lock />
            {t('userMenu.lockScreen')}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="https://devs.keenthemes.com"
            className="flex items-center gap-2"
          >
            <FileText />
            {t('userMenu.supportForum')}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="p-2 mt-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => signOut()}
          >
            {t('userMenu.signOut')}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
