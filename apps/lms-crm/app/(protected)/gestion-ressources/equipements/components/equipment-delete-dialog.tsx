'use client';

import { useTranslation } from '@/hooks/useTranslation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/alert-dialog';

type EquipmentDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label?: string;
  unitCount?: number;
  isCatalogEntry?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
};

export function EquipmentDeleteDialog({
  open,
  onOpenChange,
  label,
  unitCount,
  isCatalogEntry,
  isPending,
  onConfirm,
}: EquipmentDeleteDialogProps) {
  const { t } = useTranslation();

  const description = isCatalogEntry
    ? `Supprimer la catégorie « ${label} » et ses ${unitCount ?? 0} pièce(s) ? Cette action est irréversible.`
    : label
      ? t('equipment.deleteDescription', { label })
      : t('equipment.deleteDescriptionGeneric');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCatalogEntry ? 'Supprimer la catégorie' : t('equipment.deleteTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t('common.buttons.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {isPending ? t('crud.loading') : t('common.buttons.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
