'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { financeFactureDetailQueryKey, financeFactureListQueryKey } from '../constants/query-keys';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factureId: string;
  referenceCode: string;
  defaultAmount: number;
  currency: string;
};

export function FactureRecordPaymentDialog({
  open,
  onOpenChange,
  factureId,
  referenceCode,
  defaultAmount,
  currency,
}: Props) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setAmount(defaultAmount > 0 ? String(defaultAmount) : '');
    setMethod('');
    setNotes('');
  }, [open, defaultAmount, referenceCode]);

  async function submit() {
    const value = Number(amount.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Montant invalide.');
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch('/api/sections/administration-facturation/finance/paiements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: value,
          devisId: factureId,
          method: method.trim() || undefined,
          notes: notes.trim() || undefined,
          recordReceipt: true,
        }),
      });
      if (!res.ok) {
        toast.error('Impossible d’enregistrer le paiement.');
        return;
      }
      toast.success('Paiement encaissé — automatisation finance déclenchée.');
      void qc.invalidateQueries({ queryKey: [...financeFactureListQueryKey] });
      void qc.invalidateQueries({ queryKey: [...financeFactureDetailQueryKey] });
      void qc.invalidateQueries({ queryKey: ['finance-paiements'] });
      void qc.invalidateQueries({ queryKey: ['finance-budget'] });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  const moneyHint = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(defaultAmount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Encaisser un paiement</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Facture <span className="font-mono font-medium text-foreground">{referenceCode}</span>
          {defaultAmount > 0 ? (
            <>
              {' '}
              — reste dû suggéré : <span className="font-medium text-foreground">{moneyHint}</span>
            </>
          ) : null}
        </p>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="facture-pay-amount">Montant ({currency})</Label>
            <Input
              id="facture-pay-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="facture-pay-method">Mode de règlement</Label>
            <Input
              id="facture-pay-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="Virement, chèque, CB…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="facture-pay-notes">Notes</Label>
            <Textarea
              id="facture-pay-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Référence virement, échéancier…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuler
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Encaisser
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
