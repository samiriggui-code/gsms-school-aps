'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FieldErrors, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { getInitials } from '@/lib/helpers';
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
import {
  Building2,
  Mail,
  ShieldCheck,
  MapPin,
  Briefcase,
  Phone,
  TextQuote,
  CloudUpload,
  FileText,
  Shield,
} from 'lucide-react';
import { DocumentsEditSchema, DocumentsEditSchemaType } from '../forms/documents--edit-schema';
import { cn } from '@/lib/utils';

interface DocumentsDetailsSettingsProps {
  documents: any;
  formRef?: React.RefObject<HTMLFormElement | null>;
}

export function DocumentsDetailsSettings({ documents, formRef }: DocumentsDetailsSettingsProps) {
  const queryClient = useQueryClient();

  const [avatarExistingPreview, setAvatarExistingPreview] = useState<string | null>(null);
  const [avatarAttachedPreview, setAvatarAttachedPreview] = useState<string | null>(null);
  const avatarFileRef = useRef<HTMLInputElement | null>(null);

  const buildDefaults = useCallback((p: any): DocumentsEditSchemaType => ({
    type: p.type || 'PRESTATAIRE',
    name: p.name || '',
    siret: p.siret || '',
    email: p.email || p.contactEmail || '',
    phone: p.phone || p.contactPhone || '',
    address: p.address || '',
    city: p.city || '',
    postalCode: p.postalCode || '',
    service: p.service || '',
    specialty: p.specialty || '',
    agreementNumber: p.agreementNumber || '',
    authorizationNumber: p.authorizationNumber || '',
    expiryDate: p.expiryDate ? new Date(p.expiryDate).toISOString().split('T')[0] : '',
    description: p.description || '',
    status: p.status || 'ACTIVE',
    documentInsuranceFile: null,
    documentKbisFile: null,
    documentAgreementFile: null,
    avatarFile: null,
    avatarAction: '',
  }), []);

  const defaultValues = useMemo(() => buildDefaults(documents), [buildDefaults, documents]);

  const form = useForm<DocumentsEditSchemaType>({
    resolver: zodResolver(DocumentsEditSchema),
    defaultValues,
    mode: 'onSubmit',
  });

  const documentsType = form.watch('type');

  useEffect(() => {
    form.reset(defaultValues);
  }, [form, defaultValues]);

  useEffect(() => {
    setAvatarExistingPreview(documents.avatar || null);
    setAvatarAttachedPreview(null);
  }, [documents?.avatar]);

  const mutation = useMutation({
    mutationFn: async (values: DocumentsEditSchemaType) => {
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

      const response = await apiFetch(`/api/sections/gestion-ressources/partenaires/prestataires/${documents.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        let message = 'Échec de la mise à jour';
        try {
          const data = await response.json();
          message = data?.message || message;
        } catch {
          // ignore JSON parse failures
        }
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentss-list'] });
      queryClient.invalidateQueries({ queryKey: ['documents-details', documents.id] });
      queryClient.invalidateQueries({ queryKey: ['documents-overview', documents.id] });

      toast.custom(() => (
        <Alert variant="mono" icon="success">
          <AlertIcon><RiCheckboxCircleFill /></AlertIcon>
          <AlertTitle>Informations mises à jour avec succès</AlertTitle>
        </Alert>
      ));
    },
    onError: (error: Error) => {
      toast.custom(() => (
        <Alert variant="mono" icon="destructive">
          <AlertIcon><RiErrorWarningFill /></AlertIcon>
          <AlertTitle>{error.message}</AlertTitle>
        </Alert>
      ), { position: 'top-center' });
    },
  });

  const handleRemoveAvatar = () => {
    setAvatarExistingPreview(null);
    form.setValue('avatarFile', null, { shouldDirty: true, shouldValidate: true });
    form.setValue('avatarAction', 'remove', { shouldDirty: true });
    form.clearErrors('avatarFile');
  };

  const handleCancelAvatar = () => {
    setAvatarAttachedPreview(null);
    if (documents.avatar) {
      setAvatarExistingPreview(documents.avatar);
    }
    form.setValue('avatarFile', null, { shouldDirty: true, shouldValidate: true });
    form.setValue('avatarAction', '', { shouldDirty: true });
    form.clearErrors('avatarFile');
  };

  const handleChangeAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const maxSize = 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

    if (!file) {
      setAvatarAttachedPreview(null);
      form.setValue('avatarFile', null, { shouldDirty: true, shouldValidate: true });
      form.setValue('avatarAction', '', { shouldDirty: true });
      form.clearErrors('avatarFile');
      return;
    }

    if (file.size > maxSize) {
      setAvatarAttachedPreview(null);
      form.setValue('avatarFile', null, { shouldDirty: true, shouldValidate: true });
      form.setValue('avatarAction', '', { shouldDirty: true });
      form.setError('avatarFile', { type: 'manual', message: 'L\'image doit faire moins de 1Mo' });
      if (avatarFileRef.current) avatarFileRef.current.value = '';
      toast.custom(() => (
        <Alert variant="mono" icon="destructive">
          <AlertIcon><RiErrorWarningFill /></AlertIcon>
          <AlertTitle>L'image doit faire moins de 1Mo</AlertTitle>
        </Alert>
      ), { position: 'top-center' });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setAvatarAttachedPreview(null);
      form.setValue('avatarFile', null, { shouldDirty: true, shouldValidate: true });
      form.setValue('avatarAction', '', { shouldDirty: true });
      form.setError('avatarFile', { type: 'manual', message: 'Seuls les formats JPG, PNG ou GIF sont autorisés' });
      if (avatarFileRef.current) avatarFileRef.current.value = '';
      toast.custom(() => (
        <Alert variant="mono" icon="destructive">
          <AlertIcon><RiErrorWarningFill /></AlertIcon>
          <AlertTitle>Seuls les formats JPG, PNG ou GIF sont autorisés</AlertTitle>
        </Alert>
      ), { position: 'top-center' });
      return;
    }

    form.clearErrors('avatarFile');
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

  const findFirstErrorMessage = (errors: FieldErrors<DocumentsEditSchemaType>) => {
    const stack = [errors as Record<string, any>];
    while (stack.length) {
      const current = stack.pop();
      if (!current) continue;
      if (typeof current.message === 'string') return current.message;
      if (typeof current === 'object') {
        Object.values(current).forEach((value) => {
          if (value && typeof value === 'object') stack.push(value as Record<string, any>);
        });
      }
    }
    return null;
  };

  const handleSubmit = (values: DocumentsEditSchemaType) => {
    mutation.mutate(values);
  };

  const handleInvalid = (errors: FieldErrors<DocumentsEditSchemaType>) => {
    const message = findFirstErrorMessage(errors) || 'Veuillez corriger les champs en erreur.';
    toast.custom(() => (
      <Alert variant="mono" icon="destructive">
        <AlertIcon><RiErrorWarningFill /></AlertIcon>
        <AlertTitle>{message}</AlertTitle>
      </Alert>
    ), { position: 'top-center' });
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
            <div className="bg-card rounded-xl border border-border p-5 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                  <Building2 className="size-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                  Entreprise & Contact
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 flex flex-col items-center gap-3">
                  <Avatar className="size-24 rounded-2xl border-2 border-dashed border-input bg-muted/30">
                    <AvatarImage
                      src={avatarAttachedPreview || avatarExistingPreview || undefined}
                      alt={documents.name || ''}
                    />
                    <AvatarFallback className="rounded-2xl text-xl font-bold bg-muted/50">
                      {getInitials(documents.name || 'P')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 font-bold text-[11px] uppercase tracking-wider"
                      onClick={() => avatarFileRef.current?.click()}
                    >
                      Changer le logo
                    </Button>
                    {(avatarAttachedPreview || (documents.avatar && avatarExistingPreview)) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 font-bold text-[11px] uppercase tracking-wider text-destructive hover:text-destructive"
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
                    onChange={handleChangeAvatar}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    PNG, JPG ou GIF. Max 1MB.
                  </p>
                </div>

                <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider">Type de partenaire</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 bg-muted/30 border-input">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PRESTATAIRE">Prestataire (Général)</SelectItem>
                          <SelectItem value="SUBCONTRACTOR">Sous-traitant (Sécurité)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider">Statut</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 bg-muted/30 border-input">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Actif</SelectItem>
                          <SelectItem value="INACTIVE">Inactif</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider">Raison sociale</FormLabel>
                      <FormControl>
                        <Input 
                          className="h-10 bg-muted/30 border-input" 
                          name={field.name}
                          onBlur={field.onBlur}
                          onChange={field.onChange}
                          ref={field.ref}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="siret" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider">SIRET</FormLabel>
                      <FormControl>
                        <Input 
                          className="h-10 bg-muted/30 border-input font-mono" 
                          name={field.name}
                          onBlur={field.onBlur}
                          onChange={field.onChange}
                          ref={field.ref}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider">Email contact</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                          <Input 
                            className="h-10 pl-9 bg-muted/30 border-input" 
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={field.onChange}
                            ref={field.ref}
                            value={field.value ?? ''}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider">Téléphone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                          <Input 
                            className="h-10 pl-9 bg-muted/30 border-input" 
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={field.onChange}
                            ref={field.ref}
                            value={field.value ?? ''}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 space-y-5">
              {documentsType === 'PRESTATAIRE' ? (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/10">
                      <Briefcase className="size-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                      Secteur d'activité
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="service" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider">Service principal</FormLabel>
                        <FormControl>
                          <Input 
                            className="h-10 bg-muted/30 border-input" 
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={field.onChange}
                            ref={field.ref}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="specialty" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider">Spécialité</FormLabel>
                        <FormControl>
                          <Input 
                            className="h-10 bg-muted/30 border-input" 
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={field.onChange}
                            ref={field.ref}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )} />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/10">
                      <ShieldCheck className="size-4 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                      Agrément sécurité
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="agreementNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider">N° agrément</FormLabel>
                        <FormControl>
                          <Input 
                            className="h-10 bg-muted/30 border-input font-mono" 
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={field.onChange}
                            ref={field.ref}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="authorizationNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider">N° autorisation</FormLabel>
                        <FormControl>
                          <Input 
                            className="h-10 bg-muted/30 border-input font-mono" 
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={field.onChange}
                            ref={field.ref}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="expiryDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider">Expiration</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            className="h-10 bg-muted/30 border-input" 
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={field.onChange}
                            ref={field.ref}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )} />
                  </div>
                </>
              )}
            </div>

            <div className="bg-card rounded-xl border border-border p-5 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                  <FileText className="size-4 text-foreground/70" />
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                  Documents administratifs
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <label htmlFor="edit-doc-insurance" className={cn(
                    "p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-2 cursor-pointer bg-muted/5 w-full",
                    (form.watch('documentInsuranceFile') || documents.documentInsurance) ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50"
                  )}>
                    {(form.watch('documentInsuranceFile') || documents.documentInsurance) ? (
                      <RiCheckboxCircleFill className="size-8 text-primary" />
                    ) : (
                      <CloudUpload className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                    <span className="text-xs font-bold text-foreground/70 text-center">
                      {form.watch('documentInsuranceFile') instanceof File
                        ? (form.watch('documentInsuranceFile') as File).name
                        : documents.documentInsurance ? 'Assurance (Déjà chargé)' : 'Assurance RC Pro'}
                    </span>
                  </label>
                  <input
                    type="file"
                    id="edit-doc-insurance"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) form.setValue('documentInsuranceFile', file, { shouldDirty: true });
                    }}
                  />
                </div>

                <div className="relative group">
                  <label htmlFor="edit-doc-kbis" className={cn(
                    "p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-2 cursor-pointer bg-muted/5 w-full",
                    (form.watch('documentKbisFile') || documents.documentKbis) ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50"
                  )}>
                    {(form.watch('documentKbisFile') || documents.documentKbis) ? (
                      <RiCheckboxCircleFill className="size-8 text-primary" />
                    ) : (
                      <CloudUpload className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                    <span className="text-xs font-bold text-foreground/70 text-center">
                      {form.watch('documentKbisFile') instanceof File
                        ? (form.watch('documentKbisFile') as File).name
                        : documents.documentKbis ? 'Kbis (Déjà chargé)' : 'Extrait Kbis'}
                    </span>
                  </label>
                  <input
                    type="file"
                    id="edit-doc-kbis"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) form.setValue('documentKbisFile', file, { shouldDirty: true });
                    }}
                  />
                </div>

                {documentsType === 'SUBCONTRACTOR' && (
                  <div className="relative group md:col-span-2">
                    <label htmlFor="edit-doc-agreement" className={cn(
                      "p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-2 cursor-pointer bg-muted/5 w-full",
                      (form.watch('documentAgreementFile') || documents.documentAgreement) ? "border-amber-500/50 bg-amber-500/5" : "border-border hover:border-amber-500/50"
                    )}>
                      {(form.watch('documentAgreementFile') || documents.documentAgreement) ? (
                        <ShieldCheck className="size-8 text-amber-500" />
                      ) : (
                        <Shield className="size-8 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                      )}
                      <span className="text-xs font-bold text-foreground/70 text-center">
                        {form.watch('documentAgreementFile') instanceof File
                          ? (form.watch('documentAgreementFile') as File).name
                          : documents.documentAgreement ? 'Agrément (Déjà chargé)' : 'Agrément CNAPS'}
                      </span>
                    </label>
                    <input
                      type="file"
                      id="edit-doc-agreement"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) form.setValue('documentAgreementFile', file, { shouldDirty: true });
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                  <MapPin className="size-4 text-foreground/70" />
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                  Localisation & Notes
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider">Adresse siège</FormLabel>
                    <FormControl>
                      <Input 
                        className="h-10 bg-muted/30 border-input" 
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider">Ville</FormLabel>
                    <FormControl>
                      <Input 
                        className="h-10 bg-muted/30 border-input" 
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="postalCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider">Code postal</FormLabel>
                    <FormControl>
                      <Input 
                        className="h-10 bg-muted/30 border-input" 
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <TextQuote className="size-3.5" />
                      Notes complémentaires
                    </FormLabel>
                    <FormControl>
                      <textarea
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        ref={field.ref}
                        value={field.value ?? ''}
                        className="w-full min-h-[110px] p-3 rounded-lg bg-muted/20 border border-input focus:bg-background outline-none text-sm transition-all"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )} />
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
