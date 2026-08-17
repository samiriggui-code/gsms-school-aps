'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import {
  DASHBOARD_WIDGET_CATALOG,
  LAYOUT_WIDGET_CATALOG,
  defaultLayoutWidgets,
  type LayoutModuleKey,
} from '@/config/dashboard-widgets.config';
import { MODULE_LANDING_WIDGET_CATALOG } from '@/config/module-landing-widgets.config';

type ModuleSettingRow = {
  moduleKey: string;
  settingKey: string;
  value: { widgets?: string[] };
};

const DASHBOARD_KEYS = Object.keys(DASHBOARD_WIDGET_CATALOG) as LayoutModuleKey[];
const LANDING_KEYS = Object.keys(MODULE_LANDING_WIDGET_CATALOG) as LayoutModuleKey[];

const MODULE_LABELS: Partial<Record<LayoutModuleKey, string>> = {
  'crm-dashboard': 'Dashboard CRM',
  'formateur-dashboard': 'Dashboard formateur',
  'stagiaire-dashboard': 'Dashboard stagiaire',
  'finance-landing': 'Landing Finance',
  'pilotage-landing': 'Landing Pilotage',
  'support-landing': 'Landing Support',
  'gestion-ressources-landing': 'Landing Gestion ressources',
  'communication-landing': 'Landing Communication',
  'vie-scolaire-landing': 'Landing Vie scolaire',
};

function LayoutWidgetEditor({ moduleKey }: { moduleKey: LayoutModuleKey }) {
  const qc = useQueryClient();
  const catalog = LAYOUT_WIDGET_CATALOG[moduleKey];
  const defaults = defaultLayoutWidgets(moduleKey);
  const [widgets, setWidgets] = useState<string[]>(defaults);
  const [saving, setSaving] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ['module-layout-editor', moduleKey],
    queryFn: async () => {
      const sp = new URLSearchParams({ moduleKey });
      const res = await apiFetch(
        `/api/sections/securite-configuration/parametres/module-settings?${sp}`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return defaults;
      const rows = unwrapSectionApiData<ModuleSettingRow[]>(json) ?? [];
      const layout = rows.find((r) => r.settingKey === 'layout');
      const saved = layout?.value?.widgets;
      const next =
        Array.isArray(saved) && saved.length > 0
          ? saved.filter((id) => catalog.some((w) => w.id === id))
          : defaults;
      setWidgets(next);
      return next;
    },
    staleTime: 30_000,
  });

  async function save() {
    setSaving(true);
    const res = await apiFetch('/api/sections/securite-configuration/parametres/module-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleKey,
        settingKey: 'layout',
        value: { widgets },
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error('Enregistrement impossible');
      return;
    }
    toast.success('Layout enregistré');
    qc.invalidateQueries({ queryKey: ['module-layout-editor', moduleKey] });
    qc.invalidateQueries({ queryKey: ['module-layout', moduleKey] });
    qc.invalidateQueries({ queryKey: ['dashboard-layout', moduleKey] });
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }

  return (
    <div className="space-y-4">
      {catalog.map((widget) => {
        const checked = widgets.includes(widget.id);
        return (
          <div
            key={widget.id}
            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <Label htmlFor={`${moduleKey}-${widget.id}`} className="text-sm font-normal">
              {widget.label}
            </Label>
            <Switch
              id={`${moduleKey}-${widget.id}`}
              checked={checked}
              onCheckedChange={(on) => {
                setWidgets((prev) =>
                  on ? [...prev, widget.id] : prev.filter((id) => id !== widget.id),
                );
              }}
            />
          </div>
        );
      })}
      <Button size="sm" onClick={save} disabled={saving || widgets.length === 0}>
        Enregistrer le layout
      </Button>
    </div>
  );
}

function LayoutEditorTabs({ keys }: { keys: LayoutModuleKey[] }) {
  return (
    <Tabs defaultValue={keys[0]}>
      <TabsList className="mb-4 flex-wrap h-auto">
        {keys.map((key) => (
          <TabsTrigger key={key} value={key}>
            {MODULE_LABELS[key] ?? key}
          </TabsTrigger>
        ))}
      </TabsList>
      {keys.map((key) => (
        <TabsContent key={key} value={key}>
          <LayoutWidgetEditor moduleKey={key} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function DashboardLayoutSettings() {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base">Layouts & blocs visibles</CardTitle>
        <CardDescription>
          Dashboards utilisateurs (CRM, formateur, stagiaire) et landings de modules — persisté via
          ModuleSetting.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Tabs defaultValue="dashboards">
          <TabsList className="mb-4">
            <TabsTrigger value="dashboards">Espaces utilisateurs</TabsTrigger>
            <TabsTrigger value="landings">Landings modules</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboards">
            <LayoutEditorTabs keys={DASHBOARD_KEYS} />
          </TabsContent>
          <TabsContent value="landings">
            <LayoutEditorTabs keys={LANDING_KEYS} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
