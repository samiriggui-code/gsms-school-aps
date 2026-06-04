'use client';

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type Dataset = { id: string; label: string; description: string };

export function PilotageExportSection() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['pilotage-export-catalog'] as const,
    queryFn: async () => {
      const res = await apiFetch('/api/sections/pilotage-supervision/performance/export');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Erreur');
      return unwrapSectionApiData<{ datasets: Dataset[] }>(json);
    },
  });

  const datasets = data?.datasets ?? [];

  const download = useCallback(async (id: string, label: string) => {
    setDownloading(id);
    try {
      const res = await apiFetch(`/api/sections/pilotage-supervision/performance/export?dataset=${id}`);
      if (!res.ok) {
        toast.error(`Export ${label} impossible`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${label} exporté`);
    } catch {
      toast.error(`Export ${label} impossible`);
    } finally {
      setDownloading(null);
    }
  }, []);

  if (datasets.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">Exports CSV</h3>
        <p className="text-sm text-muted-foreground">
          Extractions opérationnelles — leads, devis, tickets, candidatures, audit, paiements.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {datasets.map((d) => (
          <Card key={d.id}>
            <CardHeader>
              <CardTitle className="text-base">{d.label}</CardTitle>
              <CardDescription>{d.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                disabled={downloading === d.id}
                onClick={() => download(d.id, d.label)}
              >
                <Download className="size-4" />
                {downloading === d.id ? 'Export…' : 'Télécharger CSV'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
