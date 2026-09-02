'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@repo/ui/alert';
import { Button } from '@repo/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/form';
import { Input } from '@repo/ui/input';
import { VIE_SCOLAIRE_SHEET_COMPACT } from '@/app/(protected)/gestion-academique/vie-scolaire/constants/sheet-shell-classes';
import { User } from '@/app/models/user';

const EmailConfirmationSchema = (userEmail: string) =>
  z.object({
    confirmEmail: z
      .string()
      .nonempty({ message: 'L’email est requis.' })
      .email({ message: 'Email invalide.' })
      .refine((value) => value === userEmail, {
        message: 'L’email ne correspond pas.',
      }),
  });

type EmailConfirmationSchemaType = z.infer<ReturnType<typeof EmailConfirmationSchema>>;

interface UserRestoreDialogProps {
  open: boolean;
  closeDialog: () => void;
  user: User;
}

const UserRestoreDialog = ({ open, closeDialog, user }: UserRestoreDialogProps) => {
  const queryClient = useQueryClient();

  const form = useForm<EmailConfirmationSchemaType>({
    resolver: zodResolver(EmailConfirmationSchema(user.email)),
    defaultValues: { confirmEmail: '' },
    mode: 'onChange',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(
        `/api/sections/securite-configuration/acces/users/${user.id}/restore`,
        { method: 'PATCH' },
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
            <AlertTitle>Compte restauré</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
      queryClient.invalidateQueries({ queryKey: ['user-user'] });
      closeDialog();
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
    <Sheet open={open} onOpenChange={(v) => !v && closeDialog()}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_COMPACT}>
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>Restaurer le compte</SheetTitle>
        </SheetHeader>
        <SheetBody className="px-5 py-4">
          <p className="mb-4 text-sm text-muted-foreground">
            Réactiver le compte <strong className="text-foreground">{user.email}</strong> et
            toutes les données associées.
          </p>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(() => mutation.mutate())}
              className="space-y-4"
              id="user-restore-form"
            >
              <FormField
                control={form.control}
                name="confirmEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saisir l&apos;email pour confirmer</FormLabel>
                    <FormControl>
                      <Input placeholder={user.email} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </SheetBody>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" onClick={closeDialog}>
            Annuler
          </Button>
          <Button
            type="submit"
            form="user-restore-form"
            disabled={
              !form.formState.isDirty ||
              !form.formState.isValid ||
              mutation.status === 'pending'
            }
          >
            {mutation.status === 'pending' && (
              <LoaderCircleIcon className="animate-spin" />
            )}
            Restaurer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default UserRestoreDialog;
