'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { buildAppLoginEmail } from '@/lib/app-login-email';
import { z } from 'zod';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { RiCheckboxCircleFill, RiRefreshLine } from '@remixicon/react';
import {
  BookOpen,
  Calendar,
  CloudUpload,
  CreditCard,
  FileText,
  Fingerprint,
  Info,
  KeyRound,
  LoaderCircleIcon,
  Mail,
  MapPin,
  RefreshCw,
  Shield,
  UserIcon,
  UserPlus,
} from 'lucide-react';
import { Button } from '@repo/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import { Alert, AlertIcon, AlertTitle } from '@repo/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { Separator } from '@repo/ui/separator';
import { Textarea } from '@repo/ui/textarea';
import { Badge, BadgeDot } from '@repo/ui/badge';
import { Avatar, AvatarFallback } from '@repo/ui/avatar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { getInitials } from '@/lib/helpers';
import type { FormationSessionApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/types/formation-session-api-row';
import {
  candidatHubListQueryKey,
  candidatHubStatsQueryKey,
  candidaturesListQueryKey,
  etudiantsListQueryKey,
  etudiantsStatsQueryKey,
} from '../constants/query-keys';
import { VIE_SCOLAIRE_SHEET_LARGE } from '../../constants/sheet-shell-classes';

const Schema = z.object({
  firstName: z.string().min(2, 'Prénom requis.'),
  lastName: z.string().min(2, 'Nom requis.'),
  email: z.string().email('E-mail invalide.'),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  nationality: z.string().optional(),
  jobFunction: z.string().optional(),
  qualification: z.string().optional(),
  cniNumber: z.string().optional(),
  residencePermitNumber: z.string().optional(),
  residencePermitExpiry: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
  formationId: z.string().optional(),
  interestedSessionId: z.string().optional(),
});

type FormValues = z.infer<typeof Schema>;

async function unwrapOkItems<T>(
  json: Record<string, unknown>,
  fallback: T[],
): Promise<T[]> {
  if (!json.success || !json.data) return fallback;
  const inner = json.data as Record<string, unknown>;
  return (Array.isArray(inner.items) ? inner.items : fallback) as T[];
}

function buildProEmailLocal(firstName: string, lastName: string) {
  if (!firstName.trim() || !lastName.trim()) return '';
  return buildAppLoginEmail(firstName, lastName);
}

function generateInitialPassword(length = 14): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buf = new Uint8Array(length);
    crypto.getRandomValues(buf);
    let s = '';
    for (let i = 0; i < length; i++) s += chars[buf[i]! % chars.length]!;
    return s;
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.slice(0, length);
}

