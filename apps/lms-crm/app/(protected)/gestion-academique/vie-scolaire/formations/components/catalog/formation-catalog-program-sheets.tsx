'use client';

import type {
  CatalogProgramOpen,
  FormationVitrineItem,
} from '../../data/formation-vitrine-catalog';
import { FormationProgramSheetCustomer } from '../sheets/customer/formation-program-sheet-customer';

type Props = {
  active: CatalogProgramOpen | null;
  selectedFormation: FormationVitrineItem | null;
  sheetMode: 'view' | 'edit';
  onClose: () => void;
};

function closeWhenFalse(onClose: () => void, open: boolean) {
  if (!open) onClose();
}

/**
 * Liste catalogue CRM : une seule sheet (`FormationProgramSheetCustomer`), même flux que « Ajouter au catalogue » / TFP APS.
 */
export function FormationCatalogProgramSheets({
  active,
  selectedFormation,
  sheetMode,
  onClose,
}: Props) {
  return (
    <FormationProgramSheetCustomer
      open={active?.sheet === 'customer'}
      onOpenChange={(open) => closeWhenFalse(onClose, open)}
      formation={selectedFormation}
      mode={sheetMode}
    />
  );
}
