'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/dialog';
import { Button } from '@repo/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { Label } from '@repo/ui/label';

type Candidate = {
  id: string;
  name: string;
  email: string;
  hasFormateur: boolean;
  hasCollaborateur: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
};

async function fetchCandidates(): Promise<Candidate[]> {
  const res = await apiFetch('/api/sections/communication-contenu/cms/landing-team/candidates');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as { error?: { message?: string } }).error?.message ?? 'Chargement impossible',
    );
  }
  const data = unwrapSectionApiData<{ items: Candidate[] }>(json);
  return data?.items ?? [];
}

export function LandingTeamAddDialog({ open, onOpenChange, onAdded }: Props) {
  const [userId, setUserId] = useState('');
  const [volet, setVolet] = useState<'direction' | 'formateur' | 'pedagogique' | 'rh'>('formateur');
  const [saving, setSaving] = useState(false);

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['landing-team-candidates'],
    queryFn: fetchCandidates,
    enabled: open,
  });

  async function handleSubmit() {
    if (!userId) {
      toast.error('Sélectionnez un membre');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch('/api/sections/communication-contenu/cms/landing-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, volet }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (json as { error?: { message?: string } }).error?.message ?? 'Ajout impossible',
        );
      }
      toast.success('Membre ajouté au catalogue (brouillon)');
      setUserId('');
      onOpenChange(false);
      onAdded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ajout impossible');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter au catalogue équipe landing</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Membre RH / formateur</Label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Chargement…
              </div>
            ) : (
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un profil" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>Volet landing</Label>
            <Select value={volet} onValueChange={(v) => setVolet(v as typeof volet)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direction">Direction</SelectItem>
                <SelectItem value="formateur">Formateurs</SelectItem>
                <SelectItem value="pedagogique">Équipe pédagogique</SelectItem>
                <SelectItem value="rh">RH & administration</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" disabled={saving || !userId} onClick={() => void handleSubmit()}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
