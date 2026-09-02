'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { VIE_SCOLAIRE_SHEET_MEDIUM } from '@/app/(protected)/gestion-academique/vie-scolaire/constants/sheet-shell-classes';
import { UserRole } from '@/app/models/user';
import { useSchoolRoleSelectQuery } from '../../roles/hooks/use-role-select-query';
import { UserAddSchema, UserAddSchemaType } from '../forms/user-add-schema';

const UserAddDialog = ({
  open,
  closeDialog,
}: {
  open: boolean;
  closeDialog: () => void;
}) => {
  const queryClient = useQueryClient();
  const { data: roleList } = useSchoolRoleSelectQuery();

  const form = useForm<UserAddSchemaType>({
    resolver: zodResolver(UserAddSchema),
    defaultValues: { name: '', email: '', roleId: '' },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) form.reset();
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: async (values: UserAddSchemaType) => {
      const response = await apiFetch('/api/sections/securite-configuration/acces/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Utilisateur créé</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
      queryClient.invalidateQueries({ queryKey: ['user-users'] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
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

  const isProcessing = mutation.status === 'pending';

  return (
    <Sheet open={open} onOpenChange={(v) => !v && closeDialog()}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_MEDIUM}>
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>Nouvel utilisateur</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="flex min-h-0 flex-1 flex-col"
          >
            <SheetBody className="space-y-6 px-5 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom complet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@ecole.local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {roleList?.map((role: UserRole) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SheetBody>
            <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-4">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Annuler
              </Button>
              <Button type="submit" disabled={!form.formState.isDirty || isProcessing}>
                {isProcessing && <LoaderCircleIcon className="animate-spin" />}
                Créer
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default UserAddDialog;
