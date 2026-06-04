'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Badge, BadgeDot } from '@/components/ui/badge';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UserOverview } from './users/user-overview';
import { UserActivity } from './users/user-activity';
import { UserSidebar } from './users/components/user-sidebar';
import { UserPermissions } from './users/user-permissions';
import { UserSettings } from './users/user-settings';
import { UserRoles } from './users/user-roles';
import { UserLogs } from './users/user-logs';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from '@/lib/utils';
import { VIE_SCOLAIRE_SHEET_AUTO } from '@/app/(protected)/gestion-academique/vie-scolaire/constants/sheet-shell-classes';
import { useMaxWidthLg } from '@/hooks/use-max-width-lg';

type UserDetails = {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  status?: string;
  createdAt?: string | Date;
  lastSignInAt?: string | Date | null;
  avatar?: string | null;
  role?: {
    id: string;
    name: string;
    permissions?: any[];
  } | null;
  phone?: string | null;
  company?: string | null;
  userCategory?: string | null;
  qualification?: string | null;
  carteProNumber?: string | null;
};

interface UserDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClick?: () => void;
  user?: UserDetails | null;
}

export function UserDetailsSheet({
  open,
  onOpenChange,
  onEditClick,
  user: initialUser,
}: UserDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const hideActivityTab = useMaxWidthLg();

  useEffect(() => {
    if (hideActivityTab && activeTab === 'activity') {
      setActiveTab('overview');
    }
  }, [hideActivityTab, activeTab]);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-user', initialUser?.id],
    queryFn: async () => {
      const res = await apiFetch(`/api/sections/securite-configuration/acces/users/${initialUser?.id}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    enabled: !!initialUser?.id && open,
  });

  const displayUser = user ? { ...user, avatar: user.avatar || initialUser?.avatar } : initialUser;

  if (!displayUser && !isLoading) return null;

  const getStatusProps = (status: any) => {
    const normalized = typeof status === 'string' ? status.toUpperCase() : '';
    switch (normalized) {
      case 'ACTIVE': return { label: 'Actif', variant: 'success' };
      case 'INACTIVE': return { label: 'Inactif', variant: 'warning' };
      case 'BLOCKED': return { label: 'Bloqué', variant: 'destructive' };
      case 'ABSENT': return { label: 'Absent', variant: 'secondary' };
      default: return { label: status || 'Inconnu', variant: 'outline' };
    }
  };

  const statusProps = getStatusProps(displayUser?.status);
  
  const formatDateTime = (date: Date | string | null | undefined) => {
    if (!date) return 'Jamais';
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: fr });
    } catch {
      return '-';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          VIE_SCOLAIRE_SHEET_AUTO,
          'h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] min-h-0',
        )}
      >
        <SheetHeader className="border-b border-border bg-background px-4 py-3.5 sm:px-5 shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Détails de l'utilisateur</SheetTitle>
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
          <div className="flex justify-between flex-wrap gap-2 border-b border-border bg-background px-4 py-4 sm:px-5 sm:py-5 shrink-0">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                <span className="min-w-0 break-words text-base font-bold leading-tight tracking-tight text-foreground sm:text-lg lg:text-[24px]">
                  {displayUser?.firstName || ''} {displayUser?.lastName || displayUser?.name || 'Utilisateur'}
                </span>
                <Badge size="sm" variant={statusProps.variant as any} appearance="light" className="font-bold uppercase text-[10px] px-2">
                  {statusProps.label}
                </Badge>
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-2 text-2sm">
                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
                  <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">ID</span>
                  <span className="font-bold text-foreground/80">{displayUser?.id ? displayUser.id.substring(0, 8) : '-'}</span>
                </div>
                <BadgeDot className="bg-muted-foreground/30 size-1" />
                <span className="font-normal text-muted-foreground">Qualification:</span>
                <span className="font-bold text-foreground/80">{displayUser?.qualification || '-'}</span>
                <BadgeDot className="bg-muted-foreground/30 size-1" />
                <span className="font-normal text-muted-foreground">Dernière visite:</span>
                <span className="font-semibold text-foreground/80">
                  {formatDateTime(displayUser?.lastSignInAt)}
                </span>
              </div>
            </div>
          </div>

          <ScrollArea
            className="mx-1.5 flex min-h-0 flex-1 flex-col"
            viewportClassName="[&>div]:h-full [&>div>div]:h-full"
          >
            <div className="flex grow flex-wrap px-3.5 lg:flex-nowrap">
              <div className="w-full shrink-0 space-y-4 py-5 lg:w-[280px] lg:pe-5">
                <UserSidebar user={displayUser} />
              </div>

              <div className="min-w-0 grow space-y-5 border-border py-5 lg:border-s lg:ps-5">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0 max-w-full text-sm text-muted-foreground">
                  <TabsList className="mb-2.5 inline-flex h-auto w-auto max-w-full flex-wrap items-center gap-1">
                    <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                    <TabsTrigger value="roles">Rôles</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                    <TabsTrigger value="activity" className="hidden lg:inline-flex">
                      Activité
                    </TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                    <TabsTrigger value="settings">Paramètres</TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-4 min-w-0 max-w-full">
                    <TabsContent value="overview" className="m-0 min-w-0">
                      <UserOverview user={displayUser} />
                    </TabsContent>
                    <TabsContent value="roles" className="m-0 min-w-0">
                      <UserRoles user={displayUser} />
                    </TabsContent>
                    <TabsContent value="permissions" className="m-0 min-w-0 text-sm text-muted-foreground">
                      <UserPermissions user={displayUser} />
                    </TabsContent>
                    <TabsContent value="activity" className="m-0 min-w-0 hidden lg:block">
                      <UserActivity user={displayUser} />
                    </TabsContent>
                    <TabsContent value="logs" className="m-0 min-w-0">
                      <UserLogs user={displayUser} />
                    </TabsContent>
                    <TabsContent value="settings" className="m-0 min-w-0">
                      <UserSettings user={displayUser} />
                    </TabsContent>
                  </div>
                </Tabs>
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
              <a href={`mailto:${displayUser?.email || '#'}`}>Envoyer un email</a>
            </Button>
            <Button size="sm" className="shrink-0" asChild>
              <Link href={`/securite-configuration/acces/users/${displayUser?.id}`}>Voir le profil complet</Link>
            </Button>
            {onEditClick ? (
              <Button size="sm" className="shrink-0" onClick={onEditClick}>
                Modifier
              </Button>
            ) : null}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
