'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { FilePlus2, Users } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { toast } from 'sonner';
import { CRM_MARKETING_LEADS_PATH } from '@/app/(protected)/communication-contenu/marketing/formulaires-leads/constants/crm-paths';
import { financeDevisListQueryKey } from '../constants/query-keys';

export function FinanceDevisPageActions() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);

  async function createDevisOnFinancePage() {
    setCreating(true);
    try {
      const res = await apiFetch('/api/sections/administration-facturation/finance/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Création impossible.');
      }
      const data = unwrapSectionApiData<{ id: string; referenceCode?: string }>(json);
      if (!data?.id) throw new Error('Réponse serveur invalide.');
      await queryClient.invalidateQueries({ queryKey: [...financeDevisListQueryKey] });
      toast.success(data.referenceCode ? `Devis créé (${data.referenceCode}).` : 'Devis créé.');
      router.push(`${pathname}?devisId=${encodeURIComponent(data.id)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur inattendue.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        type="button"
        asChild
        title="Leads issus des formulaires landing (demandes de devis, préinscriptions)."
      >
        <Link href={CRM_MARKETING_LEADS_PATH} className="gap-2">
          <Users className="size-4" />
          Leads landing
        </Link>
      </Button>
      <Button
        variant="primary"
        type="button"
        className="gap-2"
        disabled={creating}
        onClick={createDevisOnFinancePage}
        title="Crée un brouillon vide à compléter (client + lignes catalogue)"
      >
        <FilePlus2 className="size-4" />
        {creating ? 'Création…' : 'Nouveau devis'}
      </Button>
    </>
  );
}
