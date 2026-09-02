'use client';

import { useSession } from 'next-auth/react';
import { Badge } from '@repo/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { PILOTAGE_ALERT_MODULE_PERMISSIONS } from '@repo/api-core/notification-audience';
import { sessionHasPermission } from '@/lib/auth/crm-permissions';
import { cn } from '@/lib/utils';
import { PILOTAGE_MODULE_TABS, type PilotageModuleId } from '@/lib/pilotage/modules';

type Props = {
  value: PilotageModuleId;
  onChange: (id: PilotageModuleId) => void;
  className?: string;
};

const MODULE_PERMISSION_BY_ID = Object.fromEntries(
  PILOTAGE_ALERT_MODULE_PERMISSIONS.map((row) => [row.moduleId, row.permissionSlug]),
) as Record<string, string>;

export function PilotageModuleTabs({ value, onChange, className }: Props) {
  const { data: session } = useSession();

  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as PilotageModuleId)} className={className}>
      <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted/40 p-1">
        {PILOTAGE_MODULE_TABS.map((tab) => {
          const permissionSlug = tab.id === 'all' ? null : MODULE_PERMISSION_BY_ID[tab.id];
          const allowed =
            tab.id === 'all' || !permissionSlug || sessionHasPermission(session, permissionSlug);
          const disabled = !tab.enabled || !allowed;

          return (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            disabled={disabled}
            className={cn('gap-1.5 text-xs sm:text-sm', disabled && 'opacity-60')}
          >
            {tab.label}
            {!allowed && tab.id !== 'all' ? (
              <Badge variant="outline" className="px-1 py-0 text-[9px] font-semibold uppercase">
                Restreint
              </Badge>
            ) : tab.hint ? (
              <Badge variant="outline" className="px-1 py-0 text-[9px] font-semibold uppercase">
                {tab.hint}
              </Badge>
            ) : null}
          </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

export function pilotageModuleKeyPrefix(moduleId: PilotageModuleId): string | undefined {
  const tab = PILOTAGE_MODULE_TABS.find((t) => t.id === moduleId);
  return tab?.moduleKeyPrefix ?? undefined;
}

export function pilotageApiModuleId(moduleId: PilotageModuleId): string {
  return moduleId;
}
