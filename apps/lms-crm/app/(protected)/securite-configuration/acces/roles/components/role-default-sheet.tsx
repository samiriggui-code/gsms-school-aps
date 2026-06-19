'use client';

import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { UserRole } from '@/app/models/user';
import {
  IAM_SHEET_BODY,
  IAM_SHEET_CONTENT,
  IAM_SHEET_FOOTER,
  IAM_SHEET_HEADER,
  IAM_SHEET_TITLE,
} from '../../components/iam-sheet-shell';

const RoleDefaultSheet = ({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: UserRole;
}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(
        `/api/sections/securite-configuration/acces/roles/${id}/default`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' } },
      );
      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Rôle par défaut mis à jour</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive">
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{error.message}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={IAM_SHEET_CONTENT}>
        <SheetHeader className={IAM_SHEET_HEADER}>
          <SheetTitle className={IAM_SHEET_TITLE}>Rôle par défaut</SheetTitle>
        </SheetHeader>
        <SheetBody className={IAM_SHEET_BODY}>
          <div className="px-4 py-8 sm:px-5">
            <p className="text-sm text-muted-foreground">
              Définir <strong className="text-foreground">{role.name}</strong> comme rôle
              attribué automatiquement aux nouveaux comptes ?
            </p>
          </div>
        </SheetBody>
        <SheetFooter className={IAM_SHEET_FOOTER}>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            className="ms-auto"
            onClick={() => mutation.mutate(role.id)}
            disabled={mutation.status === 'pending'}
          >
            {mutation.status === 'pending' && (
              <LoaderCircleIcon className="animate-spin" />
            )}
            Confirmer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default RoleDefaultSheet;
