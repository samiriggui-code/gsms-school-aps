'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ControllerRenderProps, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { getInitials } from '@/lib/helpers';
import { Alert, AlertIcon, AlertTitle } from '@repo/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar';
import { Button } from '@repo/ui/button';
import {
  Card,
  CardContent,
} from '@repo/ui/card';
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { LoaderCircleIcon, Briefcase, Mail, User as UserIcon, ShieldCheck, Calendar, Hash, MapPin, CreditCard, FileText, Clock, Fingerprint, Shield, CloudUpload, Info } from 'lucide-react';
import { User as Etudiant, UserRole } from '@/app/models/user';
import { EtudiantEditSchema, EtudiantEditSchemaType } from '../forms/etudiant-edit-schema';
import { useRoleSelectQuery } from '@/app/(protected)/securite-configuration/acces/roles/hooks/use-role-select-query';
import { Separator } from '@repo/ui/separator';
import { cn } from '@/lib/utils';
import { agrementUiLabels, showsCollaboratorAgrementSchedulingSection, isParcoursApprenantRole, showsUserStaffEmployerFields } from '@/lib/rh-agrement';
import {
  COLLABORATEUR_JOB_FUNCTION_OPTIONS,
  SCHOOL_USER_CATEGORY_LABELS,
} from '@/lib/rh-school-profile-fields';

interface EtudiantDetailsSettingsProps {
  Etudiant: Etudiant;
  formRef?: React.RefObject<HTMLFormElement | null>;
  onSuccess?: () => void;
}