export function CandidatureAddSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('identity');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [platformPassword, setPlatformPassword] = useState('');

  const { data: formationItems = [], isLoading: loadingFormations } = useQuery({
    queryKey: ['formations', 'library', 'minimal'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/formations/library');
      const json = await res.json();
      if (!res.ok || !json?.success)
        throw new Error('Impossible de charger les formations.');
      return unwrapOkItems<{ id: string; name: string }>(json, []);
    },
    enabled: open,
  });

  const { data: sessionItems = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['formation-sessions', 'for-candidature'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/sessions');
      const json = await res.json();
      if (!res.ok || !json?.success)
        throw new Error('Impossible de charger les sessions.');
      return unwrapOkItems<FormationSessionApiRow>(json, []);
    },
    enabled: open,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
      birthPlace: '',
      nationality: '',
      jobFunction: '',
      qualification: '',
      cniNumber: '',
      residencePermitNumber: '',
      residencePermitExpiry: '',
      address: '',
      city: '',
      postalCode: '',
      notes: '',
      formationId: '',
      interestedSessionId: '',
    },
    mode: 'onChange',
  });

  const { watch } = form;
  const watchedFormationId = watch('formationId');
  const interestedSessionId = watch('interestedSessionId');
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const email = watch('email');
  const qualification = watch('qualification');
  const cniNumber = watch('cniNumber');
  const residencePermitNumber = watch('residencePermitNumber');
  const residencePermitExpiry = watch('residencePermitExpiry');
  const address = watch('address');
  const city = watch('city');
  const postalCode = watch('postalCode');
  const notes = watch('notes');

  const fullName = `${firstName} ${lastName}`.trim();
  const proEmailPreview = useMemo(
    () => buildProEmailLocal(firstName || '', lastName || ''),
    [firstName, lastName],
  );

  const selectedFormationName =
    watchedFormationId && formationItems.length
      ? formationItems.find((f) => f.id === watchedFormationId)?.name ?? '—'
      : '—';

  const sessionsForFormation =
    watchedFormationId && watchedFormationId.length > 0
      ? sessionItems.filter((s) => s.formationId === watchedFormationId)
      : [];

  const selectedSessionLabel =
    interestedSessionId && sessionsForFormation.length
      ? sessionsForFormation.find((s) => s.id === interestedSessionId)
      : null;
  const sessionSummary = selectedSessionLabel
    ? `${selectedSessionLabel.dateDisplayLabel} — ${selectedSessionLabel.location}`
    : '—';

  const complianceTouched = useMemo(
    () =>
      Boolean(
        qualification?.trim() ||
          cniNumber?.trim() ||
          residencePermitNumber?.trim() ||
          residencePermitExpiry?.trim() ||
          address?.trim() ||
          city?.trim() ||
          postalCode?.trim() ||
          notes?.trim(),
      ),
    [
      qualification,
      cniNumber,
      residencePermitNumber,
      residencePermitExpiry,
      address,
      city,
      postalCode,
      notes,
    ],
  );

  const completion = useMemo(
    () => ({
      identity: Boolean(firstName?.trim() && lastName?.trim() && email?.trim()),
      conformite: complianceTouched,
      parcours: Boolean(watchedFormationId?.trim()),
    }),
    [firstName, lastName, email, watchedFormationId, complianceTouched],
  );

  const completedBlocks = Object.values(completion).filter(Boolean).length;
  const totalBlocks = Object.keys(completion).length;

  useEffect(() => {
    if (!open) {
      form.reset();
      setActiveTab('identity');
      setAvatarPreview(null);
      setPlatformPassword('');
    } else {
      setPlatformPassword(generateInitialPassword());
    }
  }, [open, form]);

  useEffect(() => {
    form.setValue('interestedSessionId', '');
  }, [watchedFormationId, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const fd = new FormData();
      fd.append('firstName', values.firstName);
      fd.append('lastName', values.lastName);
      fd.append('email', values.email);
      fd.append('password', platformPassword);
      fd.append('userCategory', 'INTERNAL');
      const pro = buildProEmailLocal(values.firstName, values.lastName);
      if (pro) fd.append('proEmail', pro);

      if (values.phone?.trim()) fd.append('phone', values.phone.trim());
      if (values.birthDate?.trim()) fd.append('birthDate', values.birthDate.trim());
      if (values.birthPlace?.trim()) fd.append('birthPlace', values.birthPlace.trim());
      if (values.nationality?.trim()) fd.append('nationality', values.nationality.trim());
      if (values.jobFunction?.trim()) fd.append('jobFunction', values.jobFunction.trim());
      if (values.qualification?.trim()) fd.append('qualification', values.qualification.trim());
      if (values.cniNumber?.trim()) fd.append('cniNumber', values.cniNumber.trim());
      if (values.residencePermitNumber?.trim())
        fd.append('residencePermitNumber', values.residencePermitNumber.trim());
      if (values.residencePermitExpiry?.trim())
        fd.append('residencePermitExpiry', values.residencePermitExpiry.trim());
      if (values.address?.trim()) fd.append('address', values.address.trim());
      if (values.city?.trim()) fd.append('city', values.city.trim());
      if (values.postalCode?.trim()) fd.append('postalCode', values.postalCode.trim());
      if (values.notes?.trim()) fd.append('notes', values.notes.trim());

      if (values.formationId) fd.append('formationId', values.formationId);
      if (values.interestedSessionId)
        fd.append('interestedSessionId', values.interestedSessionId);

      const res = await apiFetch('/api/sections/gestion-ressources/rh/Candidatures', {
        method: 'POST',
        body: fd,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { message?: string }).message || 'Erreur création.');
      return body;
    },
    onSuccess: async () => {
      toast.custom((toastId) => (
        <Alert variant="mono" icon="success" onClose={() => toast.dismiss(toastId)}>
          <AlertIcon>
            <RiCheckboxCircleFill className="size-4 text-green-600" />
          </AlertIcon>
          <AlertTitle>{t('candidature.createdSuccess')}</AlertTitle>
        </Alert>
      ));
      await queryClient.invalidateQueries({ queryKey: [...candidaturesListQueryKey] });
      await queryClient.invalidateQueries({ queryKey: [...etudiantsListQueryKey] });
      await queryClient.invalidateQueries({ queryKey: [...etudiantsStatsQueryKey] });
      await queryClient.invalidateQueries({ queryKey: [...candidatHubListQueryKey] });
      await queryClient.invalidateQueries({ queryKey: [...candidatHubStatsQueryKey] });
      form.reset();
      setAvatarPreview(null);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE}>
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-background shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
            Dossier candidat — création
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            id="candidature-add"
            onSubmit={form.handleSubmit(onSubmit)}
            className="grow flex flex-col min-h-0"
          >
            <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
              <div className="flex justify-between flex-wrap gap-2 border-b border-border px-5 py-5 bg-background shrink-0">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="lg:text-[24px] font-bold text-foreground tracking-tight leading-none">
                      {fullName || 'Nouveau candidat'}
                    </span>
                    <Badge variant="warning" appearance="light" size="sm" className="font-bold uppercase text-[10px] px-2">
                      Brouillon
                    </Badge>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 text-2sm">
                    <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
                      <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                        Mode
                      </span>
                      <span className="font-bold text-foreground/80">Création</span>
                    </div>
                    <BadgeDot className="bg-muted-foreground/30 size-1" />
                    <span className="font-normal text-muted-foreground italic">
                      Identité, conformité &amp; résidence, formation — identifiants générés sous l&apos;avancement
                      (colonne gauche).
                    </span>
                  </div>
                </div>
              </div>

              <div className="mx-1.5 min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="flex flex-wrap items-start lg:flex-nowrap px-3.5">
                  <div className="w-full shrink-0 lg:w-[280px] py-5 lg:pe-5 space-y-4">
                    <div className="w-full h-[240px] bg-muted/10 border border-border rounded-lg flex items-center justify-center overflow-hidden relative group">
                      {avatarPreview ? (
                        <div className="relative w-full h-full group">
                          <img
                            src={avatarPreview}
                            alt="Aperçu"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            type="button"
                            className="absolute top-2 right-2 size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setAvatarPreview(null)}
                          >
                            <RiRefreshLine className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <Avatar className="size-full rounded-none transition-transform duration-500 group-hover:scale-105">
                          <AvatarFallback className="rounded-none bg-muted/20">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
                              <UserIcon className="size-[48px]" />
                              <span className="text-sm font-bold uppercase tracking-widest">
                                {fullName ? getInitials(fullName) : 'NC'}
                              </span>
                            </div>
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>

                    <label
                      htmlFor="candidature-avatar-upload"
                      className="flex items-center justify-center gap-2 h-10 rounded-md border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors text-xs font-bold text-foreground cursor-pointer"
                    >
                      <CloudUpload className="size-4" />
                      {avatarPreview ? 'Changer la photo' : 'Ajouter une photo'}
                    </label>
                    <input
                      type="file"
                      id="candidature-avatar-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Aperçu local — la photo pourra être enregistrée depuis la fiche après création du dossier.
                    </p>

                    <div className="space-y-3">
                      {[
                        { label: 'Email perso', value: email?.trim() || '—' },
                        { label: 'Profil', value: 'Candidat · hub CRM' },
                        { label: 'Formation visée', value: selectedFormationName },
                        { label: 'Session proposée', value: sessionSummary },
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-2sm gap-2">
                          <span className="text-muted-foreground shrink-0">{item.label}</span>
                          <span className="font-semibold text-foreground truncate max-w-[150px] text-end">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-muted/10 border border-border/50 rounded-md p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-foreground/70 font-bold text-[11px] uppercase tracking-wider">
                          <Shield className="size-3.5" />
                          Avancement dossier
                        </div>
                        <Badge variant="outline" appearance="light" className="text-[10px] font-bold">
                          {completedBlocks}/{totalBlocks}
                        </Badge>
                      </div>
                      {[
                        { label: 'Identité & contact', done: completion.identity },
                        {
                          label: 'Conformité & résidence',
                          done: completion.conformite,
                          optional: true,
                        },
                        { label: 'Intention formation', done: completion.parcours, optional: true },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span
                            className={cn(
                              'font-semibold',
                              item.optional && !item.done
                                ? 'text-muted-foreground'
                                : item.done
                                  ? 'text-emerald-600'
                                  : 'text-amber-600',
                            )}
                          >
                            {item.optional && !item.done ? 'Optionnel' : item.done ? 'Complet' : 'À renseigner'}
                          </span>
                        </div>
                      ))}

                    </div>

                    <div className="bg-muted/10 border border-border/50 rounded-md p-4 space-y-3">
                      <div className="flex items-center gap-2 text-foreground/70 font-bold text-[11px] uppercase tracking-wider">
                        <KeyRound className="size-3.5" />
                        Accès plateforme (généré)
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                          E-mail professionnel
                        </span>
                        <span className="text-xs font-mono font-semibold text-foreground break-all">
                          {proEmailPreview || 'En attente du prénom et du nom…'}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                          Mot de passe initial
                        </span>
                        <span className="text-xs font-mono font-semibold text-foreground tracking-wide break-all select-all">
                          {platformPassword || '—'}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-0 text-xs gap-1.5 text-muted-foreground hover:text-foreground justify-start"
                        onClick={() => setPlatformPassword(generateInitialPassword())}
                      >
                        <RefreshCw className="size-3.5" />
                        Régénérer le mot de passe
                      </Button>
                    </div>
                  </div>

                  <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-5 min-w-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="inline-flex w-auto grow-0 mb-2.5 flex-wrap gap-y-1 max-w-full">
                        <TabsTrigger value="identity" className="whitespace-nowrap">
                          Identité &amp; contact
                        </TabsTrigger>
                        <TabsTrigger value="compliance" className="whitespace-nowrap">
                          Conformité &amp; résidence
                        </TabsTrigger>
                        <TabsTrigger value="parcours" className="whitespace-nowrap">
                          Formation &amp; session
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="identity" className="space-y-8 mt-0">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                            <Fingerprint className="size-4 text-foreground/70" />
                          </div>
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                            État civil &amp; contact
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-2sm font-semibold text-foreground">Prénom</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Prénom"
                                    {...field}
                                    className="h-10 bg-muted/50 border-border focus:bg-background transition-colors"
                                  />
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
                                  <Input
                                    placeholder="Nom"
                                    {...field}
                                    className="h-10 bg-muted/50 border-border focus:bg-background transition-colors"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="birthDate"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-2sm font-semibold text-foreground">Date de naissance</FormLabel>
                                <FormControl>
                                  <Input
                                    type="date"
                                    {...field}
                                    className="h-10 bg-muted/50 border-border focus:bg-background transition-colors"
                                  />
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
                                  <Input
                                    placeholder="Ville, Pays"
                                    {...field}
                                    className="h-10 bg-muted/50 border-border focus:bg-background transition-colors"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="nationality"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5 md:max-w-md">
                              <FormLabel className="text-2sm font-semibold text-foreground">Nationalité</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Française, Marocaine…"
                                  {...field}
                                  className="h-10 bg-muted/50 border-border focus:bg-background transition-colors"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-2sm font-semibold text-foreground">Email personnel</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                                    <Input
                                      type="email"
                                      placeholder="email@personnel.com"
                                      autoComplete="off"
                                      {...field}
                                      className="h-10 pl-10 bg-muted/50 border-border focus:bg-background transition-colors"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-2sm font-semibold text-foreground">Téléphone mobile</FormLabel>
                                <FormControl>
                                  <Input
                                    type="tel"
                                    placeholder="+33 6 …"
                                    autoComplete="tel"
                                    {...field}
                                    className="h-10 bg-muted/50 border-border focus:bg-background transition-colors"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="jobFunction"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-2sm font-semibold text-foreground">
                                Intention métier (optionnel)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Comme sur la fiche détail — ex. Agent de sécurité"
                                  {...field}
                                  className="h-10 bg-muted/50 border-border focus:bg-background transition-colors"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <TabsContent value="compliance" className="space-y-8 mt-0">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                            <Shield className="size-4 text-foreground/70" />
                          </div>
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                            Conformité, résidence &amp; notes dossier
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground -mt-4">
                          Reprend les blocs « Conformité » et « Résidence » des paramètres candidat, plus une note
                          interne (équivalent onglet Parcours après création).
                        </p>

                        <FormField
                          control={form.control}
                          name="qualification"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5 md:max-w-xl">
                              <FormLabel className="text-2sm font-semibold text-foreground">
                                Titre / qualification (optionnel)
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                                  <Input
                                    placeholder="Diplôme, équivalence…"
                                    {...field}
                                    className="h-10 pl-10 bg-muted/50 border-border focus:bg-background transition-colors"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="cniNumber"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-2sm font-semibold text-foreground">
                                  Numéro de carte d&apos;identité (CNI)
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                                    <Input
                                      placeholder="Référence pièce d&apos;identité"
                                      {...field}
                                      className="h-10 pl-10 bg-muted/50 border-border focus:bg-background transition-colors"
                                    />
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
                                <FormLabel className="text-2sm font-semibold text-foreground">
                                  Numéro de titre de séjour (si applicable)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Laisser vide si ressortissant UE"
                                    {...field}
                                    className="h-10 bg-muted/50 border-border focus:bg-background transition-colors"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="residencePermitExpiry"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5 md:col-span-2">
                                <FormLabel className="text-2sm font-semibold text-foreground">
                                  Expiration titre de séjour
                                </FormLabel>
                                <FormControl>
                                  <div className="relative max-w-xs">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                                    <Input
                                      type="date"
                                      {...field}
                                      className="h-10 pl-10 bg-muted/50 border-border focus:bg-background transition-colors"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                            <MapPin className="size-4 text-foreground/70" />
                          </div>
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Résidence</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-2sm font-semibold text-foreground">
                                  Adresse de résidence
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                                    <Input
                                      placeholder="Rue, n°…"
                                      {...field}
                                      className="h-10 pl-10 bg-muted/50 border-border focus:bg-background transition-colors"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-2sm font-semibold text-foreground">Ville</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ville"
                                    {...field}
                                    className="h-10 bg-muted/50 border-border focus:bg-background transition-colors"
                                  />
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
                                <FormLabel className="text-2sm font-semibold text-foreground">Code postal</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="75000"
                                    {...field}
                                    className="h-10 bg-muted/50 border-border focus:bg-background transition-colors"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-2sm font-semibold text-foreground">
                                Notes internes sur le dossier (candidature)
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Suivi RH, rappels CNAPS, commentaires…"
                                  rows={4}
                                  className="resize-y bg-muted/50 border-border"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Visible dans l&apos;onglet Parcours de la fiche ; modifiable ensuite.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <TabsContent value="parcours" className="space-y-8 mt-0">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                            <BookOpen className="size-4 text-foreground/70" />
                          </div>
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                            Intention de formation
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground -mt-4">
                          Alimente « Formation visée » et la session dans le hub, comme sur la fiche candidat.
                        </p>

                        <FormField
                          control={form.control}
                          name="formationId"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-2sm font-semibold text-foreground">Formation catalogue</FormLabel>
                              <Select
                                disabled={loadingFormations}
                                onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}
                                value={field.value?.trim() || '__none__'}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-10 bg-muted/50">
                                    <SelectValue placeholder="—" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="__none__">— Non renseigné</SelectItem>
                                  {formationItems.map((f) => (
                                    <SelectItem key={f.id} value={f.id}>
                                      {f.name}
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
                          name="interestedSessionId"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-2sm font-semibold text-foreground">Session proposée</FormLabel>
                              <Select
                                disabled={loadingSessions || !watchedFormationId?.trim()}
                                onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}
                                value={field.value?.trim() || '__none__'}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-10 bg-muted/50">
                                    <SelectValue
                                      placeholder={
                                        watchedFormationId?.trim()
                                          ? 'Choisir une session…'
                                          : 'Choisissez d’abord une formation'
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="__none__">— Non renseigné</SelectItem>
                                  {sessionsForFormation.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                      {s.dateDisplayLabel} — {s.location}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>Obligatoire uniquement si vous rattachez une session précise.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
            </SheetBody>

            <SheetFooter className="flex flex-wrap flex-row items-center justify-between gap-3 border-t pb-4 p-5 border-border bg-background shrink-0">
              <div className="flex items-start gap-2 text-xs text-muted-foreground italic max-w-xl min-w-0">
                <Info className="size-3.5 shrink-0 mt-0.5" />
                <span>
                  E-mail personnel = contact pour recevoir l&apos;inscription et les identifiants (login + mot de passe).
                  L&apos;email professionnel généré sert à la connexion au dashboard. Un e-mail pourra être envoyé après
                  création sur l&apos;adresse personnelle.
                </span>
              </div>
              <div className="flex gap-2.5 shrink-0 ms-auto">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  className="bg-foreground text-background hover:bg-foreground/90 font-bold border-none"
                  disabled={mutation.isPending || platformPassword.length < 8}
                >
                  {mutation.isPending ? (
                    <LoaderCircleIcon className="animate-spin size-4 mr-2" />
                  ) : (
                    <UserPlus className="size-4 mr-2" />
                  )}
                  Créer la candidature
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
