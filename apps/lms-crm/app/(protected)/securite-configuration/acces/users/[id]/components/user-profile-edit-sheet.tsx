'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoaderCircleIcon, Mail, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { User, UserRole } from '@/app/models/user';
import { useSchoolRoleSelectQuery } from '@/app/(protected)/securite-configuration/acces/roles/hooks/use-role-select-query';
import {
  UserProfileSchema,
  UserProfileSchemaType,
} from '@/app/(protected)/securite-configuration/acces/users/[id]/forms/user-profile-schema';
import { USER_IAM_EDITABLE_STATUSES, UserStatusProps } from '@/app/(protected)/securite-configuration/acces/users/constants/status';
import { RoleToggleBadges } from '@/components/iam/role-toggle-badges';
import { PermissionToggleMatrix } from '@/components/iam/permission-toggle-matrix';
import { permissionSlugsFromRole } from '@/components/iam/role-permissions-matrix';
import { resolveRolePermissionRows } from '@/lib/iam/serialize-user-role';
import {
  IAM_SHEET_BODY,
  IAM_SHEET_CONTENT,
  IAM_SHEET_FOOTER,
  IAM_SHEET_HEADER,
  IAM_SHEET_TITLE,
} from '../../../components/iam-sheet-shell';

type EditUser = User & {
  role?: UserRole & { permissions?: unknown[] };
};