export function EtudiantDetailsSettings({ Etudiant, formRef, onSuccess }: EtudiantDetailsSettingsProps) {
  const queryClient = useQueryClient();
  const { data: roleList } = useRoleSelectQuery();
  const agr = agrementUiLabels(Etudiant.role?.slug);
  const learnerParcours = isParcoursApprenantRole(Etudiant.role?.slug);
  const showCollabAgrementPlanning = showsCollaboratorAgrementSchedulingSection(Etudiant.role?.slug);
  const showStaffEmployerFields = showsUserStaffEmployerFields(Etudiant.role?.slug);

  const [avatarExistingPreview, setAvatarExistingPreview] = useState<string | null>(null);
  const [avatarAttachedPreview, setAvatarAttachedPreview] = useState<string | null>(null);
  const avatarFileRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<EtudiantEditSchemaType>({
    resolver: zodResolver(EtudiantEditSchema),
    defaultValues: {
      firstName: Etudiant.firstName || '',
      lastName: Etudiant.lastName || '',
      email: Etudiant.email || '',
      roleId: Etudiant.role?.id || '',
      userCategory: (Etudiant.userCategory as EtudiantEditSchemaType['userCategory']) || 'INTERNAL',
      jobFunction: Etudiant.jobFunction || '',
      qualification: Etudiant.qualification || '',
      status: (Etudiant.status?.toUpperCase() as EtudiantEditSchemaType['status']) || 'ACTIVE',
      birthDate: Etudiant.birthDate ? new Date(Etudiant.birthDate).toISOString().split('T')[0] : '',
      birthPlace: Etudiant.birthPlace || '',
      nationality: Etudiant.nationality || '',
      socialSecurityNumber: Etudiant.socialSecurityNumber || '',
      cniNumber: Etudiant.cniNumber || '',
      residencePermitNumber: Etudiant.residencePermitNumber || '',
      residencePermitExpiry: Etudiant.residencePermitExpiry ? new Date(Etudiant.residencePermitExpiry).toISOString().split('T')[0] : '',
      contractType: Etudiant.contractType || '',
      workTimeType: Etudiant.workTimeType || '',
      contractStartDate: Etudiant.contractStartDate ? new Date(Etudiant.contractStartDate).toISOString().split('T')[0] : '',
      contractEndDate: Etudiant.contractEndDate ? new Date(Etudiant.contractEndDate).toISOString().split('T')[0] : '',
      address: Etudiant.address || '',
      city: Etudiant.city || '',
      postalCode: Etudiant.postalCode || '',
      carteProNumber: Etudiant.carteProNumber || '',
      carteProExpiry: Etudiant.carteProExpiry ? new Date(Etudiant.carteProExpiry).toISOString().split('T')[0] : '',
      isSchedulable: Etudiant.isSchedulable ?? true,
      avatarFile: null,
      avatarAction: '',
      documentCni: null,
      documentAssurance: null,
      documentResidencePermit: null,
      documentCartePro: null,
    },
    mode: 'onSubmit',
  });

  const selectedCategory = form.watch('userCategory');
  const carteProNumber = form.watch('carteProNumber');

  // Extraction automatique de la date d'expiration
  useEffect(() => {
    if (!showCollabAgrementPlanning) return;
    if (carteProNumber && /^CAR-\d{4}-\d{2}-\d{2}-\d{4}\d{7}$/.test(carteProNumber)) {
      const parts = carteProNumber.split('-');
      if (parts.length >= 4) {
        const year = parts[1];
        const month = parts[2];
        const day = parts[3];
        const expiryDate = `${year}-${month}-${day}`;
        
        if (form.getValues('carteProExpiry') !== expiryDate) {
          form.setValue('carteProExpiry', expiryDate, { shouldDirty: true, shouldValidate: true });
          toast.info("Date de fin déduite depuis une référence au format historique CAR-…");
        }
      }
    }
  }, [carteProNumber, form, showCollabAgrementPlanning]);
  const filteredRoles = (roleList || []).filter((role: UserRole) => 
    !role.targetCategory || role.targetCategory === selectedCategory
  );

  useEffect(() => {
    if (Etudiant.avatar) {
      setAvatarExistingPreview(Etudiant.avatar);
      setAvatarAttachedPreview(null);
    }
  }, [Etudiant]);

  const mutation = useMutation({
    mutationFn: async (values: EtudiantEditSchemaType) => {
      const formData = new FormData();

      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await apiFetch(`/api/sections/gestion-ressources/rh/etudiants/${Etudiant.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestion-academique', 'vie-scolaire', 'etudiants'] });
      queryClient.invalidateQueries({ queryKey: ['user', Etudiant.id] });

      if (onSuccess) {
        onSuccess();
      }

      toast.custom(() => (
        <Alert variant="mono" icon="success">
          <AlertIcon>
            <RiCheckboxCircleFill />
          </AlertIcon>
          <AlertTitle>Profil mis à jour</AlertTitle>
        </Alert>
      ));
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
        {
          position: 'top-center',
        },
      );
    },
  });

  const isProcessing = mutation.status === 'pending';

  const handleRemoveAvatar = () => {
    setAvatarExistingPreview(null);
    form.setValue('avatarFile', null);
    form.setValue('avatarAction', 'remove', { shouldDirty: true });
  };

  const handleCancelAvatar = () => {
    setAvatarAttachedPreview(null);
    if (Etudiant.avatar) {
      setAvatarExistingPreview(Etudiant.avatar);
    }
    form.setValue('avatarFile', null);
    form.setValue('avatarAction', '', { shouldDirty: true });
  };

  const handleChangeAvatar = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0] || null;
    form.setValue('avatarFile', file, { shouldDirty: true, shouldValidate: true });
    form.setValue('avatarAction', 'save', { shouldDirty: true });

    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarAttachedPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setAvatarAttachedPreview(null);
    }
  };

  const handleSubmit = (values: EtudiantEditSchemaType) => {
    mutation.mutate(values);
  };

  const handleError = (errors: any) => {
    if (errors.carteProNumber) {
      toast.error('Référence habilitation invalide', {
        description: 'Vérifiez la longueur ou le format demandé.',
      });
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <Form {...form}>
          <form 
            ref={formRef} 
            onSubmit={form.handleSubmit(handleSubmit, handleError)} 
            className="space-y-6"
          >
            {/* Avatar Section */}
            <div className="flex items-center gap-5 pb-6 border-b border-border">
              <Avatar className="size-20 border">
                <AvatarImage
                  src={avatarAttachedPreview || avatarExistingPreview || undefined}
                  alt={Etudiant.name || ''}
                />
                <AvatarFallback className="text-xl bg-accent">
                  {getInitials(Etudiant.name || Etudiant.email || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <FormLabel className="text-sm font-semibold">Photo de profil</FormLabel>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => avatarFileRef.current?.click()}
                  >
                    Changer
                  </Button>
                  {(avatarAttachedPreview || (Etudiant.avatar && avatarExistingPreview)) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={avatarAttachedPreview ? handleCancelAvatar : handleRemoveAvatar}
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleChangeAvatar(e);
                  }}
                />
                <p className="text-[11px] text-muted-foreground">PNG, JPG ou GIF. Max 1MB.</p>
              </div>
            </div>

            {/* Identity Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                  <Fingerprint className="size-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                  États civil & Contact
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">Prénom</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-10 bg-secondary/50 border-border focus:bg-background transition-colors" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">Nom de famille</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-10 bg-secondary/50 border-border focus:bg-background transition-colors" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">Email Personnel</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                          <Input {...field} className="h-10 pl-10 bg-secondary/50 border-border focus:bg-background transition-colors" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">Date de naissance</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                          <Input type="date" {...field} value={field.value || ''} className="h-10 pl-10 bg-secondary/50 border-border focus:bg-background transition-colors" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthPlace"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">Lieu de naissance</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                          <Input {...field} value={field.value || ''} className="h-10 pl-10 bg-secondary/50 border-border focus:bg-background transition-colors" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">Nationalité</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} className="h-10 bg-secondary/50 border-border focus:bg-background transition-colors" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Separator className="bg-border/50" />

            {/* Professional Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                  <Briefcase className="size-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                  {learnerParcours ? 'Compte & rôle' : 'Profil métier & rôles'}
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-5">
                {!learnerParcours ?
                  <FormField
                    control={form.control}
                    name="userCategory"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-2sm font-semibold text-foreground">Catégorie</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 bg-secondary/50 border-border">
                              <SelectValue placeholder="Choisir une catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INTERNAL">{SCHOOL_USER_CATEGORY_LABELS.INTERNAL}</SelectItem>
                            <SelectItem value="CLIENT">{SCHOOL_USER_CATEGORY_LABELS.CLIENT}</SelectItem>
                            <SelectItem value="SUBCONTRACTOR">
                              {SCHOOL_USER_CATEGORY_LABELS.SUBCONTRACTOR}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                : (
                  <div className="rounded-md border border-border/70 bg-muted/20 p-4 text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Catégorie métier CRM</strong> (interne / sous-traitant) : non
                    affichée pour un compte <strong className="text-foreground">candidat / élève</strong>. Le parcours et
                    les pièces CNAPS sont suivis dans les onglets candidature / conformité.
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">Rôle système</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 bg-secondary/50 border-border">
                            <SelectValue placeholder="Choisir un rôle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredRoles.map((role: UserRole) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {learnerParcours ? (
                  <div className="md:col-span-2 rounded-md border border-border/70 bg-muted/20 p-4 text-xs text-muted-foreground leading-relaxed">
                    Les dossiers créés depuis ce CRM sont marqués <strong>manuellement</strong> avec une candidature{' '}
                    <code>source = MANUAL</code>. Les préinscriptions depuis le site publient généralement{' '}
                    <code>LEAD</code> ou <code>LANDING_SESSION</code>. Les champs type « agent de sécurité » ou poste RH
                    ne concernent pas le parcours apprenant.
                  </div>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="jobFunction"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-2sm font-semibold text-foreground">
                            Fonction administrative / support
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10 bg-secondary/50 border-border">
                                <div className="flex items-center gap-2">
                                  <Briefcase className="size-4 text-muted-foreground/50" />
                                  <SelectValue placeholder="Choisir une fonction" />
                                </div>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COLLABORATEUR_JOB_FUNCTION_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="qualification"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-2sm font-semibold text-foreground">
                            Titre / qualification (optionnel)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                              <Input
                                {...field}
                                placeholder="Diplôme, habilitation interne..."
                                className="h-10 pl-10 bg-secondary/50 border-border focus:bg-background transition-colors"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">Statut du compte</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 bg-secondary/50 border-border">
                            <SelectValue placeholder="Choisir un statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Actif</SelectItem>
                          <SelectItem value="ABSENT">Absent</SelectItem>
                          <SelectItem value="INACTIVE">Inactif</SelectItem>
                          <SelectItem value="PENDING">En attente</SelectItem>
                          <SelectItem value="BANNED">Banni</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Separator className="bg-border/50" />

            {/* Compliance Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                  <FileText className="size-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                  Conformité sécurité
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-5">
                {showStaffEmployerFields ?
                  <FormField
                    control={form.control}
                    name="socialSecurityNumber"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-2sm font-semibold text-foreground">N° Sécurité sociale (NIR)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                            <Input
                              {...field}
                              value={field.value || ''}
                              placeholder="1 23 45 67 890 123 45"
                              className="h-10 pl-10 bg-secondary/50 border-border focus:bg-background transition-colors"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                : null}

                <FormField
                  control={form.control}
                  name="cniNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">N° CNI / passeport</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                          <Input {...field} value={field.value || ''} className="h-10 pl-10 bg-secondary/50 border-border focus:bg-background transition-colors" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="residencePermitNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">N° Titre de séjour (si applicable)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} className="h-10 bg-secondary/50 border-border focus:bg-background transition-colors" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="residencePermitExpiry"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">Expiration titre de séjour</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                          <Input type="date" {...field} value={field.value || ''} className="h-10 pl-10 bg-secondary/50 border-border focus:bg-background transition-colors" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Separator className="bg-border/50" />

            {/* Contract & Residence Section */}
            <section className="space-y-6 pb-6">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                  <Calendar className="size-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                  {learnerParcours ? 'Résidence' : 'Contrat & résidence'}
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-5">
                {!learnerParcours ?
                  <>
                    <FormField
                      control={form.control}
                      name="contractType"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-2sm font-semibold text-foreground">Type de Contrat</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                            <FormControl>
                              <SelectTrigger className="h-10 bg-secondary/50 border-border">
                                <div className="flex items-center gap-2">
                                  <FileText className="size-4 text-muted-foreground/50" />
                                  <SelectValue placeholder="Choisir un type" />
                                </div>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CDI">CDI</SelectItem>
                              <SelectItem value="CDD">CDD</SelectItem>
                              <SelectItem value="INTERIM">Intérim</SelectItem>
                              <SelectItem value="STAGE">Stage / Alternance</SelectItem>
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
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-2sm font-semibold text-foreground">Temps de Travail</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                            <FormControl>
                              <SelectTrigger className="h-10 bg-secondary/50 border-border">
                                <div className="flex items-center gap-2">
                                  <Clock className="size-4 text-muted-foreground/50" />
                                  <SelectValue placeholder="Choisir un type" />
                                </div>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="FULL_TIME">Temps Plein (35h+)</SelectItem>
                              <SelectItem value="PART_TIME">Temps Partiel</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contractStartDate"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-2sm font-semibold text-foreground">Date d&apos;embauche</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                              <Input
                                type="date"
                                {...field}
                                value={field.value || ''}
                                className="h-10 pl-10 bg-secondary/50 border-border focus:bg-background transition-colors"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contractEndDate"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-2sm font-semibold text-foreground">
                            Date de fin de contrat (si CDD)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                              <Input
                                type="date"
                                {...field}
                                value={field.value || ''}
                                className="h-10 pl-10 bg-secondary/50 border-border focus:bg-background transition-colors"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                : null}

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-2sm font-semibold text-foreground">Adresse de résidence</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                            <Input {...field} value={field.value || ''} placeholder="Rue, n°…" className="h-10 pl-10 bg-secondary/50 border-border focus:bg-background transition-colors" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">Ville</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="Paris" className="h-10 bg-secondary/50 border-border focus:bg-background transition-colors" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">Code Postal</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="75000" className="h-10 bg-secondary/50 border-border focus:bg-background transition-colors" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>


            <Separator className="bg-border/50" />

            {showCollabAgrementPlanning && (
              <>
            {/* Habilitation / agrément (collaborateurs & formateurs) */}
            <section className="space-y-6">
              <div className="flex items-start gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10 shrink-0 mt-0.5">
                  <Shield className="size-4 text-primary" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">{agr.sectionTitle}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">{agr.sectionHint}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="carteProNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">{agr.numberLabel}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="Référence si connue"
                            className="h-10 pl-10 bg-secondary/50 border-border focus:bg-background transition-colors"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="carteProExpiry"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">{agr.expiryLabel}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                          <Input type="date" {...field} value={field.value || ''} className="h-10 pl-10 bg-secondary/50 border-border focus:bg-background transition-colors" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isSchedulable"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">Disponibilité planning</FormLabel>
                      <div className="flex items-center gap-2 h-10 px-3 bg-secondary/50 border border-border rounded-md">
                        <input 
                          type="checkbox" 
                          checked={!!field.value} 
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="size-4 rounded border-input text-primary focus:ring-primary"
                          id="isSchedulable-details"
                        />
                        <label htmlFor="isSchedulable-details" className="text-sm font-medium cursor-pointer">
                          Planifiable
                        </label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Separator className="bg-border/50" />
              </>
            )}

            {/* Documents Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                  <FileText className="size-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Documents & justificatifs</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                {[
                  { name: 'documentCni', label: 'CNI / Passeport', icon: CreditCard, existing: Etudiant.documentCni },
                  { name: 'documentAssurance', label: 'Attestation Assurance', icon: ShieldCheck, existing: Etudiant.documentAssurance },
                  { name: 'documentResidencePermit', label: 'Titre de séjour', icon: FileText, existing: Etudiant.documentResidencePermit },
                  ...(showCollabAgrementPlanning
                    ? [
                        {
                          name: 'documentCartePro' as const,
                          label: agr.documentLabel,
                          icon: Shield,
                          existing: Etudiant.documentCartePro,
                        },
                      ]
                    : []),
                ].map((doc) => (
                  <FormField key={doc.name} control={form.control} name={doc.name as any} render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-2sm font-semibold text-foreground">{doc.label}</FormLabel>
                        {doc.existing && (
                          <a 
                            href={doc.existing} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider"
                          >
                            Voir document actuel
                          </a>
                        )}
                      </div>
                      <FormControl>
                        <div className="relative group">
                          <div className={cn(
                            "flex items-center justify-center w-full h-24 border-2 border-dashed rounded-xl transition-colors bg-secondary/20",
                            field.value ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
                          )}>
                            {field.value ? (
                              <div className="flex flex-col items-center gap-1">
                                <doc.icon className="size-6 text-primary" />
                                <span className="text-[10px] font-bold text-primary uppercase">Nouveau document prêt</span>
                                <button 
                                  type="button"
                                  className="text-[10px] text-destructive hover:underline font-medium"
                                  onClick={() => field.onChange(null)}
                                >
                                  Annuler
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center">
                                <CloudUpload className="size-6 text-muted-foreground/50 group-hover:text-primary/50 transition-colors" />
                                <span className="text-[11px] font-medium text-muted-foreground group-hover:text-primary/70 transition-colors">Charger un nouveau fichier</span>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      field.onChange(file);
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                ))}
              </div>
            </section>

            {!formRef && (
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={!form.formState.isDirty || isProcessing}
                >
                  Réinitialiser
                </Button>
                <Button 
                  type="submit" 
                  disabled={!form.formState.isDirty || isProcessing}
                >
                  {isProcessing && <LoaderCircleIcon className="size-4 animate-spin mr-2" />}
                  Sauvegarder les modifications
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}




