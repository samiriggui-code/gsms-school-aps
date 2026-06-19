'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, LoaderCircleIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_COMPACT } from '@/app/(protected)/gestion-academique/vie-scolaire/constants/sheet-shell-classes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSchoolRoleSelectQuery } from '@/app/(protected)/securite-configuration/acces/roles/hooks/use-role-select-query';
import { roleHasMobilePortalAccess } from '@/lib/rh-iam-roles';
import { RoleToggleBadges } from '@/components/iam/role-toggle-badges';

export function UserRolesGroups({ user }: { user: any }) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(user.role?.id || '');
  const queryClient = useQueryClient();
  const { data: roleList } = useSchoolRoleSelectQuery();

  useEffect(() => {
    setSelectedRoleId(user.role?.id || '');
  }, [user.role?.id]);

  const mutation = useMutation({
    mutationFn: async (roleId: string) => {
      const response = await apiFetch(`/api/sections/securite-configuration/acces/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          roleId,
          status: user.status,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erreur lors de la mise à jour');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-user', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-users'] });
      toast.success('Rôle mis à jour avec succès');
      setIsSheetOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const hasMobileAccess = roleHasMobilePortalAccess(user.role);

  const roles =
    roleList?.map((role: { id: string; name: string; slug?: string }) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
    })) ?? [];

  const assignedRoleIds = user.role?.id ? [user.role.id] : [];

  const supplementalRows = hasMobileAccess
    ? [
        {
          icon: <Smartphone className="size-4 text-indigo-600" />,
          name: 'Accès portail / mobile',
          details: 'Permission portal.mobile.access — espace formateur, apprenant ou collaborateur.',
        },
      ]
    : [];

  const handleUpdateRole = () => {
    mutation.mutate(selectedRoleId);
  };

  return (
    <>
      <Card className="h-full rounded-md bg-accent/70 shadow-none">
        <CardContent className="flex h-full flex-col p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 ps-2 pe-3">
            <h3 className="text-sm font-medium text-foreground">Rôles IAM école</h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Vert = assigné · rouge = non assigné
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold"
                onClick={() => setIsSheetOpen(true)}
              >
                Gérer
              </Button>
            </div>
          </div>
          <div className="m-1 mt-0 flex-1 rounded-md border border-input bg-background p-4">
            {roles.length > 0 ? (
              <RoleToggleBadges
                roles={roles}
                assignedRoleIds={assignedRoleIds}
                onToggle={() => {}}
                readOnly
              />
            ) : (
              <p className="text-sm text-muted-foreground">Chargement des rôles…</p>
            )}

            {user.role?.slug ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Rôle principal :{' '}
                <Badge variant="success" appearance="light" className="text-[10px] uppercase">
                  {user.role.name}
                </Badge>
              </p>
            ) : null}

            {supplementalRows.map((row) => (
              <div key={row.name} className="mt-4 border-t border-border pt-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-accent/70">
                    {row.icon}
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{row.name}</span>
                      <Badge variant="success" appearance="light" className="text-[10px]">
                        Actif
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{row.details}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className={VIE_SCOLAIRE_SHEET_COMPACT}>
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle>Modifier le rôle principal</SheetTitle>
          </SheetHeader>
          <SheetBody className="px-5 py-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sélectionnez le nouveau rôle pour{' '}
                <strong>{user.name || `${user.firstName} ${user.lastName}`}</strong>. Les
                permissions effectives seront recalculées selon la matrice IAM.
              </p>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(roleList) &&
                    roleList.map((role: { id: string; name: string; slug?: string }) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                        {role.slug ? ` (${role.slug})` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </SheetBody>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-4">
            <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={mutation.isPending || !selectedRoleId || selectedRoleId === user.role?.id}
            >
              {mutation.isPending && <LoaderCircleIcon className="mr-2 size-4 animate-spin" />}
              Mettre à jour
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
