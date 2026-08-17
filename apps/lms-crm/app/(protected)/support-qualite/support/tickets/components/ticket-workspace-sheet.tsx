'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Paperclip, Send, Lock, Globe, AlertTriangle, User } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Separator } from '@/components/ui/separator';
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
  comments: Array<{
    id: string;
    body: string;
    isInternal: boolean;
    createdAt: string;
    author: { id: string; name: string | null; email: string } | null;
    attachments: Array<{ id: string; fileName: string; fileUrl: string }>;
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    mimeType: string | null;
    createdAt: string;
    uploadedBy: { id: string; name: string | null; email: string } | null;
  }>;
  incidents: Array<{
    id: string;
    referenceCode: string;
    title: string;
    status: string;
    severity: string;
  }>;
};

type Agent = { id: string; name: string | null; email: string };

type Props = {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
};

export function TicketWorkspaceSheet({ ticketId, open, onOpenChange, onUpdated }: Props) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const { data: agents = [] } = useQuery({
    queryKey: ['support-agents'] as const,
    enabled: open,
    queryFn: async (): Promise<Agent[]> => {
      const res = await apiFetch('/api/sections/support-qualite/support/agents');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return [];
      return unwrapSectionApiData<Agent[]>(json) ?? [];
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (data) {
      setStatus(data.status);
      setPriority(data.priority);
      setAssigneeId(data.assignedTo?.id ?? '');
    }
  }, [data]);

  async function saveMeta() {
    if (!ticketId) return;
    setSaving(true);
    const res = await apiFetch(`/api/sections/support-qualite/support/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        priority,
        assignedToId: assigneeId || null,
      }),
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

  async function postComment() {
    if (!ticketId || !reply.trim()) return;
    setPosting(true);
    const res = await apiFetch(
      `/api/sections/support-qualite/support/tickets/${ticketId}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply.trim(), isInternal }),
      },
    );
    setPosting(false);
    if (!res.ok) {
      toast.error('Envoi impossible');
      return;
    }
    setReply('');
    refetch();
    onUpdated();
  }

  async function uploadFile(file: File) {
    if (!ticketId) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await apiFetch(
      `/api/sections/support-qualite/support/tickets/${ticketId}/attachments`,
      { method: 'POST', body: fd },
    );
    setUploading(false);
    if (!res.ok) {
      toast.error('Upload impossible');
      return;
    }
    toast.success('Pièce jointe ajoutée');
    refetch();
    onUpdated();
  }

  async function takeCharge() {
    if (!ticketId || !session?.user?.id) return;
    setStatus('IN_PROGRESS');
    setAssigneeId(session.user.id);
    const res = await apiFetch(`/api/sections/support-qualite/support/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'IN_PROGRESS',
        assignedToId: session.user.id,
      }),
    });
    if (!res.ok) {
      toast.error('Prise en charge impossible');
      return;
    }
    toast.success('Ticket pris en charge');
    refetch();
    onUpdated();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <SheetHeader className="border-b px-6 py-4 space-y-3">
          <SheetTitle className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm">{data?.referenceCode ?? 'Ticket'}</span>
            {data && (
              <>
                <Badge variant="secondary">{STATUS_LABEL[data.status] ?? data.status}</Badge>
                <Badge variant="outline">{PRIORITY_LABEL[data.priority] ?? data.priority}</Badge>
              </>
            )}
          </SheetTitle>
          {data && (
            <>
              <p className="text-sm font-medium text-left">{data.subject}</p>
              <p className="text-xs text-muted-foreground text-left">
                Demande reçue le {new Date(data.createdAt).toLocaleString('fr-FR')} — saisie manuelle ou notification CRM.
              </p>
            </>
          )}
        </SheetHeader>

        {isLoading || !data ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <div className="px-6 py-4 space-y-6">
            <section className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demandeur</p>
              <div className="flex items-start gap-2 text-sm">
                <User className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium">{data.requesterName}</p>
                  <p className="text-muted-foreground">{data.requesterEmail}</p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
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
              <div className="col-span-2">
                <Label>Agent support assigné</Label>
                <Select value={assigneeId || 'none'} onValueChange={(v) => setAssigneeId(v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non assigné</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name ?? a.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Uniquement les collaborateurs CRM avec droit support.
                </p>
              </div>
              {status === 'OPEN' && (
                <div className="col-span-2">
                  <Button variant="secondary" size="sm" onClick={takeCharge}>
                    Prendre en charge (moi)
                  </Button>
                </div>
              )}
            </section>

            <Separator />

            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demande initiale</p>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm whitespace-pre-wrap">{data.description}</p>
              </div>
            </section>

            <section className="space-y-3 max-h-[40vh] overflow-y-auto">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Échanges</p>
              {data.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune réponse pour l&apos;instant.</p>
              ) : (
                data.comments.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-lg border p-3 ${c.isInternal ? 'border-amber-500/30 bg-amber-500/5' : 'bg-background'}`}
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      {c.isInternal ? <Lock className="size-3" /> : <Globe className="size-3" />}
                      <span>{c.author?.name ?? c.author?.email ?? 'Système'}</span>
                      <span>·</span>
                      <span>{new Date(c.createdAt).toLocaleString('fr-FR')}</span>
                      {c.isInternal && <Badge variant="outline" className="text-2xs">Interne</Badge>}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                  </div>
                ))
              )}
            </section>

            <section className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Répondre</Label>
                <div className="flex items-center gap-2 text-xs">
                  <span>Note interne</span>
                  <Switch checked={isInternal} onCheckedChange={setIsInternal} size="sm" />
                </div>
              </div>
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={isInternal ? 'Note interne (équipe uniquement)…' : 'Réponse au demandeur…'}
                rows={3}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={postComment} disabled={posting || !reply.trim()}>
                  <Send className="size-4" />
                  Envoyer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  <Paperclip className="size-4" />
                  Pièce jointe
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadFile(f);
                    e.target.value = '';
                  }}
                />
              </div>
            </section>

            {data.attachments.length > 0 && (
              <section className="space-y-2">
                <Label>Pièces jointes</Label>
                <ul className="space-y-1 text-sm">
                  {data.attachments.map((a) => (
                    <li key={a.id}>
                      <a href={a.fileUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                        {a.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.incidents.length > 0 && (
              <section className="space-y-2 border-t pt-4">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="size-4" />
                  Incidents qualité liés
                </Label>
                <ul className="space-y-2">
                  {data.incidents.map((i) => (
                    <li key={i.id}>
                      <Link
                        href={`/support-qualite/support/incidents?incident=${i.id}`}
                        className="text-sm text-primary underline"
                      >
                        {i.referenceCode} — {i.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        <SheetFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          <Button onClick={saveMeta} disabled={saving || !data}>Enregistrer</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
