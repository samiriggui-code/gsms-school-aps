'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { useSettings } from '../settings-context';

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '{}';
  }
}

export function AdministrativeDossierSettingsSection() {
  const { settings } = useSettings();
  const qc = useQueryClient();
  const [raw, setRaw] = useState('{}');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRaw(formatJson(settings?.administrativeDossier));
  }, [settings?.administrativeDossier]);

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await apiFetch(
        '/api/sections/securite-configuration/parametres/settings/administrative-dossier',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ administrativeDossier: payload }),
        },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message ?? 'Enregistrement impossible');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Dossier administratif enregistré');
      qc.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSave() {
    setError(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed === null || Array.isArray(parsed)) {
        setError('Le JSON doit être un objet (ex. { "pieces": [] }).');
        return;
      }
    } catch {
      setError('JSON invalide — vérifiez la syntaxe.');
      return;
    }
    saveMutation.mutate(parsed);
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base">Dossier administratif</CardTitle>
        <CardDescription>
          Métadonnées JSON des pièces réglementaires (NDA, Qualiopi, assurances, agréments). Stocké
          dans SystemSetting.administrativeDossier. Pour le dépôt de fichiers structuré, voir{' '}
          <a
            href="/gestion-ressources/compagnie/documents"
            className="font-medium text-primary hover:underline"
          >
            Compagnie → Documents
          </a>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-0 pb-0">
        <div className="space-y-2">
          <Label htmlFor="administrative-dossier-json">Contenu JSON</Label>
          <Textarea
            id="administrative-dossier-json"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={14}
            className="font-mono text-xs leading-relaxed"
            spellCheck={false}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            Enregistrer le dossier
          </Button>
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => setRaw(formatJson(settings?.administrativeDossier))}
          >
            Réinitialiser
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
