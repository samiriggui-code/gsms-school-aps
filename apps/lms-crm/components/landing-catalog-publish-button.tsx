'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Construction, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { cn } from '@/lib/utils';

type LandingConfigData = {
  enabled: boolean;
  updatedAt: string;
};

async function fetchLandingConfig(): Promise<LandingConfigData> {
  const res = await apiFetch('/api/sections/communication-contenu/cms/landing-config');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as { error?: { message?: string } }).error?.message ?? 'Configuration introuvable',
    );
  }
  return unwrapSectionApiData<LandingConfigData>(json);
}

type Props = {
  className?: string;
  /** Affiche le badge d'état à côté du bouton */
  showStatus?: boolean;
};

/**
 * Bascule maintenance / publication du landing depuis le catalogue formations.
 * Workflow : maintenance → éditer le catalogue → republier.
 */
export function LandingCatalogPublishButton({ className, showStatus = true }: Props) {
  const qc = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['landing-config'] as const,
    queryFn: fetchLandingConfig,
    staleTime: 30_000,
  });

  const enabled = data?.enabled ?? true;
  const busy = isLoading || isFetching;

  async function togglePublish() {
    const next = !enabled;
    const res = await apiFetch('/api/sections/communication-contenu/cms/landing-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: next }),
    });
    if (!res.ok) {
      toast.error(next ? 'Publication impossible' : 'Maintenance impossible');
      return;
    }
    toast.success(
      next
        ? 'Landing republiée — le catalogue actif est visible sur le site'
        : 'Landing en maintenance — vous pouvez modifier le catalogue en toute sécurité',
    );
    await qc.invalidateQueries({ queryKey: ['landing-config'] });
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {showStatus ? (
        <Badge variant={enabled ? 'success' : 'warning'} className="hidden sm:inline-flex">
          {enabled ? 'Landing en ligne' : 'Landing en maintenance'}
        </Badge>
      ) : null}
      <Button
        type="button"
        variant={enabled ? 'outline' : 'primary'}
        className="gap-2"
        disabled={busy}
        onClick={() => void togglePublish()}
      >
        {enabled ? (
          <>
            <Construction className="size-4" />
            Mettre le landing en maintenance
          </>
        ) : (
          <>
            <Globe className="size-4" />
            Republier le catalogue sur le landing
          </>
        )}
      </Button>
    </div>
  );
}
