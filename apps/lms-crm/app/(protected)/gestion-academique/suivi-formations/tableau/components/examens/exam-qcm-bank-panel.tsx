'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Download, Plus } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type BankRow = {
  id: string;
  title: string;
  formationId: string | null;
  itemCount: number;
  formation: { id: string; name: string; slug: string } | null;
};

type BankDetail = {
  id: string;
  title: string;
  items: Array<{
    id: string;
    position: number;
    prompt: string;
    choices: string[];
    correctIndex: number;
    tags: string[];
    chapter: { id: string; title: string; position: number } | null;
  }>;
};

export function ExamQcmBankPanel() {
  const queryClient = useQueryClient();
  const [formationId, setFormationId] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [newPrompt, setNewPrompt] = useState('');
  const [newChoices, setNewChoices] = useState('Réponse A\nRéponse B\nRéponse C\nRéponse D');
  const [newCorrectIndex, setNewCorrectIndex] = useState('0');
  const [newUvTag, setNewUvTag] = useState('');

  const formationsQuery = useQuery({
    queryKey: ['formations-catalog', 'active'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/formations?scope=visible');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Catalogue indisponible');
      const rows = (body.data?.items ?? []) as Array<{ formationId: string; name: string; status: string }>;
      return rows.filter((r) => r.status === 'ACTIVE');
    },
  });

  const banksQuery = useQuery({
    queryKey: ['vie-scolaire', 'qcm-banks', formationId],
    enabled: Boolean(formationId),
    queryFn: async () => {
      const params = new URLSearchParams({ formationId });
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/qcm-banks?${params}`,
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Banques indisponibles');
      return body.data.items as BankRow[];
    },
  });

  const bankDetailQuery = useQuery({
    queryKey: ['vie-scolaire', 'qcm-banks', selectedBankId],
    enabled: Boolean(selectedBankId),
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/qcm-banks/${selectedBankId}`,
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Banque introuvable');
      return body.data.item as BankDetail;
    },
  });

  const createBankMutation = useMutation({
    mutationFn: async () => {
      if (!formationId) throw new Error('Sélectionnez une formation');
      const formation = formationsQuery.data?.find((f) => f.formationId === formationId);
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/qcm-banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formationId,
          title: `Banque QCM — ${formation?.name ?? 'Formation'}`,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? body.error ?? 'Création impossible');
      return body.data.item as BankRow;
    },
    onSuccess: (bank) => {
      toast.success('Banque QCM créée');
      setSelectedBankId(bank.id);
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'qcm-banks', formationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addQuestionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBankId) throw new Error('Banque non sélectionnée');
      const choices = newChoices.split('\n').map((l) => l.trim()).filter(Boolean);
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/qcm-banks/${selectedBankId}/items`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: newPrompt.trim(),
            choices,
            correctIndex: Number(newCorrectIndex),
            tags: newUvTag.trim() ? [newUvTag.trim()] : [],
          }),
        },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? body.error ?? 'Ajout impossible');
      return body.data.item;
    },
    onSuccess: () => {
      toast.success('Question ajoutée');
      setNewPrompt('');
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'qcm-banks', selectedBankId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const banks = banksQuery.data ?? [];
  const activeBankId = selectedBankId ?? banks[0]?.id ?? null;

  const items = useMemo(() => bankDetailQuery.data?.items ?? [], [bankDetailQuery.data]);

  const exportBank = () => {
    if (!activeBankId) return;
    window.open(
      `/api/sections/gestion-academique/vie-scolaire/qcm-banks/${activeBankId}/export`,
      '_blank',
    );
  };

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="space-y-3 py-4">
        <div className="flex items-start gap-2">
          <BookOpen className="size-4 mt-0.5 text-muted-foreground shrink-0" />
          <div>
            <CardTitle className="text-base">Banque QCM par formation / UV</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Questions réutilisables pour session blanche et export JSON (sans correction affichée).
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-1 min-w-[200px] flex-1 sm:max-w-xs">
            <Label>Formation</Label>
            <Select
              value={formationId || '__none__'}
              onValueChange={(v) => {
                const id = v === '__none__' ? '' : v;
                setFormationId(id);
                setSelectedBankId(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Sélectionner —</SelectItem>
                {(formationsQuery.data ?? []).map((f) => (
                  <SelectItem key={f.formationId} value={f.formationId}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {formationId ? (
            <>
              <div className="space-y-1 min-w-[200px] sm:max-w-xs">
                <Label>Banque</Label>
                <Select
                  value={activeBankId ?? '__none__'}
                  onValueChange={(v) => setSelectedBankId(v === '__none__' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Banque QCM" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        Aucune banque
                      </SelectItem>
                    ) : (
                      banks.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.title} ({b.itemCount})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => createBankMutation.mutate()}
                disabled={createBankMutation.isPending}
              >
                <Plus className="size-4" />
                Nouvelle banque
              </Button>
              {activeBankId ? (
                <Button variant="outline" size="sm" className="gap-1" onClick={exportBank}>
                  <Download className="size-4" />
                  Export JSON
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-5">
        {!formationId ? (
          <p className="text-sm text-muted-foreground">Sélectionnez une formation pour gérer la banque QCM.</p>
        ) : !activeBankId ? (
          <p className="text-sm text-muted-foreground">
            Aucune banque pour cette formation. Créez-en une ou lancez le seed (`pnpm db:seed`).
          </p>
        ) : (
          <>
            <div className="rounded-lg border border-border divide-y max-h-64 overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground">Aucune question dans cette banque.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="px-3 py-2 text-sm space-y-1">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground tabular-nums">#{item.position}</span>
                      {item.tags[0] || item.chapter?.title ? (
                        <span className="text-[10px] uppercase font-bold text-primary/80">
                          {item.chapter?.title ?? item.tags[0]}
                        </span>
                      ) : null}
                    </div>
                    <p>{item.prompt}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.choices.length} propositions · bonne réponse n°{item.correctIndex + 1}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-lg border border-dashed border-border p-3 space-y-3 bg-muted/20">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ajouter une question
              </p>
              <div className="space-y-1">
                <Label>UV / tag (ex. UV1, fondamentaux)</Label>
                <Input value={newUvTag} onChange={(e) => setNewUvTag(e.target.value)} placeholder="UV1" />
              </div>
              <div className="space-y-1">
                <Label>Énoncé</Label>
                <Textarea value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} rows={2} />
              </div>
              <div className="space-y-1">
                <Label>Réponses (une par ligne)</Label>
                <Textarea value={newChoices} onChange={(e) => setNewChoices(e.target.value)} rows={4} />
              </div>
              <div className="space-y-1 max-w-[120px]">
                <Label>Index bonne réponse (0-based)</Label>
                <Input
                  type="number"
                  min={0}
                  value={newCorrectIndex}
                  onChange={(e) => setNewCorrectIndex(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                className="gap-1"
                onClick={() => addQuestionMutation.mutate()}
                disabled={addQuestionMutation.isPending || !newPrompt.trim()}
              >
                <Plus className="size-4" />
                Ajouter
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
