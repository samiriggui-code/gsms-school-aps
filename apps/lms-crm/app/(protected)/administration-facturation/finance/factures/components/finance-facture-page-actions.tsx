'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, ReceiptText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/dialog';
import { apiFetch } from '@/lib/api';
import { CRM_MARKETING_LEADS_PATH } from '@/app/(protected)/communication-contenu/marketing/formulaires-leads/constants/crm-paths';
import { financeFactureListQueryKey } from '../constants/query-keys';

export function FinanceFacturePageActions() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [devisId, setDevisId] = useState('');

  const emit = useMutation({
    mutationFn: async () => {
      const id = devisId.trim();
      if (!id) throw new Error('ID devis requis.');
      const res = await apiFetch('/api/sections/administration-facturation/finance/factures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devisId: id, kind: 'FULL' }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error?.message ?? 'Émission impossible.');
      return j.data as { number: string; id: string };
    },
    onSuccess: (data) => {
      toast.success(`Facture ${data.number} émise`);
      setOpen(false);
      setDevisId('');
      qc.invalidateQueries({ queryKey: financeFactureListQueryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" className="gap-2">
            <Plus className="size-4" />
            Émettre une facture
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Émettre depuis un devis accepté</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="emit-devis-id">ID du devis (UUID)</Label>
            <Input
              id="emit-devis-id"
              value={devisId}
              onChange={(e) => setDevisId(e.target.value)}
              placeholder="uuid du FinanceDevis ACCEPTED"
            />
            <p className="text-xs text-muted-foreground">
              Crée une facture FULL avec numéro légal FAC-YYYY-###### (acte explicite, pas un GET).
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={() => emit.mutate()} disabled={emit.isPending || !devisId.trim()}>
              Émettre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button
        variant="outline"
        type="button"
        asChild
        title="Leads issus des formulaires landing (demandes de devis, préinscriptions)."
      >
        <Link href={CRM_MARKETING_LEADS_PATH} className="gap-2">
          <FileText className="size-4" />
          Leads landing
        </Link>
      </Button>
      <Button
        variant="outline"
        type="button"
        asChild
        title="Les devis acceptés sont la source ; émettez ensuite une facture ici."
      >
        <Link href="/administration-facturation/finance/devis" className="gap-2">
          <ReceiptText className="size-4" />
          Module Devis (source)
        </Link>
      </Button>
    </>
  );
}
