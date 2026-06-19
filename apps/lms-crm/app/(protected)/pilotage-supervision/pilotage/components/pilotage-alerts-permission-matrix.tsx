'use client';

import { useSession } from 'next-auth/react';
import { Check, ShieldOff } from 'lucide-react';
import { PILOTAGE_ALERT_MODULE_PERMISSIONS } from '@repo/api-core/notification-audience';
import { sessionHasPermission } from '@/lib/auth/crm-permissions';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function PilotageAlertsPermissionMatrix() {
  const { data: session } = useSession();

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="space-y-1 py-4">
        <h3 className="text-base font-semibold text-foreground">Visibilité des alertes par module</h3>
        <p className="text-xs text-muted-foreground">
          Chaque alerte est émise et affichée uniquement pour les rôles disposant de la permission
          module correspondante — pas de diffusion globale à tous les comptes actifs.
        </p>
      </CardHeader>
      <CardContent className="pb-4 pt-0">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Module</th>
                <th className="px-4 py-2.5 font-semibold">Permission requise</th>
                <th className="px-4 py-2.5 font-semibold text-end">Votre accès</th>
              </tr>
            </thead>
            <tbody>
              {PILOTAGE_ALERT_MODULE_PERMISSIONS.map((row) => {
                const allowed = sessionHasPermission(session, row.permissionSlug);
                return (
                  <tr key={row.moduleId} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">{row.label}</td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-foreground/80">
                        {row.permissionSlug}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Badge
                        variant={allowed ? 'success' : 'secondary'}
                        appearance="light"
                        className={cn(
                          'gap-1 text-[10px] font-bold uppercase',
                          !allowed && 'text-muted-foreground',
                        )}
                      >
                        {allowed ? (
                          <>
                            <Check className="size-3" />
                            Autorisé
                          </>
                        ) : (
                          <>
                            <ShieldOff className="size-3" />
                            Masqué
                          </>
                        )}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
