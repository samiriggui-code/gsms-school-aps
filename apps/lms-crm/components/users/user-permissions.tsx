'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { PermissionToggleMatrix } from '@/components/iam/permission-toggle-matrix';
import { resolveRolePermissionRows } from '@/lib/iam/serialize-user-role';

export function UserPermissions({
  user,
}: {
  user: { role?: { permissions?: unknown[]; name?: string; slug?: string } | null };
}) {
  const permissions = resolveRolePermissionRows(user?.role);
  const assignedSlugs = permissions.map((p) => p.slug);
  const roleLabel = user?.role?.name ?? 'ce rôle';

  return (
    <div className="space-y-5">
      <Card className="rounded-md bg-accent/70 shadow-none">
        <CardContent className="flex flex-col p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 ps-2 pe-3">
            <h3 className="text-sm font-medium text-foreground">Permissions effectives</h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Vert = actif · rouge = inactif
              </span>
              {permissions.length > 0 ? (
                <Badge variant="secondary" appearance="light" className="text-[10px] uppercase">
                  {permissions.length} via {roleLabel}
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="m-1 mt-0 rounded-md border border-input bg-background p-4">
            {user?.role ? (
              <PermissionToggleMatrix assignedSlugs={assignedSlugs} readOnly />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-accent">
                  <Info className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Aucun rôle assigné</p>
                <p className="mt-1 max-w-[280px] text-xs text-muted-foreground">
                  Assignez un rôle IAM pour afficher la matrice des permissions effectives.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
