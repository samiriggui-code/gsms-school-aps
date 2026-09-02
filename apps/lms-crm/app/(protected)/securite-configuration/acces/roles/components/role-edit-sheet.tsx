'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircleIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@repo/ui/alert';
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
import { ScrollArea } from '@repo/ui/scroll-area';
import { Textarea } from '@repo/ui/textarea';
import { UserPermission, UserRole } from '@/app/models/user';
import { usePermissionSelectQuery } from '../../permissions/hooks/use-permission-select-query';
import { RoleSchema, RoleSchemaType } from '../forms/role-schema';
import { permissionSlugsFromRole } from '@/components/iam/role-permissions-matrix';
import { PermissionToggleMatrix } from '@/components/iam/permission-toggle-matrix';
import { isSchoolIamRoleSlug } from '@/lib/rh-iam-roles';
import {
  IAM_SHEET_BODY,
  IAM_SHEET_CONTENT,
  IAM_SHEET_FOOTER,
  IAM_SHEET_HEADER,
  IAM_SHEET_TITLE,
} from '../../components/iam-sheet-shell';

function slugsToPermissionIds(
  slugs: string[],
  permissionList: UserPermission[] | undefined,
): string[] {
  if (!permissionList?.length) return [];
  const bySlug = new Map(permissionList.map((p) => [p.slug, p.id]));
  return slugs.map((s) => bySlug.get(s)).filter((id): id is string => Boolean(id));
}

const RoleEditSheet = ({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: UserRole | null;
}) => {
  const queryClient = useQueryClient();
  const [assignedSlugs, setAssignedSlugs] = useState<string[]>([]);
  const { data: permissionList } = usePermissionSelectQuery();

  const form = useForm<RoleSchemaType>({
    resolver: zodResolver(RoleSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      permissions: [],
    },
    mode: 'onSubmit',
  });

  const isSchoolProtected =
    !!role?.isProtected && isSchoolIamRoleSlug(role?.slug ?? null);

  useEffect(() => {
    if (open) {
      const slugs = permissionSlugsFromRole(role);
      setAssignedSlugs(slugs);
      const permissionIds = slugsToPermissionIds(slugs, permissionList);
      form.reset({
        name: role?.name || '',
        slug: role?.slug || '',
        description: role?.description ?? '',
        permissions: permissionIds,
      });
    }
  }, [form, open, role, permissionList]);

  const permissionIds = useMemo(
    () => slugsToPermissionIds(assignedSlugs, permissionList),
    [assignedSlugs, permissionList],
  );

  useEffect(() => {
    form.setValue('permissions', permissionIds, { shouldDirty: true });
  }, [form, permissionIds]);

  const toggleSlug = (slug: string) => {
    setAssignedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const mutation = useMutation({
    mutationFn: async (values: RoleSchemaType) => {
      const isEdit = !!role?.id;
      const url = isEdit
        ? `/api/sections/securite-configuration/acces/roles/${role.id}`
        : '/api/sections/securite-configuration/acces/roles';
      const response = await apiFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, permissions: permissionIds }),
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
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{role?.id ? 'Rôle mis à jour' : 'Rôle créé'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center', duration: 5000 },
      );
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      if (role?.id) {
        queryClient.invalidateQueries({ queryKey: ['user-role', role.id] });
      }
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
          <SheetTitle className={IAM_SHEET_TITLE}>
            {role ? 'Modifier le rôle' : 'Nouveau rôle'}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="flex min-h-0 flex-1 flex-col"
          >
            <SheetBody className={IAM_SHEET_BODY}>
              <ScrollArea className="flex min-h-0 flex-1 flex-col px-4 py-5 sm:px-5">
                <div className="space-y-6 pb-4">
                  {mutation.status === 'error' && (
                    <Alert variant="destructive">
                      <AlertDescription>{mutation.error.message}</AlertDescription>
                    </Alert>
                  )}

                  {!role?.id ? (
                    <>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du rôle</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex. Référent pédagogique" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <FormControl>
                              <Input placeholder="ex. referent_pedagogique" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : (
                    <div className="rounded-md border border-border bg-muted/20 px-3 py-2.5 text-sm">
                      <span className="font-semibold">{role.name}</span>
                      <span className="mx-2 text-muted-foreground">·</span>
                      <span className="font-mono text-xs text-muted-foreground">{role.slug}</span>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Description métier du rôle" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Permissions — cliquer pour activer / désactiver</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Badge vert = actif · rouge = inactif
                      {isSchoolProtected
                        ? ' · Rôle système : nom et slug verrouillés, matrice modifiable.'
                        : ''}
                    </p>
                    <PermissionToggleMatrix
                      assignedSlugs={assignedSlugs}
                      onToggle={toggleSlug}
                    />
                  </div>
                </div>
              </ScrollArea>
            </SheetBody>

            <SheetFooter className={IAM_SHEET_FOOTER}>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={mutation.status === 'pending'} className="ms-auto">
                {mutation.status === 'pending' && (
                  <LoaderCircleIcon className="animate-spin" />
                )}
                Enregistrer
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default RoleEditSheet;
