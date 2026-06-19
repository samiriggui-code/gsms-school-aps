'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
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
import { domainLabelForPermissionSlug } from '@/lib/auth/permission-domains';
import type { UserPermission, UserRole } from '@/app/models/user';
import { RoleToggleBadges } from '@/components/iam/role-toggle-badges';
import { useSchoolRoleSelectQuery } from '../../roles/hooks/use-role-select-query';
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
  permission: (UserPermission & { domain?: string; roles?: UserRole[] }) | null;
};

export function PermissionDetailSheet({ open, onOpenChange, permission }: Props) {
  const queryClient = useQueryClient();
  const { data: roleList } = useSchoolRoleSelectQuery();
  const [assignedRoleIds, setAssignedRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (permission?.roles) {
      setAssignedRoleIds(permission.roles.map((r) => r.id));
    } else {
      setAssignedRoleIds([]);
    }
  }, [permission]);

  const toggleMutation = useMutation({
    mutationFn: async ({ roleId, assigned }: { roleId: string; assigned: boolean }) => {
      const res = await apiFetch(
        `/api/sections/securite-configuration/acces/permissions/${permission?.id}/roles`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId, assigned }),
        },
      );
      if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: (_data, { roleId, assigned }) => {
      setAssignedRoleIds((prev) =>
        assigned ? [...new Set([...prev, roleId])] : prev.filter((id) => id !== roleId),
      );
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('Matrice mise à jour');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (!permission) return null;

  const domain = permission.domain ?? domainLabelForPermissionSlug(permission.slug);

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '—';
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return '—';
    }
  };

  const handleRoleToggle = (roleId: string) => {
    const assigned = !assignedRoleIds.includes(roleId);
    toggleMutation.mutate({ roleId, assigned });
  };

  const roles =
    roleList?.map((r: UserRole) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
    })) ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={IAM_SHEET_CONTENT}>
        <SheetHeader className={IAM_SHEET_HEADER}>
          <SheetTitle className={IAM_SHEET_TITLE}>Modifier les rôles</SheetTitle>
        </SheetHeader>

        <SheetBody className={IAM_SHEET_BODY}>
          <div className={IAM_SHEET_HERO}>
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <span className="min-w-0 break-words text-base font-bold leading-tight text-foreground sm:text-lg lg:text-2xl">
                {permission.name}
              </span>
              <Badge variant="outline">{domain}</Badge>
            </div>
            <Badge variant="secondary" className="w-fit font-mono text-xs">
              {permission.slug}
            </Badge>
          </div>

          <ScrollArea className="mx-1.5 flex min-h-0 flex-1 flex-col px-3.5 py-5 space-y-6">
            <div className="rounded-md border border-border bg-accent/30 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Description
              </p>
              <p className="text-sm text-foreground">
                {permission.description || 'Aucune description.'}
              </p>
              <p className="text-xs text-muted-foreground pt-1">
                Créé le {formatDate(permission.createdAt)}
              </p>
            </div>

            <div className="space-y-2.5">
              <p className="text-sm font-medium text-foreground">
                Rôles — cliquer pour activer / désactiver
              </p>
              <p className="text-xs text-muted-foreground">
                Badge vert = actif pour ce rôle · rouge = inactif
              </p>
              <RoleToggleBadges
                roles={roles}
                assignedRoleIds={assignedRoleIds}
                onToggle={handleRoleToggle}
              />
            </div>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className={IAM_SHEET_FOOTER}>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
