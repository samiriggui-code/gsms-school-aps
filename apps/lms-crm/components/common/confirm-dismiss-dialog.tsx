'use client';

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
import { useTranslation } from '@/hooks/useTranslation';

interface ConfirmDismissDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDismissDialog = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: ConfirmDismissDialogProps) => {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="md:max-w-[375px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirmDismiss.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('confirmDismiss.description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{t('confirmDismiss.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{t('confirmDismiss.confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
