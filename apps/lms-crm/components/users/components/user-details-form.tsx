'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { getInitials, getAvatarUrl } from '@/lib/helpers';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoaderCircleIcon, Mail, MapPin, Fingerprint, Shield, CloudUpload } from 'lucide-react';
import { User } from '@/app/models/user';
import { CollaborateurEditSchema, CollaborateurEditSchemaType } from '@/app/(protected)/gestion-ressources/rh/collaborateurs/forms/collaborateur-edit-schema';
import { useRoleSelectQuery } from '@/app/(protected)/securite-configuration/acces/roles/hooks/use-role-select-query';
import { Separator } from '@/components/ui/separator';
import {
  showsCollaboratorAgrementSchedulingSection,
  showsUserStaffEmployerFields,
} from '@/lib/rh-agrement';
import { userIamLoginSubtitle } from '@/lib/user-email-routing';
import {
  CONTRACT_TYPE_VALUES,
  WORK_TIME_TYPE_VALUES,
  rhEnumFieldOrNull,
} from '@/lib/rh-form-schema-shared';

interface UserDetailsFormProps {
  user: User;
  formRef?: React.RefObject<HTMLFormElement | null>;
  onSuccess?: () => void;
}

export function UserDetailsForm({ user, formRef, onSuccess }: UserDetailsFormProps) {
  const queryClient = useQueryClient();
  const { data: roleList } = useRoleSelectQuery();

  const [avatarExistingPreview, setAvatarExistingPreview] = useState<string | null>(user.avatar ? getAvatarUrl(user.avatar) : null);
  const [avatarAttachedPreview, setAvatarAttachedPreview] = useState<string | null>(null);
  const avatarFileRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<CollaborateurEditSchemaType>({
    resolver: zodResolver(CollaborateurEditSchema),
    defaultValues: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      proEmail: user.proEmail || '',
      phone: user.phone || '',
      roleId: user.role?.id || '',
      userCategory: (user.userCategory as CollaborateurEditSchemaType['userCategory']) || 'INTERNAL',
      jobFunction: user.jobFunction || '',
      qualification: user.qualification || '',
      status: (user.status?.toUpperCase() as CollaborateurEditSchemaType['status']) || 'ACTIVE',
      birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
      birthPlace: user.birthPlace || '',
      nationality: user.nationality || '',
      socialSecurityNumber: user.socialSecurityNumber || '',
      cniNumber: user.cniNumber || '',
      residencePermitNumber: user.residencePermitNumber || '',
      residencePermitExpiry: user.residencePermitExpiry ? new Date(user.residencePermitExpiry).toISOString().split('T')[0] : '',
      contractType: rhEnumFieldOrNull(user.contractType, CONTRACT_TYPE_VALUES),
      workTimeType: rhEnumFieldOrNull(user.workTimeType, WORK_TIME_TYPE_VALUES),
      contractStartDate: user.contractStartDate ? new Date(user.contractStartDate).toISOString().split('T')[0] : '',
      contractEndDate: user.contractEndDate ? new Date(user.contractEndDate).toISOString().split('T')[0] : '',
      address: user.address || '',
      city: user.city || '',
      postalCode: user.postalCode || '',
      carteProNumber: user.carteProNumber || '',
      carteProExpiry: user.carteProExpiry ? new Date(user.carteProExpiry).toISOString().split('T')[0] : '',
      isSchedulable: user.isSchedulable ?? true,
      avatarFile: null,
      avatarAction: '',
      documentCni: null,
      documentAssurance: null,
      documentResidencePermit: null,
      documentCartePro: null,
    },
    mode: 'onSubmit',
  });

  const watchedRoleId = form.watch('roleId');
  const effectiveRoleSlug = useMemo(() => {
    const fromSelect = roleList?.find((r: { id: string; slug?: string | null }) => r.id === watchedRoleId)?.slug;
    return fromSelect ?? user.role?.slug ?? null;
  }, [roleList, watchedRoleId, user.role?.slug]);

  const showStaffEmployerFields = showsUserStaffEmployerFields(effectiveRoleSlug);
  const showAgrementBlock = showsCollaboratorAgrementSchedulingSection(effectiveRoleSlug);

  const carteProNumber = form.watch('carteProNumber');

  useEffect(() => {
    if (!showAgrementBlock) return;
    if (carteProNumber && /^CAR-\d{4}-\d{2}-\d{2}-\d{4}\d{7}$/.test(carteProNumber)) {
      const parts = carteProNumber.split('-');
      if (parts.length >= 4) {
        const year = parts[1];
        const month = parts[2];
        const day = parts[3];
        const dateStr = `${year}-${month}-${day}`;
        const currentVal = form.getValues('carteProExpiry');
        if (currentVal !== dateStr) {
          form.setValue('carteProExpiry', dateStr, { shouldValidate: true });
        }
      }
    }
  }, [carteProNumber, form, showAgrementBlock]);

  const mutation = useMutation({
    mutationFn: async (data: CollaborateurEditSchemaType) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      return apiFetch(`/users/${user.id}`, {
        method: 'PATCH',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-user', user.id] });
      toast.success('Utilisateur mis à jour avec succès');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    },
  });

  const onSubmit = (data: CollaborateurEditSchemaType) => {
    mutation.mutate(data);
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('avatarFile', file);
      form.setValue('avatarAction', 'upload');
      setAvatarAttachedPreview(URL.createObjectURL(file));
      setAvatarExistingPreview(null);
    }
  };

  const removeAvatar = () => {
    form.setValue('avatarFile', null);
    form.setValue('avatarAction', 'delete');
    setAvatarAttachedPreview(null);
    setAvatarExistingPreview(null);
    if (avatarFileRef.current) avatarFileRef.current.value = '';
  };

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
        {/* En-tête de profil */}
        <Card className="shadow-none border-border/50 bg-muted/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-background shadow-md">
                  <AvatarImage src={avatarAttachedPreview || avatarExistingPreview || (user.avatar ? getAvatarUrl(user.avatar) : '')} className="object-cover" />
                  <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                    {getInitials(
                      `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || '',
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <CloudUpload className="text-white h-6 w-6" />
                  </label>
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  ref={avatarFileRef}
                />
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <h3 className="text-xl font-bold text-foreground">
                  {form.watch('firstName')} {form.watch('lastName')}
                </h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />{' '}
                    {userIamLoginSubtitle({
                      email: form.watch('email'),
                      proEmail: form.watch('proEmail'),
                    })}
                  </span>
                  <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> {roleList?.find((r: { id: string; name?: string | null }) => r.id === form.watch('roleId'))?.name || 'Aucun rôle'}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => avatarFileRef.current?.click()}>Changer la photo</Button>
                  {(user.avatar || avatarAttachedPreview) && (
                    <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={removeAvatar}>Supprimer</Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Section 1: Informations Générales */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h4 className="text-sm font-bold uppercase tracking-wider">Informations Générales</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email personnel</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input {...field} value={field.value ?? ''} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email professionnel (connexion)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input {...field} value={field.value ?? ''} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle Accès</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {roleList?.map((role: { id: string; name?: string | null }) => (
                          <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Actif</SelectItem>
                        <SelectItem value="INACTIVE">Inactif</SelectItem>
                        <SelectItem value="BLOCKED">Bloqué</SelectItem>
                        <SelectItem value="ABSENT">Absent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showStaffEmployerFields ? (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="userCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="INTERNAL">Interne</SelectItem>
                          <SelectItem value="SUBCONTRACTOR">Sous-traitant</SelectItem>
                          <SelectItem value="CLIENT">Client</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jobFunction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fonction / Poste</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                Ce compte correspond à un{' '}
                <strong className="text-foreground">parcours inscription / élève</strong> : pas de rattachement
                employeur, contrat RH ni carte pro sur cette vue (cf. dossier candidature ou espace élève pour la
                conformité).
              </p>
            )}
          </div>

          {/* Section 2: État Civil & ID */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h4 className="text-sm font-bold uppercase tracking-wider">État Civil & Identification</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de naissance</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationalité</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showStaffEmployerFields ? (
              <FormField
                control={form.control}
                name="socialSecurityNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° Sécurité Sociale (NIR)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} value={field.value ?? ''} className="pl-10 font-mono" maxLength={15} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <div className={`grid gap-4 ${showAgrementBlock ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <FormField
                control={form.control}
                name="cniNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° CNI / Passeport</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {showAgrementBlock ? (
                <FormField
                  control={form.control}
                  name="carteProNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Réf. habilitation / agrément métier</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} placeholder="CAR-YYYY-MM-DD-… ou réf. administrative" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="grid md:grid-cols-2 gap-8">
          {showStaffEmployerFields ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h4 className="text-sm font-bold uppercase tracking-wider">Contrat &amp; RH</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contractType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de contrat</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CDI">CDI</SelectItem>
                          <SelectItem value="CDD">CDD</SelectItem>
                          <SelectItem value="INTERIM">Intérim</SelectItem>
                          <SelectItem value="STAGE">Stage</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workTimeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temps de travail</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FULL_TIME">Temps Plein</SelectItem>
                          <SelectItem value="PART_TIME">Temps Partiel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contractStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d&apos;entrée</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de fin</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ) : null}

          {/* Coordonnées & adresse (tous les rôles) */}
          <div className={`space-y-6 ${!showStaffEmployerFields ? 'md:col-span-2' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h4 className="text-sm font-bold uppercase tracking-wider">Coordonnées & Adresse</h4>
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input {...field} value={field.value ?? ''} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code Postal</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {mutation.isError && (
          <Alert variant="destructive">
            <AlertIcon><RiErrorWarningFill /></AlertIcon>
            <AlertTitle>Une erreur est survenue lors de l'enregistrement</AlertTitle>
          </Alert>
        )}

        <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-sm py-4 border-t border-border/50">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" /> : <RiCheckboxCircleFill className="mr-2 h-4 w-4" />}
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </Form>
  );
}
