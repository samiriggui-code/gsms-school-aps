'use client';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { PILOTAGE_MODULE_TABS, type PilotageModuleId } from '@/lib/pilotage/modules';

type Props = {
  value: PilotageModuleId;
  onChange: (id: PilotageModuleId) => void;
  className?: string;
};

export function PilotageModuleTabs({ value, onChange, className }: Props) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as PilotageModuleId)} className={className}>
      <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted/40 p-1">
        {PILOTAGE_MODULE_TABS.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            disabled={!tab.enabled}
            className={cn('gap-1.5 text-xs sm:text-sm', !tab.enabled && 'opacity-60')}
          >
            {tab.label}
            {tab.hint ? (
              <Badge variant="outline" className="px-1 py-0 text-[9px] font-semibold uppercase">
                {tab.hint}
              </Badge>
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export function pilotageModuleKeyPrefix(moduleId: PilotageModuleId): string | undefined {
  const tab = PILOTAGE_MODULE_TABS.find((t) => t.id === moduleId);
  return tab?.moduleKeyPrefix ?? undefined;
}

export function pilotageApiModuleId(moduleId: PilotageModuleId): string {
  return moduleId === 'all' ? 'gestion-ressources' : moduleId;
}
