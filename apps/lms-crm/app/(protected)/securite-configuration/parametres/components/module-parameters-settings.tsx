'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type ModuleSettingRow = {
  moduleKey: string;
  settingKey: string;
  value: Record<string, unknown>;
};

const DEFAULT_SLA = {
  criticalHours: 4,
  highHours: 8,
  normalHours: 24,
  lowHours: 72,
};

import { DEFAULT_DEVIS_WORKFLOW_SETTINGS, mergeDevisWorkflowSettings } from '@/lib/finance/devis-workflow-settings';
import {
  DEFAULT_EINVOICE_SETTINGS,
  mergeEinvoiceSettings,
  type EinvoiceModuleSettings,
} from '@/lib/finance/einvoice-settings';

async function fetchModuleSetting(
  moduleKey: string,
  settingKey: string,
): Promise<Record<string, unknown> | null> {
  const sp = new URLSearchParams({ moduleKey });
  const res = await apiFetch(
    `/api/sections/securite-configuration/parametres/module-settings?${sp}`,
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  const rows = unwrapSectionApiData<ModuleSettingRow[]>(json) ?? [];
  const row = rows.find((r) => r.settingKey === settingKey);
  return row?.value ?? null;
}

async function saveModuleSetting(
  moduleKey: string,
  settingKey: string,
  value: Record<string, unknown>,
) {
  const res = await apiFetch('/api/sections/securite-configuration/parametres/module-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moduleKey, settingKey, value }),
  });
  return res.ok;
}

function SupportSlaForm() {
  const qc = useQueryClient();
  const [values, setValues] = useState(DEFAULT_SLA);
  const [saving, setSaving] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ['module-setting', 'support-qualite', 'sla'],
    queryFn: async () => {
      const saved = await fetchModuleSetting('support-qualite', 'sla');
      if (saved) {
        setValues({ ...DEFAULT_SLA, ...saved } as typeof DEFAULT_SLA);
      }
      return saved;
    },
    staleTime: 30_000,
  });

  async function save() {
    setSaving(true);
    const ok = await saveModuleSetting('support-qualite', 'sla', values);
    setSaving(false);
    if (!ok) {
      toast.error('Enregistrement SLA impossible');
      return;
    }
    toast.success('SLA support enregistré');
    qc.invalidateQueries({ queryKey: ['module-setting', 'support-qualite', 'sla'] });
  }

  const fields: { key: keyof typeof DEFAULT_SLA; label: string }[] = [
    { key: 'criticalHours', label: 'Critique (h)' },
    { key: 'highHours', label: 'Haute (h)' },
    { key: 'normalHours', label: 'Normale (h)' },
    { key: 'lowHours', label: 'Basse (h)' },
  ];

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Délais cibles de prise en charge des tickets, en heures ouvrées.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`sla-${key}`}>{label}</Label>
            <Input
              id={`sla-${key}`}
              type="number"
              min={1}
              value={values[key]}
              onChange={(e) =>
                setValues((v) => ({ ...v, [key]: Number(e.target.value) || 1 }))
              }
            />
          </div>
        ))}
      </div>
      <Button size="sm" onClick={save} disabled={saving}>
        Enregistrer SLA
      </Button>
    </div>
  );
}

const DEFAULT_PILOTAGE_ALERTES = {
  candidaturesPending: 10,
  overdueInvoices: 5,
  equipmentMaintenanceDue: 3,
  sessionsWithoutTrainer: 2,
};

function PilotageAlertesForm() {
  const qc = useQueryClient();
  const [values, setValues] = useState(DEFAULT_PILOTAGE_ALERTES);
  const [saving, setSaving] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ['module-setting', 'pilotage-supervision', 'alertes'],
    queryFn: async () => {
      const saved = await fetchModuleSetting('pilotage-supervision', 'alertes');
      if (saved) {
        setValues({ ...DEFAULT_PILOTAGE_ALERTES, ...saved } as typeof DEFAULT_PILOTAGE_ALERTES);
      }
      return saved;
    },
    staleTime: 30_000,
  });

  async function save() {
    setSaving(true);
    const ok = await saveModuleSetting('pilotage-supervision', 'alertes', values);
    setSaving(false);
    if (!ok) {
      toast.error('Enregistrement seuils impossible');
      return;
    }
    toast.success('Seuils pilotage enregistrés');
    qc.invalidateQueries({ queryKey: ['module-setting', 'pilotage-supervision', 'alertes'] });
  }

  const fields: { key: keyof typeof DEFAULT_PILOTAGE_ALERTES; label: string }[] = [
    { key: 'candidaturesPending', label: 'Candidatures en attente (max)' },
    { key: 'overdueInvoices', label: 'Factures en retard (max)' },
    { key: 'equipmentMaintenanceDue', label: 'Maintenances dues (max)' },
    { key: 'sessionsWithoutTrainer', label: 'Sessions sans formateur (max)' },
  ];

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Seuils au-delà desquels une alerte apparaît dans Pilotage & supervision.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`pilotage-${key}`}>{label}</Label>
            <Input
              id={`pilotage-${key}`}
              type="number"
              min={0}
              value={values[key]}
              onChange={(e) =>
                setValues((v) => ({ ...v, [key]: Number(e.target.value) || 0 }))
              }
            />
          </div>
        ))}
      </div>
      <Button size="sm" onClick={save} disabled={saving}>
        Enregistrer seuils
      </Button>
    </div>
  );
}

