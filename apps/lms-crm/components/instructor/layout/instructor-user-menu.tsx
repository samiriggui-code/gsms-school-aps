'use client';



import { ReactNode } from 'react';

import Link from 'next/link';

import { Bell, ExternalLink, Lock, LogOut, Settings, UserCircle } from 'lucide-react';

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



export function InstructorUserMenu({ trigger }: { trigger: ReactNode }) {

  const { data: session } = useSession();



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

                  className="size-9 shrink-0 rounded-full border border-border"

                  fallback="/media/avatars/300-1.png"

                />

                <UserPresenceDot />

              </div>

              <div className="min-w-0 flex-1">

                <Link

                  href="/formateur/profil"

                  className="truncate text-sm font-semibold leading-tight hover:text-primary"

                >

                  {session?.user?.name}

                </Link>

                <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>

              </div>

            </div>

            <Badge variant="default" appearance="light" size="sm" className="shrink-0">

              Formateur

            </Badge>

          </div>

          <UserPresencePicker className="px-0 pt-2.5" />

        </div>



        <DropdownMenuSeparator />



        <DropdownMenuItem asChild>

          <Link href="/formateur/profil" className="flex items-center gap-2">

            <UserCircle className="size-4" />

            Mon profil

          </Link>

        </DropdownMenuItem>

        <DropdownMenuItem asChild>

          <Link href="/formateur/parametres" className="flex items-center gap-2">

            <Settings className="size-4" />

            Paramètres du compte

          </Link>

        </DropdownMenuItem>

        <DropdownMenuItem asChild>

          <Link href="/formateur/notifications" className="flex items-center gap-2">

            <Bell className="size-4" />

            Notifications & alertes

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


