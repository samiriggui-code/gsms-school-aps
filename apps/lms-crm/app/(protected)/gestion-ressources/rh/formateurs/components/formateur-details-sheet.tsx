'use client';

/**
 * Une seule implémentation de fiche (shell, conformité agrément formateur, bannières) :
 * `CollaborateurDetailsSheet` avec `variant="formateur"`.
 *
 * Anciennement un doublon de ~800 lignes provoquait une UI différente selon que l’on ouvrait
 * la liste Formateurs ou un accès via « collaborateurs » / RH synthèse (ex. mêmes onglets
 * mais `FormateurDetailsOverview` ≠ `CollaborateurDetailsOverview`).
 */
import type { User as Collaborateur } from '@/app/models/user';
import { CollaborateurDetailsSheet } from '../../collaborateurs/components/collaborateur-details-sheet';

export interface FormateurDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborateur: Collaborateur | null;
  onEditClick?: () => void;
}

export function FormateurDetailsSheet({
  open,
  onOpenChange,
  collaborateur,
  onEditClick,
}: FormateurDetailsSheetProps) {
  return (
    <CollaborateurDetailsSheet
      open={open}
      onOpenChange={onOpenChange}
      collaborateur={collaborateur}
      onEditClick={onEditClick}
      variant="formateur"
    />
  );
}