function FinanceDevisWorkflowForm() {
  const qc = useQueryClient();
  const [values, setValues] = useState(DEFAULT_DEVIS_WORKFLOW_SETTINGS);
  const [saving, setSaving] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ['module-setting', 'finance', 'devis-workflow'],
    queryFn: async () => {
      const saved = await fetchModuleSetting('finance', 'devis-workflow');
      if (saved) {
        setValues(mergeDevisWorkflowSettings(saved));
      }
      return saved;
    },
    staleTime: 30_000,
  });

  async function save() {
    setSaving(true);
    const ok = await saveModuleSetting('finance', 'devis-workflow', values);
    setSaving(false);
    if (!ok) {
      toast.error('Enregistrement workflow impossible');
      return;
    }
    toast.success('Workflow devis enregistré');
    qc.invalidateQueries({ queryKey: ['module-setting', 'finance', 'devis-workflow'] });
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Règles par défaut du parcours commercial devis (validité, expiration, envoi).
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="devis-validity">Validité par défaut (jours)</Label>
          <Input
            id="devis-validity"
            type="number"
            min={1}
            value={values.defaultValidityDays}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                defaultValidityDays: Number(e.target.value) || 1,
              }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="devis-expire">Expiration auto (jours)</Label>
          <Input
            id="devis-expire"
            type="number"
            min={1}
            value={values.autoExpireDays}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                autoExpireDays: Number(e.target.value) || 1,
              }))
            }
          />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
          <Label htmlFor="devis-plaquette" className="text-sm font-normal">
            Exiger la plaquette avant envoi client
          </Label>
          <Switch
            id="devis-plaquette"
            checked={values.requirePlaquetteBeforeSend}
            onCheckedChange={(on) =>
              setValues((v) => ({ ...v, requirePlaquetteBeforeSend: on }))
            }
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
          <Label htmlFor="devis-notify" className="text-sm font-normal">
            Notifier l&apos;équipe à l&apos;acceptation
          </Label>
          <Switch
            id="devis-notify"
            checked={values.notifyOnAccept}
            onCheckedChange={(on) => setValues((v) => ({ ...v, notifyOnAccept: on }))}
          />
        </div>
      </div>
      <Button size="sm" onClick={save} disabled={saving}>
        Enregistrer workflow
      </Button>
    </div>
  );
}

function FinanceEinvoiceForm() {
  const qc = useQueryClient();
  const [values, setValues] = useState<EinvoiceModuleSettings>(DEFAULT_EINVOICE_SETTINGS);
  const [saving, setSaving] = useState(false);

  useQuery({
    queryKey: ['module-setting', 'finance', 'einvoice'],
    queryFn: async () => {
      const saved = await fetchModuleSetting('finance', 'einvoice');
      setValues(mergeEinvoiceSettings(saved));
      return saved;
    },
  });

  const save = async () => {
    setSaving(true);
    const ok = await saveModuleSetting('finance', 'einvoice', values);
    setSaving(false);
    if (!ok) {
      toast.error('Enregistrement impossible.');
      return;
    }
    toast.success('Paramètres e-facture enregistrés.');
    qc.invalidateQueries({ queryKey: ['module-setting', 'finance', 'einvoice'] });
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Obligation de <strong>réception</strong> des factures électroniques au{' '}
        <strong>1er septembre 2026</strong> pour toutes les entreprises. L&apos;émission Factur-X
        est déjà disponible dans le CRM ; branchez une PDP agréée avant la prod.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="einvoice-profile">Profil Factur-X</Label>
          <select
            id="einvoice-profile"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={values.profile}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                profile: e.target.value as EinvoiceModuleSettings['profile'],
              }))
            }
          >
            <option value="MINIMUM">MINIMUM</option>
            <option value="BASIC">BASIC</option>
            <option value="EN16931">EN16931</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="einvoice-pdp">PDP / plateforme (slug)</Label>
          <Input
            id="einvoice-pdp"
            placeholder="ex. pennylane, qonto, chorus…"
            value={values.pdpProvider}
            onChange={(e) => setValues((v) => ({ ...v, pdpProvider: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
          <Label htmlFor="einvoice-sandbox" className="text-sm font-normal">
            Mode sandbox PDP
          </Label>
          <Switch
            id="einvoice-sandbox"
            checked={values.pdpSandbox}
            onCheckedChange={(on) => setValues((v) => ({ ...v, pdpSandbox: on }))}
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
          <Label htmlFor="einvoice-siret" className="text-sm font-normal">
            Exiger SIRET client avant Factur-X
          </Label>
          <Switch
            id="einvoice-siret"
            checked={values.requireBuyerSiret}
            onCheckedChange={(on) => setValues((v) => ({ ...v, requireBuyerSiret: on }))}
          />
        </div>
      </div>
      <Button size="sm" onClick={save} disabled={saving}>
        Enregistrer e-facture
      </Button>
    </div>
  );
}

export function ModuleParametersSettings() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Support & qualité — SLA</h3>
        <SupportSlaForm />
      </div>
      <Separator />
      <div>
        <h3 className="mb-3 text-sm font-semibold">Finance — workflow devis</h3>
        <FinanceDevisWorkflowForm />
      </div>
      <Separator />
      <div>
        <h3 className="mb-3 text-sm font-semibold">Finance — facturation électronique</h3>
        <FinanceEinvoiceForm />
      </div>
      <Separator />
      <div>
        <h3 className="mb-3 text-sm font-semibold">Pilotage — seuils alertes</h3>
        <PilotageAlertesForm />
      </div>
    </div>
  );
}
