'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExternalLink, FileStack, FolderOpen, Mail } from 'lucide-react';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import { Textarea } from '@repo/ui/textarea';
import { formatDateTime } from '@/lib/helpers';
import type { DemandeDocumentRow } from '@/lib/governance/demandes-documents-api';

type Props = {
  row: DemandeDocumentRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendEmail: (row: DemandeDocumentRow, message?: string) => void;
  sending?: boolean;
  message: string;
  onMessageChange: (value: string) => void;
};

export function DemandeDocumentSheet({
  row,
  open,
  onOpenChange,
  onSendEmail,
  sending,
  message,
  onMessageChange,
}: Props) {
  if (!row) return null;

  const timeAgo = formatDistanceToNow(new Date(row.updatedAt), { addSuffix: true, locale: fr });
  const canSend = row.missingCount > 0 && Boolean(row.email && row.email !== '—');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4 text-start">
          <SheetTitle className="flex items-start gap-2 text-base leading-snug">
            <FileStack className="mt-0.5 size-4 shrink-0 text-primary" />
            {row.dossierKindLabel}
          </SheetTitle>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary" appearance="light" className="text-[10px] uppercase">
              {row.subjectTypeLabel}
            </Badge>
            <Badge variant="outline" appearance="light" className="text-[10px] uppercase">
              {row.completenessPct} % complété
            </Badge>
          </div>
        </SheetHeader>

        <SheetBody className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Personne concernée</p>
              <p className="font-medium">{row.personName}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">E-mail destinataire</p>
              <p className="font-medium break-all">{row.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Un seul e-mail sera envoyé à cette adresse, listant toutes les pièces ci-dessous.
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contexte</p>
              <p className="font-medium">{row.contextLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mis à jour</p>
              <p className="font-medium">{timeAgo}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(row.updatedAt)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pièces à fournir ({row.missingCount})
            </p>
            {row.missingCount === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Toutes les pièces ont déjà été demandées (statut « demandé »). Aucun nouvel e-mail
                possible tant qu’une pièce n’est pas de nouveau manquante ou rejetée.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {row.missingPieces.map((piece) => (
                  <li
                    key={piece}
                    className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                  >
                    {piece}
                  </li>
                ))}
              </ul>
            )}
            {row.requestedCount > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {row.requestedCount} pièce(s) déjà en attente de dépôt.
              </p>
            ) : null}
          </div>

          {canSend ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Message optionnel
              </p>
              <Textarea
                className="mt-2 min-h-[80px] text-sm"
                placeholder="Précision pour le destinataire (facultatif)…"
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
              />
            </div>
          ) : null}
        </SheetBody>

        <SheetFooter className="flex-col gap-2 border-t border-border px-5 py-4 sm:flex-col">
          <div className="flex w-full flex-wrap gap-2">
            {row.gedPath && row.gedPath !== '#' ? (
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href={row.gedPath}>
                  <FolderOpen className="me-1.5 size-3.5" />
                  GED
                </Link>
              </Button>
            ) : null}
            {row.editPath ? (
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href={row.editPath}>
                  <ExternalLink className="me-1.5 size-3.5" />
                  Fiche
                </Link>
              </Button>
            ) : null}
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={!canSend || sending}
            onClick={() => onSendEmail(row, message.trim() || undefined)}
          >
            <Mail className="me-2 size-4" />
            {sending
              ? 'Envoi…'
              : canSend
                ? `Envoyer 1 e-mail à ${row.email}`
                : 'Aucune pièce à relancer'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
