'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type FieldErrors } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { getAvatarUrl, getInitials } from '@/lib/helpers';
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
import { Textarea } from '@/components/ui/textarea';
import { Award, Building2, ClipboardList, Landmark, MapPin, Shield, User } from 'lucide-react';
import { CompanyProfileSchema, CompanyProfileSchemaType } from '../forms/company-profile-schema';
import type { CompanyProfileView } from '../types/company-profile-view';
import type { PrimaryAdminContactPayload } from '../types/school-stats';
import {
  COMPAGNIE_AVATAR_PRESETS,
  DEFAULT_DIRECTOR_AVATAR,
  DEFAULT_ADMIN_AVATAR,
} from '../lib/compagnie-avatar-presets';

interface ProfilSettingsProps {
  profile: CompanyProfileView;
  primaryAdminContact?: PrimaryAdminContactPayload | null;
  formRef?: RefObject<HTMLFormElement | null>;
}

export function ProfilSettings({ profile, primaryAdminContact, formRef }: ProfilSettingsProps) {
  const queryClient = useQueryClient();

  const [logoExistingPreview, setLogoExistingPreview] = useState<string | null>(null);
  const [logoAttachedPreview, setLogoAttachedPreview] = useState<string | null>(null);
  const logoFileRef = useRef<HTMLInputElement | null>(null);

  const [directorAttachedPreview, setDirectorAttachedPreview] = useState<string | null>(null);
  const [adminAttachedPreview, setAdminAttachedPreview] = useState<string | null>(null);
  const directorAvatarFileRef = useRef<HTMLInputElement | null>(null);
  const adminAvatarFileRef = useRef<HTMLInputElement | null>(null);

  const buildDefaults = useCallback(
    (p: CompanyProfileView, admin: PrimaryAdminContactPayload | null | undefined): CompanyProfileSchemaType => ({
    companyName: p.companyName || '',
    siret: p.siret || '',
    cnaps: p.cnaps || '',
    companyType: p.companyType || '',
    industry: p.industry || '',
    companySize: p.companySize || '',
    website: p.website || '',
    companyAddress: p.companyAddress || '',
    companyCity: p.companyCity || '',
    companyPostalCode: p.companyPostalCode || '',
    companyCountry: p.companyCountry || 'FR',
    companyRegion: p.companyRegion || '',
    ndaNumber: p.ndaNumber || '',
    ndaSpecialty: p.ndaSpecialty || '',
    ndaDeclarationDate: p.ndaDeclarationDate || '',
    ndaRegion: p.ndaRegion || '',
    ndaTrainingActions: p.ndaTrainingActions || '',
    qualiopiCertifications: p.qualiopiCertifications || '',
    siren: p.siren || '',
    establishmentNic: p.establishmentNic || '',
    vatIntracommunityNumber: p.vatIntracommunityNumber || '',
    eoriNumber: p.eoriNumber || '',
    nafApeCode: p.nafApeCode || '',
    naf2025Code: p.naf2025Code || '',
    mainActivityDescription: p.mainActivityDescription || '',
    legalFormDetailed: p.legalFormDetailed || '',
    companyCreationDate: p.companyCreationDate || '',
    establishmentCreationDate: p.establishmentCreationDate || '',
    inseeRegistrationDate: p.inseeRegistrationDate || '',
    rneExtractDate: p.rneExtractDate || '',
    employeeSituationNote: p.employeeSituationNote || '',
    companySizeCategoryNote: p.companySizeCategoryNote || '',
    collectiveAgreementNote: p.collectiveAgreementNote || '',
    inpiCompanySummary: p.inpiCompanySummary || '',
    shareCapitalEuros: p.shareCapitalEuros || '',
    rcsRegistryCity: p.rcsRegistryCity || '',
    agreementAdef: p.agreementAdef || '',
    agreementQualianor: p.agreementQualianor || '',
    agreementQualiopiRef: p.agreementQualiopiRef || '',
    agreementSsiap: p.agreementSsiap || '',
    directorRole: p.directorRole || '',
    directorFullName: p.directorFullName || '',
    directorEmail: p.directorEmail || '',
    directorPhone: p.directorPhone || '',
    logo: p.logo || null,
    logoFile: null,
    logoAction: '',
    directorAvatar: p.directorAvatar ?? null,
    directorAvatarFile: null,
    directorAvatarAction: '',
    adminAvatar: admin?.avatar ?? null,
    adminAvatarFile: null,
    adminAvatarAction: '',
  }),
  [],
);

  /** Évite les réinitialisations si la référence `profile` change sans données nouvelles (efface dirty / fichier logo). */
  const profileKey = useMemo(
    () => JSON.stringify({ profile, admin: primaryAdminContact }),
    [profile, primaryAdminContact],
  );
  const defaultValues = useMemo(
    () => buildDefaults(profile, primaryAdminContact ?? null),
    [buildDefaults, profileKey],
  );

  const form = useForm<CompanyProfileSchemaType>({
    resolver: zodResolver(CompanyProfileSchema),
    defaultValues,
    mode: 'onSubmit',
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [form, defaultValues]);

  useEffect(() => {
    setLogoExistingPreview(profile.logo ? getAvatarUrl(profile.logo) : null);
    setLogoAttachedPreview(null);
  }, [profile?.logo]);

  useEffect(() => {
    setDirectorAttachedPreview(null);
  }, [profile?.directorAvatar]);

  useEffect(() => {
    setAdminAttachedPreview(null);
  }, [primaryAdminContact?.avatar]);

  const mutation = useMutation({
    mutationFn: async (values: CompanyProfileSchemaType) => {
      const useMultipart =
        Boolean(values.logoFile) ||
        values.logoAction === 'remove' ||
        Boolean(values.directorAvatarFile) ||
        values.directorAvatarAction === 'remove' ||
        Boolean(values.adminAvatarFile) ||
        values.adminAvatarAction === 'remove';

      if (useMultipart) {
        const { logoFile, directorAvatarFile, adminAvatarFile, ...rest } = values;
        const payload = { ...rest, logoFile: undefined, directorAvatarFile: undefined, adminAvatarFile: undefined };
        const fd = new FormData();
        fd.append('payload', JSON.stringify(payload));
        if (values.logoFile) fd.append('logoFile', values.logoFile);
        if (values.directorAvatarFile) fd.append('directorAvatarFile', values.directorAvatarFile);
        if (values.adminAvatarFile) fd.append('adminAvatarFile', values.adminAvatarFile);

        const response = await apiFetch(`/api/sections/gestion-ressources/compagnie/profil`, {
          method: 'POST',
          body: fd,
        });

        if (!response.ok) {
          let msg = 'Échec de la mise à jour du profil';
          try {
            const j = (await response.json()) as { message?: string; error?: string };
            if (typeof j.message === 'string') msg = j.message;
            else if (typeof j.error === 'string') msg = j.error;
          } catch {
            /* ignore */
          }
          throw new Error(msg);
        }

        return response.json();
      }

      const {
        logoFile: _lf,
        directorAvatarFile: _df,
        adminAvatarFile: _af,
        ...serializable
      } = values;
      void _lf;
      void _df;
      void _af;

      const response = await apiFetch(`/api/sections/gestion-ressources/compagnie/profil`, {
        method: 'POST',
        body: JSON.stringify(serializable),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let msg = 'Échec de la mise à jour du profil';
        try {
          const j = (await response.json()) as { message?: string; error?: string };
          if (typeof j.message === 'string') msg = j.message;
          else if (typeof j.error === 'string') msg = j.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      toast.custom(() => (
        <Alert variant="success" appearance="light" icon="success" close={false}>
          <AlertIcon><RiCheckboxCircleFill /></AlertIcon>
          <AlertTitle>Profil mis à jour avec succès</AlertTitle>
        </Alert>
      ));
    },
    onError: (error: Error) => {
      toast.custom(() => (
        <Alert variant="destructive" appearance="light" icon="destructive" close={false}>
          <AlertIcon><RiErrorWarningFill /></AlertIcon>
          <AlertTitle>{error.message}</AlertTitle>
        </Alert>
      ), { position: 'top-center' });
    },
  });

  const handleRemoveLogo = () => {
    setLogoExistingPreview(null);
    form.setValue('logoFile', null, { shouldDirty: true });
    form.setValue('logoAction', 'remove', { shouldDirty: true });
  };

  const handleCancelLogo = () => {
    setLogoAttachedPreview(null);
    setLogoExistingPreview(profile.logo || null);
    form.setValue('logoFile', null, { shouldDirty: true });
    form.setValue('logoAction', '', { shouldDirty: true });
  };

  const handleChangeLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      form.setValue('logoFile', file, { shouldDirty: true, shouldValidate: true });
      const reader = new FileReader();
      reader.onload = () => setLogoAttachedPreview(reader.result as string);
      reader.readAsDataURL(file);
      void form.trigger('logoFile');
    }
  };

  const handlePickDirectorPreset = (src: string) => {
    form.setValue('directorAvatar', src, { shouldDirty: true });
    form.setValue('directorAvatarFile', null, { shouldDirty: true });
    form.setValue('directorAvatarAction', '', { shouldDirty: true });
    setDirectorAttachedPreview(null);
    if (directorAvatarFileRef.current) directorAvatarFileRef.current.value = '';
  };

  const handleChangeDirectorAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      form.setValue('directorAvatarFile', file, { shouldDirty: true, shouldValidate: true });
      form.setValue('directorAvatarAction', '', { shouldDirty: true });
      const reader = new FileReader();
      reader.onload = () => setDirectorAttachedPreview(reader.result as string);
      reader.readAsDataURL(file);
      void form.trigger('directorAvatarFile');
    }
  };

  const handleRemoveDirectorAvatar = () => {
    setDirectorAttachedPreview(null);
    form.setValue('directorAvatarFile', null, { shouldDirty: true });
    form.setValue('directorAvatar', null, { shouldDirty: true });
    form.setValue('directorAvatarAction', 'remove', { shouldDirty: true });
    if (directorAvatarFileRef.current) directorAvatarFileRef.current.value = '';
  };

  const handlePickAdminPreset = (src: string) => {
    form.setValue('adminAvatar', src, { shouldDirty: true });
    form.setValue('adminAvatarFile', null, { shouldDirty: true });
    form.setValue('adminAvatarAction', '', { shouldDirty: true });
    setAdminAttachedPreview(null);
    if (adminAvatarFileRef.current) adminAvatarFileRef.current.value = '';
  };

  const handleChangeAdminAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      form.setValue('adminAvatarFile', file, { shouldDirty: true, shouldValidate: true });
      form.setValue('adminAvatarAction', '', { shouldDirty: true });
      const reader = new FileReader();
      reader.onload = () => setAdminAttachedPreview(reader.result as string);
      reader.readAsDataURL(file);
      void form.trigger('adminAvatarFile');
    }
  };

  const handleRemoveAdminAvatar = () => {
    setAdminAttachedPreview(null);
    form.setValue('adminAvatarFile', null, { shouldDirty: true });
    form.setValue('adminAvatar', null, { shouldDirty: true });
    form.setValue('adminAvatarAction', 'remove', { shouldDirty: true });
    if (adminAvatarFileRef.current) adminAvatarFileRef.current.value = '';
  };

  const handleSubmit = (values: CompanyProfileSchemaType) => {
    mutation.mutate(values);
  };

  const collectFirstErrorMessage = (err: unknown): string | undefined => {
    if (!err || typeof err !== 'object') return undefined;
    const rec = err as Record<string, unknown>;
    if (typeof rec.message === 'string' && rec.message) return rec.message;
    for (const v of Object.values(rec)) {
      const found = collectFirstErrorMessage(v);
      if (found) return found;
    }
    return undefined;
  };

  const handleInvalid = (errors: FieldErrors<CompanyProfileSchemaType>) => {
    const msg =
      collectFirstErrorMessage(errors) ??
      'Certains champs sont invalides (URL du site, e-mails, logo ou avatars).';
    toast.custom(
      () => (
        <Alert variant="destructive" appearance="light" icon="destructive" close={false}>
          <AlertIcon>
            <RiErrorWarningFill />
          </AlertIcon>
          <AlertTitle>{msg}</AlertTitle>
        </Alert>
      ),
      { position: 'top-center' },
    );
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <Form {...form}>
          <form
            ref={formRef}
            onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}
            className="space-y-6"
          >
            {/* Logo & Informations de base */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-amber-500/15 flex items-center justify-center border border-amber-500/25">
                  <Building2 className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Identité de l'entreprise</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 flex flex-col items-center gap-3">
                  <Avatar className="size-24 rounded-2xl border-2 border-dashed border-input bg-muted/30">
                    <AvatarImage src={logoAttachedPreview || logoExistingPreview || undefined} />
                    <AvatarFallback className="rounded-2xl text-xl font-bold bg-muted/50">
                      {getInitials(profile.companyName || 'C')}
                    </AvatarFallback>
                  </Avatar>
                  <Button type="button" variant="outline" size="sm" onClick={() => logoFileRef.current?.click()}>
                    Changer le logo
                  </Button>
                  <input ref={logoFileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp" className="hidden" onChange={handleChangeLogo} />
                  {form.formState.errors.logoFile?.message ? (
                    <p className="text-center text-xs text-destructive max-w-[200px]">
                      {String(form.formState.errors.logoFile.message)}
                    </p>
                  ) : null}
                </div>

                <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nom de l'entreprise</FormLabel>
                      <FormControl>
                        <Input 
                          name={field.name}
                          onBlur={field.onBlur}
                          onChange={field.onChange}
                          ref={field.ref}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="industry" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Secteur d'activité</FormLabel>
                      <FormControl>
                        <Input 
                          name={field.name}
                          onBlur={field.onBlur}
                          onChange={field.onChange}
                          ref={field.ref}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="siret" render={({ field }) => (
                    <FormItem>
                      <FormLabel>SIRET</FormLabel>
                      <FormControl>
                        <Input 
                          name={field.name}
                          onBlur={field.onBlur}
                          onChange={field.onChange}
                          ref={field.ref}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="cnaps" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agrément CNAPS</FormLabel>
                      <FormControl>
                        <Input 
                          name={field.name}
                          onBlur={field.onBlur}
                          onChange={field.onChange}
                          ref={field.ref}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="companyType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'entreprise</FormLabel>
                      <FormControl>
                        <Input 
                          name={field.name}
                          onBlur={field.onBlur}
                          onChange={field.onChange}
                          ref={field.ref}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="companySize" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taille de l'entreprise</FormLabel>
                      <FormControl>
                        <Input 
                          name={field.name}
                          onBlur={field.onBlur}
                          onChange={field.onChange}
                          ref={field.ref}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            </div>

            {/* Registre INPI / INSEE */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-indigo-500/15 flex items-center justify-center border border-indigo-500/25">
                  <Landmark className="size-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Registre INPI / INSEE</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="siren" render={({ field }) => (
                  <FormItem>
                    <FormLabel>SIREN</FormLabel>
                    <FormControl>
                      <Input
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                        placeholder="ex. 853725844"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="establishmentNic" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clef NIC (établissement)</FormLabel>
                    <FormControl>
                      <Input
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                        placeholder="ex. 00015"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vatIntracommunityNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° TVA intracommunautaire</FormLabel>
                    <FormControl>
                      <Input name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="eoriNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° EORI</FormLabel>
                    <FormControl>
                      <Input name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="nafApeCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code NAF / APE</FormLabel>
                    <FormControl>
                      <Input name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} placeholder="ex. 85.59A" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="naf2025Code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code NAF 2025</FormLabel>
                    <FormControl>
                      <Input name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} placeholder="ex. 85.59G" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mainActivityDescription" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Activité principale (libellé)</FormLabel>
                    <FormControl>
                      <Textarea name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} rows={2} className="resize-y min-h-[52px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="legalFormDetailed" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Forme juridique (libellé complet)</FormLabel>
                    <FormControl>
                      <Textarea name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} rows={2} className="resize-y min-h-[52px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="companyCreationDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de création (société)</FormLabel>
                    <FormControl>
                      <Input type="date" name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="establishmentCreationDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de création (établissement)</FormLabel>
                    <FormControl>
                      <Input type="date" name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="inseeRegistrationDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inscription INSEE</FormLabel>
                    <FormControl>
                      <Input type="date" name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="rneExtractDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date extrait RNE</FormLabel>
                    <FormControl>
                      <Input type="date" name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="shareCapitalEuros" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capital social (€)</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                        placeholder="ex. 1000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="rcsRegistryCity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>R.C.S. (ville du greffe)</FormLabel>
                    <FormControl>
                      <Input
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                        placeholder="ex. NANTERRE"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="employeeSituationNote" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Effectif salarié (mention réglementaire)</FormLabel>
                    <FormControl>
                      <Textarea name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} rows={3} className="resize-y min-h-[72px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="companySizeCategoryNote" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Catégorie d&apos;entreprise</FormLabel>
                    <FormControl>
                      <Textarea name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} rows={2} className="resize-y min-h-[52px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="collectiveAgreementNote" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Convention(s) collective(s)</FormLabel>
                    <FormControl>
                      <Textarea name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} rows={2} className="resize-y min-h-[52px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="agreementAdef" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Agrément ADEF</FormLabel>
                    <FormControl>
                      <Input name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} placeholder="Référence ou laisser vide" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="agreementQualianor" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agrément QUALIANOR</FormLabel>
                    <FormControl>
                      <Input name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} placeholder="ex. 445 SP Ind 0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="agreementQualiopiRef" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Réf. agrément QUALIOPI</FormLabel>
                    <FormControl>
                      <Input name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} placeholder="ex. 2811 OF Ind 0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="agreementSsiap" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Agrément SSIAP</FormLabel>
                    <FormControl>
                      <Input name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} placeholder="ex. 2023-992" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="inpiCompanySummary" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Synthèse / extrait INPI (texte libre)</FormLabel>
                    <FormControl>
                      <Textarea name={field.name} onBlur={field.onBlur} onChange={field.onChange} ref={field.ref} value={field.value ?? ''} rows={6} className="resize-y min-h-[120px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* NDA & Qualiopi */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-teal-500/15 flex items-center justify-center border border-teal-500/25">
                  <ClipboardList className="size-4 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest">NDA & Qualiopi</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="ndaNumber" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Numéro Déclaration Activité (NDA)</FormLabel>
                    <FormControl>
                      <Input
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                        placeholder="ex. 11922308992"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="ndaSpecialty" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Spécialité déclarée</FormLabel>
                    <FormControl>
                      <Textarea
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                        rows={3}
                        placeholder="ex. Sécurité des biens et des personnes, police, surveillance"
                        className="resize-y min-h-[72px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="ndaDeclarationDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de déclaration</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="ndaRegion" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Région (déclaration)</FormLabel>
                    <FormControl>
                      <Input
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                        placeholder="ex. Île-de-France"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="ndaTrainingActions" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Actions de formations</FormLabel>
                    <FormControl>
                      <Textarea
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                        rows={4}
                        className="resize-y min-h-[88px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="qualiopiCertifications" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="flex items-center gap-2">
                      <Award className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      Certification(s) Qualiopi
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                        rows={3}
                        className="resize-y min-h-[72px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Contact & Localisation */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-cyan-500/15 flex items-center justify-center border border-cyan-500/25">
                  <MapPin className="size-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Siège & Contact</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="companyAddress" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input 
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="companyCity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl>
                      <Input 
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="companyPostalCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code Postal</FormLabel>
                    <FormControl>
                      <Input 
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="website" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Web</FormLabel>
                    <FormControl>
                      <Input 
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="companyRegion" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Région</FormLabel>
                    <FormControl>
                      <Input 
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Direction */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-violet-500/15 flex items-center justify-center border border-violet-500/25">
                  <User className="size-4 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Direction</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="col-span-2 flex flex-col sm:flex-row gap-6 pb-4 mb-1 border-b border-border/50">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <Avatar className="size-20 rounded-xl border border-border bg-muted/20">
                      <AvatarImage
                        src={
                          directorAttachedPreview ||
                          getAvatarUrl(form.watch('directorAvatar'), DEFAULT_DIRECTOR_AVATAR)
                        }
                        alt=""
                      />
                      <AvatarFallback className="rounded-xl text-lg font-bold">
                        {getInitials(form.watch('directorFullName') || 'D')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-wrap gap-1 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => directorAvatarFileRef.current?.click()}
                      >
                        Téléverser une photo
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={handleRemoveDirectorAvatar}>
                        Retirer la photo
                      </Button>
                    </div>
                    <input
                      ref={directorAvatarFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
                      className="hidden"
                      onChange={handleChangeDirectorAvatar}
                    />
                    {form.formState.errors.directorAvatarFile?.message ? (
                      <p className="text-xs text-destructive text-center max-w-[220px]">
                        {String(form.formState.errors.directorAvatarFile.message)}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2 min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted-foreground">Avatars catalogue (dossier public)</p>
                    <div className="flex flex-wrap gap-2">
                      {COMPAGNIE_AVATAR_PRESETS.map((preset) => {
                        const cur = form.watch('directorAvatar');
                        const sel =
                          (cur || '') === preset.src ||
                          (!cur && preset.src === DEFAULT_DIRECTOR_AVATAR);
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handlePickDirectorPreset(preset.src)}
                            className={cn(
                              'rounded-lg border-2 p-0.5 transition-colors',
                              sel
                                ? 'border-primary ring-1 ring-primary/30'
                                : 'border-transparent hover:border-muted-foreground/30',
                            )}
                            title={preset.label}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preset.src} alt="" className="size-11 rounded-md object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <FormField control={form.control} name="directorFullName" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nom du dirigeant</FormLabel>
                    <FormControl>
                      <Input 
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="directorRole" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Rôle (ex. gérant)</FormLabel>
                    <FormControl>
                      <Input
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                        placeholder="ex. Gérant"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="directorEmail" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Direct</FormLabel>
                    <FormControl>
                      <Input 
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="directorPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone Direct</FormLabel>
                    <FormControl>
                      <Input 
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
            </div>

            {primaryAdminContact ? (
              <div className="bg-card rounded-xl border border-border p-5 space-y-5">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-amber-500/15 flex items-center justify-center border border-amber-500/25">
                    <Shield className="size-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest">Administration du site</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Compte : <span className="font-medium text-foreground">{primaryAdminContact.displayName}</span> —{' '}
                  {primaryAdminContact.email}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  <div className="col-span-2 flex flex-col sm:flex-row gap-6 pb-4 mb-1 border-b border-border/50">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <Avatar className="size-20 rounded-xl border border-border bg-muted/20">
                        <AvatarImage
                          src={
                            adminAttachedPreview ||
                            getAvatarUrl(form.watch('adminAvatar'), DEFAULT_ADMIN_AVATAR)
                          }
                          alt=""
                        />
                        <AvatarFallback className="rounded-xl text-lg font-bold">
                          {getInitials(primaryAdminContact.displayName || 'A')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-wrap gap-1 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => adminAvatarFileRef.current?.click()}
                        >
                          Téléverser une photo
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={handleRemoveAdminAvatar}>
                          Retirer la photo
                        </Button>
                      </div>
                      <input
                        ref={adminAvatarFileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
                        className="hidden"
                        onChange={handleChangeAdminAvatar}
                      />
                      {form.formState.errors.adminAvatarFile?.message ? (
                        <p className="text-xs text-destructive text-center max-w-[220px]">
                          {String(form.formState.errors.adminAvatarFile.message)}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2 min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted-foreground">Avatars catalogue (dossier public)</p>
                      <div className="flex flex-wrap gap-2">
                        {COMPAGNIE_AVATAR_PRESETS.map((preset) => {
                          const cur = form.watch('adminAvatar');
                          const sel =
                            (cur || '') === preset.src ||
                            (!cur && preset.src === DEFAULT_ADMIN_AVATAR);
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handlePickAdminPreset(preset.src)}
                              className={cn(
                                'rounded-lg border-2 p-0.5 transition-colors',
                                sel
                                  ? 'border-primary ring-1 ring-primary/30'
                                  : 'border-transparent hover:border-muted-foreground/30',
                              )}
                              title={preset.label}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={preset.src} alt="" className="size-11 rounded-md object-cover" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="submit" variant="primary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