const UserProfileEditSheet = ({
  open,
  onOpenChange,
  user,
  onUserUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: EditUser | null;
  onUserUpdated?: () => void;
}) => {
  const queryClient = useQueryClient();
  const { data: roleList } = useSchoolRoleSelectQuery();
  const [isSendingReset, setIsSendingReset] = useState(false);

  const { data: fetchedUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user-user', user?.id],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/securite-configuration/acces/users/${user?.id}`,
      );
      if (!res.ok) throw new Error('Impossible de charger l’utilisateur');
      return res.json() as Promise<EditUser>;
    },
    enabled: open && !!user?.id,
  });

  const effectiveUser = fetchedUser ?? user;

  const form = useForm<UserProfileSchemaType>({
    resolver: zodResolver(UserProfileSchema),
    defaultValues: {
      name: '',
      roleId: '',
      status: '',
    },
    mode: 'onSubmit',
  });

  const selectedRoleId = form.watch('roleId');

  const { data: previewRole } = useQuery({
    queryKey: ['user-role-preview', selectedRoleId],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/securite-configuration/acces/roles/${selectedRoleId}`,
      );
      if (!res.ok) throw new Error('Rôle introuvable');
      return res.json() as Promise<UserRole & { permissions?: unknown[] }>;
    },
    enabled: open && !!selectedRoleId,
  });

  const previewSlugs = useMemo(() => {
    if (previewRole) {
      return resolveRolePermissionRows(previewRole).map((p) => p.slug);
    }
    if (effectiveUser?.role && effectiveUser.role.id === selectedRoleId) {
      return resolveRolePermissionRows(effectiveUser.role).map((p) => p.slug);
    }
    return permissionSlugsFromRole(previewRole ?? null);
  }, [previewRole, effectiveUser?.role, selectedRoleId]);

  useEffect(() => {
    if (!open || !effectiveUser) return;
    form.reset({
      name: effectiveUser.name || '',
      roleId: effectiveUser.roleId || effectiveUser.role?.id || '',
      status: (effectiveUser.status || '').toUpperCase(),
    });
  }, [open, effectiveUser, form]);

  const mutation = useMutation({
    mutationFn: async (values: UserProfileSchemaType) => {
      if (!effectiveUser?.id) throw new Error('Utilisateur introuvable');
      const response = await apiFetch(
        `/api/sections/securite-configuration/acces/users/${effectiveUser.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        },
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
            <AlertTitle>Utilisateur mis à jour</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
      queryClient.invalidateQueries({ queryKey: ['user-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-user', effectiveUser?.id] });
      onUserUpdated?.();
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

  const archiveMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveUser?.id) throw new Error('Utilisateur introuvable');
      const response = await apiFetch(
        `/api/sections/securite-configuration/acces/users/${effectiveUser.id}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Compte archivé');
      queryClient.invalidateQueries({ queryKey: ['user-users'] });
      onUserUpdated?.();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSendPasswordReset = async () => {
    if (!effectiveUser?.email) return;
    setIsSendingReset(true);
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: effectiveUser.email }),
      });
      if (!res.ok) throw new Error('Envoi impossible');
      toast.success('Lien de réinitialisation envoyé par e-mail');
    } catch {
      toast.error('Échec de l’envoi du mail de réinitialisation');
    } finally {
      setIsSendingReset(false);
    }
  };

  if (!user) return null;

  const roles =
    roleList?.map((role: UserRole) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
    })) ?? [];

  const isProcessing = mutation.isPending || archiveMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={IAM_SHEET_CONTENT}>
        <SheetHeader className={IAM_SHEET_HEADER}>
          <SheetTitle className={IAM_SHEET_TITLE}>Modifier l&apos;utilisateur</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="flex min-h-0 flex-1 flex-col"
          >
            <SheetBody className={IAM_SHEET_BODY}>
              <ScrollArea className="mx-1.5 flex min-h-0 flex-1 flex-col px-3.5 py-5">
                {isLoadingUser ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    Chargement du profil…
                  </div>
                ) : (
                  <div className="space-y-6 pb-4">
                    {mutation.status === 'error' && (
                      <Alert variant="destructive">
                        <AlertDescription>{mutation.error.message}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Identité
                      </h4>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom affiché</FormLabel>
                            <FormControl>
                              <Input placeholder="Nom complet" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="space-y-1.5">
                        <FormLabel>E-mail</FormLabel>
                        <Input value={effectiveUser?.email ?? ''} disabled readOnly />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Rôle IAM
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          Cliquez un badge pour sélectionner le rôle
                        </span>
                      </div>
                      <RoleToggleBadges
                        roles={roles}
                        assignedRoleIds={selectedRoleId ? [selectedRoleId] : []}
                        onToggle={(roleId) => {
                          form.setValue('roleId', roleId, { shouldDirty: true });
                        }}
                      />
                      <FormField
                        control={form.control}
                        name="roleId"
                        render={({ field }) => (
                          <FormItem className="hidden">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <p className="text-xs text-muted-foreground">
                        Les permissions ne se règlent pas par utilisateur : elles sont
                        héritées du rôle (matrice IAM → onglet Rôles).
                      </p>
                    </div>

                    <div className="space-y-3 rounded-md border border-border bg-accent/20 p-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Permissions héritées (aperçu)
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Vert = incluse dans le rôle sélectionné · rouge = absente
                      </p>
                      {selectedRoleId ? (
                        <PermissionToggleMatrix assignedSlugs={previewSlugs} readOnly />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Sélectionnez un rôle pour prévisualiser les permissions.
                        </p>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Statut du compte
                      </h4>
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choisir un statut" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    {USER_IAM_EDITABLE_STATUSES.map((status) => (
                                      <SelectItem key={status} value={status}>
                                        {UserStatusProps[status].label}
                                        {UserStatusProps[status].description
                                          ? ` — ${UserStatusProps[status].description}`
                                          : ''}
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
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            form.setValue('status', 'ACTIVE', { shouldDirty: true })
                          }
                        >
                          Activer
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            form.setValue('status', 'BLOCKED', { shouldDirty: true })
                          }
                        >
                          Suspendre
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            form.setValue('status', 'INACTIVE', { shouldDirty: true })
                          }
                        >
                          Désactiver
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Sécurité
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSendingReset || !effectiveUser?.email}
                        onClick={handleSendPasswordReset}
                      >
                        {isSendingReset ? (
                          <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
                        ) : (
                          <Mail className="mr-2 size-4" />
                        )}
                        Envoyer un lien de réinitialisation du mot de passe
                      </Button>

                      <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Shield className="size-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            Double authentification (2FA)
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            À venir
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Prochaine étape : page dédiée dans le groupe Auth (codes OTP par
                          e-mail, puis WhatsApp / SMS). Nécessite une extension du schéma
                          Prisma et le branchement du fournisseur de messages.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </SheetBody>

            <SheetFooter className={IAM_SHEET_FOOTER}>
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                {!effectiveUser?.isProtected ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    disabled={isProcessing}
                    onClick={() => {
                      if (
                        window.confirm(
                          'Archiver ce compte ? Il sera désactivé et retiré de la liste active.',
                        )
                      ) {
                        archiveMutation.mutate();
                      }
                    }}
                  >
                    Archiver
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  size="sm"
                  disabled={!form.formState.isDirty || isProcessing || isLoadingUser}
                >
                  {isProcessing && <LoaderCircleIcon className="mr-2 size-4 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default UserProfileEditSheet;
