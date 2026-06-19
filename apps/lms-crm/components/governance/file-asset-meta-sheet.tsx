'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

export type FileAssetMetaInput = {
  fileAssetId: string;
  fileName: string;
  /** Libellé métier : "CNI / Passeport", "Attestation Assurance"… */
  label?: string;
  issuedAt?: string | null;
  expiresAt?: string | null;
  issuedBy?: string | null;
  documentRef?: string | null;
};

type DocState = {
  issuedAt: string;
  expiresAt: string;
  issuedBy: string;
  documentRef: string;
  saved: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Un ou plusieurs documents. S'il y en a plusieurs → navigation interne. */
  assets: FileAssetMetaInput[];
  onAllSaved?: () => void;
  readOnly?: boolean;
};

function buildInitialState(asset: FileAssetMetaInput): DocState {
  return {
    issuedAt: asset.issuedAt ? asset.issuedAt.split('T')[0]! : '',
    expiresAt: asset.expiresAt ? asset.expiresAt.split('T')[0]! : '',
    issuedBy: asset.issuedBy ?? '',
    documentRef: asset.documentRef ?? '',
    saved: false,
  };
}

function DatePicker({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const parsed = value ? parseISO(value) : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal h-9',
              !value && 'text-muted-foreground',
            )}
            disabled={disabled}
          >
            <CalendarIcon className="me-2 size-4" />
            {parsed ? format(parsed, 'dd MMMM yyyy', { locale: fr }) : 'jj/mm/aaaa'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parsed}
            onSelect={(d) => onChange(d ? d.toISOString().split('T')[0]! : '')}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ExpiryWarning({ expiresAt }: { expiresAt: string }) {
  const expiry = parseISO(expiresAt);
  const diffDays = Math.ceil((expiry.getTime() - Date.now()) / 86400000);

  if (diffDays < 0) {
    return (
      <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
        Ce document est <strong>expiré</strong> depuis le{' '}
        {format(expiry, 'dd MMMM yyyy', { locale: fr })}.
      </p>
    );
  }
  if (diffDays <= 60) {
    return (
      <p className="rounded-md border border-yellow-400/40 bg-yellow-50 px-3 py-2 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
        Expire dans <strong>{diffDays} jour{diffDays > 1 ? 's' : ''}</strong> —{' '}
        {format(expiry, 'dd MMMM yyyy', { locale: fr })}.
      </p>
    );
  }
  return null;
}

export function FileAssetMetaSheet({
  open,
  onOpenChange,
  assets,
  onAllSaved,
  readOnly = false,
}: Props) {
  const [index, setIndex] = useState(0);
  const [states, setStates] = useState<DocState[]>([]);
  const [saving, setSaving] = useState(false);

  /* Re-init quand la liste change (nouvelle ouverture) */
  useEffect(() => {
    if (!open) return;
    setIndex(0);
    setStates(assets.map(buildInitialState));
  }, [open, assets]);

  if (!assets.length || !states.length) return null;

  const current = assets[index]!;
  const currentState = states[index]!;
  const total = assets.length;

  function updateCurrent(patch: Partial<DocState>) {
    setStates((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }

  async function handleSaveAll() {
    setSaving(true);
    let allOk = true;

    const updated = [...states];

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i]!;
      const s = updated[i]!;
      if (s.saved) continue;

      try {
        const res = await apiFetch(`/api/common/files/${asset.fileAssetId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            issuedAt: s.issuedAt || null,
            expiresAt: s.expiresAt || null,
            issuedBy: s.issuedBy.trim() || null,
            documentRef: s.documentRef.trim() || null,
          }),
        });
        if (!res.ok) throw new Error();
        updated[i] = { ...s, saved: true };
      } catch {
        allOk = false;
        toast.error(`Erreur lors de l'enregistrement : ${asset.label ?? asset.fileName}`);
      }
    }

    setStates(updated);
    setSaving(false);

    if (allOk) {
      toast.success(
        total === 1
          ? 'Informations du document enregistrées.'
          : `${total} documents enregistrés avec succès.`,
      );
      onAllSaved?.();
      onOpenChange(false);
    }
  }

  function handleIgnore() {
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        {/* Header */}
        <SheetHeader className="border-b border-border px-5 py-4 text-start">
          <SheetTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 shrink-0 text-primary" />
            Informations des documents
          </SheetTitle>
          <p className="text-xs text-muted-foreground pt-0.5">
            Renseignez les informations de chaque document chargé. Elles seront utilisées par le
            moteur de conformité pour vérifier la validité et envoyer des alertes d&apos;expiration.
          </p>
        </SheetHeader>

        <SheetBody className="flex-1 overflow-y-auto">
          {/* Navigation tabs (quand plusieurs documents) */}
          {total > 1 && (
            <div className="border-b border-border px-5 py-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
                className="size-7 flex items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>

              <div className="flex flex-1 gap-1.5 overflow-x-auto">
                {assets.map((a, i) => (
                  <button
                    key={a.fileAssetId}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={cn(
                      'flex-1 min-w-0 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border text-[11px] font-medium transition-colors truncate',
                      i === index
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:bg-accent',
                    )}
                  >
                    {states[i]?.saved && (
                      <CheckCircle2 className="size-3 shrink-0 text-green-500" />
                    )}
                    <span className="truncate">{a.label ?? a.fileName}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                disabled={index === total - 1}
                className="size-7 flex items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}

          {/* Formulaire du document actif */}
          <div className="px-5 py-5 space-y-4">
            {/* Nom du fichier */}
            <div className="rounded-md border border-border bg-secondary/20 px-3 py-2 flex items-center gap-2">
              <FileText className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{current.fileName}</span>
            </div>

            {total > 1 && (
              <p className="text-[11px] font-semibold text-foreground uppercase tracking-widest">
                {current.label ?? `Document ${index + 1} / ${total}`}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <DatePicker
                label="Date d'émission"
                value={currentState.issuedAt}
                onChange={(v) => updateCurrent({ issuedAt: v })}
                disabled={readOnly}
              />
              <DatePicker
                label="Date d'expiration"
                value={currentState.expiresAt}
                onChange={(v) => updateCurrent({ expiresAt: v })}
                disabled={readOnly}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Émetteur / organisme</Label>
              <Input
                placeholder="ex. Préfecture du Var, CNAPS, INRS…"
                value={currentState.issuedBy}
                onChange={(e) => updateCurrent({ issuedBy: e.target.value })}
                disabled={readOnly}
                className="h-9"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Référence / numéro</Label>
              <Input
                placeholder="ex. AP-2024-0312, N° carte…"
                value={currentState.documentRef}
                onChange={(e) => updateCurrent({ documentRef: e.target.value })}
                disabled={readOnly}
                className="h-9"
              />
            </div>

            {currentState.expiresAt && <ExpiryWarning expiresAt={currentState.expiresAt} />}
          </div>
        </SheetBody>

        {!readOnly && (
          <SheetFooter className="border-t border-border px-5 py-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleIgnore}
              disabled={saving}
            >
              Ignorer
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleSaveAll}
              disabled={saving}
            >
              {saving ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
              {total > 1 ? `Enregistrer les ${total} documents` : 'Enregistrer'}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
