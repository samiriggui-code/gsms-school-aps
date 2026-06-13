'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { BookOpen, Bell, ExternalLink, FolderOpen, GraduationCap, Lock, LogOut, Settings, UserCircle, UserPlus } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPresencePicker } from '@/components/common/user-presence-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function PortalUserMenu({ trigger }: { trigger: ReactNode }) {
  const { data: session } = useSession();
  const isStagiaire = session?.user?.roleSlug === 'eleve';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" side="bottom" align="end">
        <div className="p-3 pb-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <UserAvatar
                avatar={session?.user?.avatar}
                className="size-9 shrink-0 rounded-full border border-border"
                fallback="/media/avatars/300-2.png"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{session?.user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
            </div>
            <Badge variant="primary" appearance="light" size="sm" className="shrink-0">
              {isStagiaire ? 'Stagiaire' : 'Candidat'}
            </Badge>
          </div>
          <UserPresencePicker className="px-0 pt-2.5" />
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/mon-dossier/profil" className="flex items-center gap-2">
            <UserCircle className="size-4" />
            Mon profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/mon-dossier/parametres" className="flex items-center gap-2">
            <Settings className="size-4" />
            Paramètres du compte
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/mon-dossier/notifications" className="flex items-center gap-2">
            <Bell className="size-4" />
            Notifications & alertes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/mon-dossier" className="flex items-center gap-2">
            <FolderOpen className="size-4" />
            Mon dossier
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/formation" className="flex items-center gap-2">
            <GraduationCap className="size-4" />
            Ma formation
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/e-formation" className="flex items-center gap-2">
            <BookOpen className="size-4" />
            E-formation
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/mon-dossier/parrainage" className="flex items-center gap-2">
            <UserPlus className="size-4" />
            Parrainer un ami
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/" className="flex items-center gap-2">
            <ExternalLink className="size-4" />
            Site Form&apos;SSI
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={`/lockscreen?email=${encodeURIComponent(session?.user?.email || '')}`}
            className="flex items-center gap-2"
          >
            <Lock className="size-4" />
            Verrouiller
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="p-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="mr-2 size-4" />
            Déconnexion
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
