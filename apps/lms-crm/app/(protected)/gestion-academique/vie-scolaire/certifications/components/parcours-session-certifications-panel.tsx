'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

type AttestationRow = {
  id: string;
  title: string;
  issueDate: string;
  user: { name: string | null; email: string };
  formation: { name: string };
  candidature: { id: string; status: string } | null;
};

export function ParcoursSessionCertificationsPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [candidatureId, setCandidatureId] = useState('');
  const [title, setTitle] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['vie-scolaire', 'certifications'],
    queryFn: async () => {
      const res = await apiFetch(
        '/api/sections/gestion-academique/vie-scolaire/certifications?limit=30',
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Chargement impossible');
      return body.data as { items: AttestationRow[] };
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidatureId: candidatureId.trim(), title: title.trim() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Création impossible');
      return body.data;
    },
    onSuccess: () => {
      toast.success(t('academic.certificationSaved'));
      setTitle('');
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'certifications'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Délivrer une attestation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="candidatureId">ID candidature</Label>
            <Input
              id="candidatureId"
              value={candidatureId}
              onChange={(e) => setCandidatureId(e.target.value)}
              placeholder="UUID dossier candidature"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Intitulé attestation</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Attestation SSI — session mars 2026"
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!candidatureId.trim() || !title.trim() || createMutation.isPending}
            >
              Enregistrer l&apos;attestation
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attestations délivrées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune attestation pour le moment.</p>
          ) : (
            items.map((row) => (
              <div key={row.id} className="rounded-lg border border-border p-3">
                <p className="font-medium">{row.title}</p>
                <p className="text-sm text-muted-foreground">
                  {row.user.name || row.user.email} — {row.formation.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(row.issueDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
