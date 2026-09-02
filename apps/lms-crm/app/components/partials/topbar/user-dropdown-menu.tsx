'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import {
  FileText,
  Lock,
  Settings,
  User,
  UserCircle,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import { UserPresenceDot, UserPresencePicker } from '@/components/common/user-presence-picker';
import { useTranslation } from '@/hooks/useTranslation';
import { generalSettings } from '@/config/general.config';

export function UserDropdownMenu({ trigger }: { trigger: ReactNode }) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const profileSecuriteHref = currentUserId
    ? `/securite-configuration/acces/users/${currentUserId}`
    : '/mon-profil';

  const mailto = session?.user?.email ? `mailto:${session.user.email}` : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" side="bottom" align="end">
        <div className="p-3 pb-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="relative shrink-0">
                <UserAvatar
                  avatar={session?.user?.avatar}
                  className="h-9 w-9 rounded-full border border-border"
                  fallback="/media/avatars/300-2.png"
                />
                <UserPresenceDot />
              </div>
              <div className="flex min-w-0 flex-col">
                <Link
                  href="/mon-profil"
                  className="truncate text-sm font-semibold text-mono hover:text-primary"
                >
                  {session?.user.name || ''}
                </Link>
                {mailto ? (
                  <Link
                    href={mailto}
                    className="truncate text-xs text-muted-foreground hover:text-primary"
                    title="Identifiant de connexion"
                  >
                    {session?.user.email || ''}
                  </Link>
                ) : (
                  <span className="truncate text-xs text-muted-foreground" title="Identifiant de connexion">
                    {session?.user.email || ''}
                  </span>
                )}
              </div>
            </div>
            <Badge variant="primary" appearance="light" size="sm" className="shrink-0">
              {t('userMenu.active')}
            </Badge>
          </div>
          <UserPresencePicker className="px-0 pt-2.5" />
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/mon-profil" className="flex items-center gap-2">
            <UserCircle />
            {t('userMenu.publicProfile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/parametres" className="flex items-center gap-2">
            <Settings />
            Paramètres du compte
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
            href={generalSettings.docsLink}
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
