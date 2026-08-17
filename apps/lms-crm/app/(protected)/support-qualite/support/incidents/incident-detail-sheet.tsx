'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SupportEntityCombobox } from '../../components/support-entity-combobox';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

const STATUS_LABEL: Record<string, string> = {
  REPORTED: 'Signalé',
  UNDER_ANALYSIS: 'Analyse',
  ACTION_IN_PROGRESS: 'Action en cours',
  RESOLVED: 'Résolu',
  CLOSED: 'Clôturé',
};

const SEVERITY_LABEL: Record<string, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

type IncidentDetail = {
  id: string;
  referenceCode: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  category: string | null;
  rootCause: string | null;
  correctiveAction: string | null;
  ticket: { id: string; referenceCode: string; subject: string } | null;
  equipment: { id: string; label: string; serialNumber: string } | null;
};

type Props = {
  incidentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
};

export function IncidentDetailSheet({ incidentId, open, onOpenChange, onUpdated }: Props) {
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['quality-incident-detail', incidentId] as const,
    enabled: open && !!incidentId,
    queryFn: async (): Promise<IncidentDetail | undefined> => {
      const res = await apiFetch(`/api/sections/support-qualite/support/incidents/${incidentId}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Erreur');
      return unwrapSectionApiData<IncidentDetail>(json);
    },
  });

  useEffect(() => {
    if (data) {
      setStatus(data.status);
      setSeverity(data.severity);
      setRootCause(data.rootCause ?? '');
      setCorrectiveAction(data.correctiveAction ?? '');
      setTicketId(data.ticket?.id ?? '');
      setEquipmentId(data.equipment?.id ?? '');
    }
  }, [data]);

  async function save() {
    if (!incidentId) return;
    setSaving(true);
    const res = await apiFetch(`/api/sections/support-qualite/support/incidents/${incidentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        severity,
        rootCause,
        correctiveAction,
        ticketId: ticketId || null,
        equipmentId: equipmentId || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error('Enregistrement impossible');
      return;
    }
    toast.success('Incident mis à jour');
    refetch();
    onUpdated();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap gap-2 items-center">
            <span>{data?.referenceCode ?? 'Incident'}</span>
            {data && <Badge variant="outline">{SEVERITY_LABEL[data.severity]}</Badge>}
          </SheetTitle>
        </SheetHeader>

        {isLoading || !data ? (
          <p className="py-8 text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <div className="space-y-4 py-4">
            <div>
              <p className="font-medium">{data.title}</p>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground mt-2">{data.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Statut</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gravité</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEVERITY_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SupportEntityCombobox
              type="tickets"
              label="Ticket lié"
              value={ticketId}
              onChange={setTicketId}
              placeholder="Rechercher un ticket…"
            />
            <SupportEntityCombobox
              type="equipment"
              label="Équipement lié"
              value={equipmentId}
              onChange={setEquipmentId}
              placeholder="Rechercher un équipement…"
            />
            <div>
              <Label>Cause racine</Label>
              <Textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Action corrective</Label>
              <Textarea value={correctiveAction} onChange={(e) => setCorrectiveAction(e.target.value)} rows={2} />
            </div>
          </div>
        )}

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          <Button onClick={save} disabled={saving || !data}>Enregistrer</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
