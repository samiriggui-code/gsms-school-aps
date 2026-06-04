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
} from '@/components/ui/alert-dialog';

type EquipmentDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label?: string;
  isPending?: boolean;
  onConfirm: () => void;
};

export function EquipmentDeleteDialog({
  open,
  onOpenChange,
  label,
  isPending,
  onConfirm,
}: EquipmentDeleteDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('equipment.deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {label
              ? t('equipment.deleteDescription', { label })
              : t('equipment.deleteDescriptionGeneric')}
          </AlertDialogDescription>
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
