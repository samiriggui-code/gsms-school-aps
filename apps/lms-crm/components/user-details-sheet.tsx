'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { VIE_SCOLAIRE_SHEET_AUTO } from '@/app/(protected)/gestion-academique/vie-scolaire/constants/sheet-shell-classes';
import { useMaxWidthLg } from '@/hooks/use-max-width-lg';
import { userTransactionalMailbox } from '@/lib/user-email-routing';
import type { User, UserSheetSeed } from '@/app/models/user';
import { UserIamHeadline } from '@/components/users/user-iam-headline';
import { IamUserSheetSidebar } from '@/components/users/iam-user-sheet-sidebar';
import { UserIamTabs, type UserIamTabKey } from '@/components/users/user-iam-tabs';

interface UserDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClick?: (user: UserSheetSeed) => void;
  user?: UserSheetSeed | null;
}

export function UserDetailsSheet({
  open,
  onOpenChange,
  onEditClick,
  user: initialUser,
}: UserDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState<UserIamTabKey>('profil');
  const hideJournalOnNarrow = useMaxWidthLg();

  useEffect(() => {
    if (hideJournalOnNarrow && activeTab === 'journal') {
      setActiveTab('profil');
    }
  }, [hideJournalOnNarrow, activeTab]);

  useEffect(() => {
    if (!open) setActiveTab('profil');
  }, [open]);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-user', initialUser?.id],
    queryFn: async () => {
      const res = await apiFetch(`/api/sections/securite-configuration/acces/users/${initialUser?.id}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json() as Promise<User>;
    },
    enabled: !!initialUser?.id && open,
  });

  const displayUser = (user
    ? { ...user, avatar: user.avatar || initialUser?.avatar }
    : initialUser) as User | undefined;

  if (!displayUser && !isLoading) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          VIE_SCOLAIRE_SHEET_AUTO,
          'h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] min-h-0',
        )}
      >
        <SheetHeader className="border-b border-border bg-background px-4 py-3.5 sm:px-5 shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
            Compte utilisateur · IAM
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
          <UserIamHeadline user={displayUser ?? undefined} isLoading={isLoading && !displayUser} />

          <ScrollArea
            className="mx-1.5 flex min-h-0 flex-1 flex-col"
            viewportClassName="[&>div]:h-full [&>div>div]:h-full"
          >
            <div className="flex grow flex-wrap px-3.5 lg:flex-nowrap">
              <div className="w-full shrink-0 space-y-4 py-5 lg:w-[280px] lg:pe-5">
                {displayUser ? <IamUserSheetSidebar user={displayUser} /> : null}
              </div>

              <div className="min-w-0 grow space-y-5 border-border py-5 lg:border-s lg:ps-5">
                {displayUser ? (
                  <UserIamTabs
                    user={displayUser}
                    value={activeTab}
                    onValueChange={setActiveTab}
                    hideJournalOnNarrow={hideJournalOnNarrow}
                  />
                ) : null}
              </div>
            </div>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="flex shrink-0 flex-row flex-wrap items-center gap-2 border-t border-border bg-background p-4 pb-4 sm:p-5 sm:gap-2.5">
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2.5 [&::-webkit-scrollbar]:hidden">
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <a href={`mailto:${displayUser ? userTransactionalMailbox(displayUser) || '#' : '#'}`}>
                Envoyer un email
              </a>
            </Button>
            <Button size="sm" className="shrink-0" asChild>
              <Link href={`/securite-configuration/acces/users/${displayUser?.id}`}>
                Fiche IAM complète
              </Link>
            </Button>
            {onEditClick && displayUser ? (
              <Button size="sm" className="shrink-0" onClick={() => onEditClick(displayUser)}>
                Modifier le compte
              </Button>
            ) : null}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
