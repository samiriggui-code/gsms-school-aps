'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  WAITING_CLIENT: 'Attente client',
  RESOLVED: 'Résolu',
  CLOSED: 'Clôturé',
};

const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Basse',
  MEDIUM: 'Normale',
  HIGH: 'Haute',
  URGENT: 'Urgente',
};

export type TicketDetail = {
  id: string;
  referenceCode: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  requesterName: string;
  requesterEmail: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string | null; email: string } | null;
};

type Props = {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
};

export function TicketDetailSheet({ ticketId, open, onOpenChange, onUpdated }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['support-ticket-detail', ticketId] as const,
    enabled: open && !!ticketId,
    queryFn: async (): Promise<TicketDetail | undefined> => {
      const res = await apiFetch(`/api/sections/support-qualite/support/tickets/${ticketId}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Erreur');
      return unwrapSectionApiData<TicketDetail>(json);
    },
  });

  useEffect(() => {
    if (data) {
      setStatus(data.status);
      setPriority(data.priority);
    }
  }, [data]);

  async function save() {
    if (!ticketId) return;
    setSaving(true);
    const res = await apiFetch(`/api/sections/support-qualite/support/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, priority }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error('Enregistrement impossible');
      return;
    }
    toast.success(t('support.ticketUpdated'));
    refetch();
    onUpdated();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{data?.referenceCode ?? 'Ticket'}</SheetTitle>
        </SheetHeader>

        {isLoading || !data ? (
          <p className="py-8 text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <div className="space-y-4 py-4">
            <div>
              <p className="text-xs text-muted-foreground">Sujet</p>
              <p className="font-medium">{data.subject}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Demandeur</p>
              <p>{data.requesterName}</p>
              <p className="text-sm text-muted-foreground">{data.requesterEmail}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="whitespace-pre-wrap text-sm">{data.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{STATUS_LABEL[data.status] ?? data.status}</Badge>
              <Badge variant="outline">{PRIORITY_LABEL[data.priority] ?? data.priority}</Badge>
            </div>
            {data.assignedTo && (
              <div>
                <p className="text-xs text-muted-foreground">Assigné à</p>
                <p className="text-sm">{data.assignedTo.name ?? data.assignedTo.email}</p>
              </div>
            )}
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
                <Label>Priorité</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Créé le {new Date(data.createdAt).toLocaleString('fr-FR')}
            </p>
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
