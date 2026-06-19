'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ShieldAlert, UserRound } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { UserRole } from '@/app/models/user';
import { permissionSlugsFromRole } from '@/components/iam/role-permissions-matrix';
import { PermissionToggleMatrix } from '@/components/iam/permission-toggle-matrix';
import { isSchoolIamRoleSlug } from '@/lib/rh-iam-roles';
import {
  IAM_SHEET_BODY,
  IAM_SHEET_CONTENT,
  IAM_SHEET_FOOTER,
  IAM_SHEET_HEADER,
  IAM_SHEET_HERO,
  IAM_SHEET_TITLE,
} from '../../components/iam-sheet-shell';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: UserRole | null;
  onEditClick?: () => void;
};

export function RoleDetailsSheet({ open, onOpenChange, role: initialRole, onEditClick }: Props) {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: role, isLoading } = useQuery({
    queryKey: ['user-role', initialRole?.id],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/securite-configuration/acces/roles/${initialRole?.id}`,
      );
      if (!res.ok) throw new Error('Impossible de charger le rôle');
      return res.json() as UserRole;
    },
    enabled: !!initialRole?.id && open,
  });

  const displayRole = role ?? initialRole;
  if (!displayRole && !isLoading) return null;

  const assignedSlugs = permissionSlugsFromRole(displayRole);
  const isSchoolProtected =
    !!displayRole?.isProtected && isSchoolIamRoleSlug(displayRole?.slug ?? null);

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '—';
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return '—';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={IAM_SHEET_CONTENT}>
        <SheetHeader className={IAM_SHEET_HEADER}>
          <SheetTitle className={IAM_SHEET_TITLE}>Détails du rôle</SheetTitle>
        </SheetHeader>

        <SheetBody className={IAM_SHEET_BODY}>
          <div className={IAM_SHEET_HERO}>
            {isLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              <>
                <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                  <span className="min-w-0 break-words text-base font-bold leading-tight text-foreground sm:text-lg lg:text-2xl">
                    {displayRole?.name}
                  </span>
                  {displayRole?.isProtected ? (
                    <Badge variant="outline" className="gap-1">
                      <ShieldAlert className="size-3 text-destructive" />
                      Système
                    </Badge>
                  ) : null}
                  {displayRole?.isDefault ? (
                    <Badge variant="outline" className="gap-1">
                      <UserRound className="size-3 text-success" />
                      Par défaut
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-2sm">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {displayRole?.slug}
                  </Badge>
                  <span className="text-muted-foreground">
                    {assignedSlugs.length} permission(s) · Créé le{' '}
                    {formatDate(displayRole?.createdAt)}
                  </span>
                </div>
              </>
            )}
          </div>

          <ScrollArea className="mx-1.5 flex min-h-0 flex-1 flex-col px-3.5 py-5">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4 inline-flex h-auto flex-wrap gap-1">
                <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="m-0 space-y-4">
                <div className="rounded-md border border-border bg-accent/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Description
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {displayRole?.description?.trim() ||
                      'Aucune description pour ce rôle.'}
                  </p>
                </div>
                {isSchoolProtected ? (
                  <p className="text-xs text-muted-foreground">
                    Rôle système — utilisez le crayon pour modifier la matrice (badges cliquables).
                  </p>
                ) : null}
              </TabsContent>

              <TabsContent value="permissions" className="m-0">
                <p className="mb-3 text-xs text-muted-foreground">
                  Vert = actif · rouge = inactif
                </p>
                <PermissionToggleMatrix assignedSlugs={assignedSlugs} readOnly />
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className={IAM_SHEET_FOOTER}>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {onEditClick ? (
            <Button size="sm" className="ms-auto" onClick={onEditClick}>
              Modifier le rôle
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
