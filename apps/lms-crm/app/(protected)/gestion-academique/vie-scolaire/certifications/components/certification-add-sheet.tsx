'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill, RiRefreshLine } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
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
import { VIE_SCOLAIRE_SHEET_LARGE } from '../../constants/sheet-shell-classes';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  LoaderCircleIcon, 
  UserPlus, 
  Mail, 
  Briefcase, 
  Shield, 
  ShieldCheck, 
  Fingerprint, 
  FileText, 
  MapPin,
  Calendar as CalendarIcon,
  Eye,
  EyeOff,
  User as UserIcon,
  Clock,
  Hash,
  CreditCard,
  Info,
  CloudUpload
} from 'lucide-react';
import { UserRole } from '@/app/models/user';
import { useRoleSelectQuery } from '@/app/(protected)/securite-configuration/acces/roles/hooks/use-role-select-query';
import { useCertificationSelectQuery } from '../hooks/use-certification-select-query';
import { CertificationAddSchema, CertificationAddSchemaType } from '../forms/certification-add-schema';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/helpers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const CertificationAddSheet = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('identity');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { data: roleList } = useRoleSelectQuery();
  const { data: CertificationList } = useCertificationSelectQuery();

  const form = useForm<CertificationAddSchemaType>({
    resolver: zodResolver(CertificationAddSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      proEmail: '',
      password: '',
      roleId: '',
      userCategory: 'INTERNAL',
      CertificationId: '',
      jobFunction: '',
      qualification: '',
      birthPlace: '',
      nationality: 'FranÃ§aise',
      socialSecurityNumber: '',
      cniNumber: '',
      address: '',
      city: '',
      postalCode: '',
      contractType: '',
      workTimeType: 'FULL_TIME',
      isSchedulable: true,
      carteProNumber: '',
      carteProExpiry: '',
      birthDate: '',
      residencePermitNumber: '',
      residencePermitExpiry: '',
      documentCni: '',
      documentAssurance: '',
      documentResidencePermit: '',
      documentCartePro: '',
      avatar: '',
    },
    mode: 'onChange',
  });

  const { watch, setValue } = form;
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const fullName = `${firstName} ${lastName}`.trim();
  const email = watch('email');
  const phone = watch('phone');
  const roleId = watch('roleId');
  const password = watch('password');
  const jobFunction = watch('jobFunction');
  const qualification = watch('qualification');
  const contractType = watch('contractType');
  const cniNumber = watch('cniNumber');
  const socialSecurityNumber = watch('socialSecurityNumber');
  const carteProNumber = watch('carteProNumber');
  const documentCni = watch('documentCni');
  const documentAssurance = watch('documentAssurance');
  const documentCartePro = watch('documentCartePro');

  const completion = {
    identity: Boolean(firstName && lastName && email && phone),
    account: Boolean(roleId && password && watch('proEmail')),
    profile: Boolean(jobFunction && qualification),
    contract: Boolean(contractType && watch('workTimeType')),
    compliance: Boolean(cniNumber && socialSecurityNumber && carteProNumber),
    documents: Boolean(documentCni || documentAssurance || documentCartePro),
  };

  const completedBlocks = Object.values(completion).filter(Boolean).length;
  const totalBlocks = Object.keys(completion).length;

  // Auto-generate Pro Email
  useEffect(() => {
    if (firstName && lastName) {
      const email = `${firstName.toLowerCase().trim()}.${lastName.toLowerCase().trim()}@app.lms.local`.replace(/\s+/g, '');
      setValue('proEmail', email);
    }
  }, [firstName, lastName, setValue]);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < 14; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('password', password, { shouldValidate: true });
    setShowPassword(true);
  };

  const selectedCategory = watch('userCategory');
  const filteredRoles = (roleList || []).filter((role: any) => 
    !role.targetCategory || role.targetCategory === selectedCategory
  );

  const mutation = useMutation({
    mutationFn: async (values: CertificationAddSchemaType) => {
      const formData = new FormData();
      
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            formData.append(key, value);
          } else if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await apiFetch('/api/sections/gestion-ressources/rh/Certifications', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.custom(() => (
        <Alert variant="mono" icon="success" close={false}>
          <AlertIcon><RiCheckboxCircleFill /></AlertIcon>
          <AlertTitle>Certification ajoutÃ© et accÃ¨s crÃ©Ã©s</AlertTitle>
        </Alert>
      ), { position: 'top-center' });

      queryClient.invalidateQueries({ queryKey: ['rh-collaborators'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', 'rh'] });
      onOpenChange(false);
      form.reset();
      setActiveTab('identity');
    },
    onError: (error: Error) => {
      toast.custom(() => (
        <Alert variant="mono" icon="destructive" close={false}>
          <AlertIcon><RiErrorWarningFill /></AlertIcon>
          <AlertTitle>{error.message}</AlertTitle>
        </Alert>
      ), { position: 'top-center' });
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE}>
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-background shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
            Dossier Certification - creation
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="grow flex flex-col min-h-0">
            <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
              <div className="flex justify-between flex-wrap gap-2 border-b border-border px-5 py-5 bg-background shrink-0">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="lg:text-[24px] font-bold text-foreground tracking-tight leading-none">
                      {fullName || "Nouveau Certification"}
                    </span>
                    <Badge variant="warning" appearance="light" size="sm" className="font-bold uppercase text-[10px] px-2">
                      Brouillon
                    </Badge>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 text-2sm">
                    <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
                      <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Mode</span>
                      <span className="font-bold text-foreground/80">Creation</span>
                    </div>
                    <BadgeDot className="bg-muted-foreground/30 size-1" />
                    <span className="font-normal text-muted-foreground italic">
                      Utiliser le meme standard visuel que la fiche detail.
                    </span>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-0 mx-1.5" viewportClassName="[&>div]:h-full [&>div>div]:h-full">
                <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
                  {/* Left Column: Quick Info & Preview */}
                  <div className="w-full shrink-0 lg:w-[280px] py-5 lg:pe-5 space-y-4">
                    <div className="w-full h-[240px] bg-muted/10 border border-border rounded-lg flex items-center justify-center overflow-hidden relative group">
                      {avatarPreview ? (
                        <div className="relative w-full h-full group">
                          <img
                            src={avatarPreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          />
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-2 right-2 size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            type="button"
                            onClick={() => {
                              setValue('avatar', '');
                              setAvatarPreview(null);
                            }}
                          >
                            <RiRefreshLine className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <Avatar className="size-full rounded-none transition-transform duration-500 group-hover:scale-105">
                          <AvatarFallback className="rounded-none bg-muted/20">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
                              <UserIcon className="size-[48px]" />
                              <span className="text-sm font-bold uppercase tracking-widest">{fullName ? getInitials(fullName) : "NC"}</span>
                            </div>
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>

                    <label
                      htmlFor="avatar-upload"
                      className="flex items-center justify-center gap-2 h-10 rounded-md border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors text-xs font-bold text-foreground cursor-pointer"
                    >
                      <CloudUpload className="size-4" />
                      {watch('avatar') ? 'Changer la photo' : 'Ajouter une photo'}
                    </label>
                    <input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setValue('avatar', file as any);
                          const reader = new FileReader();
                          reader.onload = (event) => setAvatarPreview(event.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Format conseille: JPG/PNG, image nette type photo identite.
                    </p>

                    <div className="space-y-3">
                      {[
                        { label: "Email Perso", value: watch('email') || '-' },
                        { label: "CatÃ©gorie", value: watch('userCategory') === 'INTERNAL' ? 'Interne' : watch('userCategory') === 'CLIENT' ? 'Client' : 'Sous-traitant' },
                        { label: "Poste", value: watch('jobFunction') || '-' },
                        { label: "Contrat", value: watch('contractType') || '-', isHighlight: true }
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-2sm">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className={cn("font-semibold text-foreground truncate max-w-[150px]", item.isHighlight && "text-foreground")}>{item.value}</span>
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
                        { label: 'Identite', done: completion.identity },
                        { label: 'Compte', done: completion.account },
                        { label: 'Profil metier', done: completion.profile },
                        { label: 'Contrat RH', done: completion.contract },
                        { label: 'Conformite', done: completion.compliance },
                        { label: 'Documents', done: completion.documents },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className={cn("font-semibold", item.done ? "text-emerald-600" : "text-amber-600")}>
                            {item.done ? 'Complet' : 'A renseigner'}
                          </span>
                        </div>
                      ))}

                      <Separator />

                      <div className="flex items-center gap-2 text-foreground/70 font-bold text-[11px] uppercase tracking-wider">
                        <Shield className="size-3.5" />
                        AccÃ¨s Plateforme
                      </div>
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Email Pro GÃ©nÃ©rÃ©</span>
                          <span className="text-xs font-semibold text-foreground truncate">{watch('proEmail') || 'En attente...'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Tabbed Form */}
                  <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-5">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="inline-flex w-auto grow-0 mb-2.5">
                        <TabsTrigger 
                          value="identity" 
                          className="whitespace-nowrap"
                        >
                          IdentitÃ© & Contact
                        </TabsTrigger>
                        <TabsTrigger 
                          value="account" 
                          className="whitespace-nowrap"
                        >
                          AccÃ¨s & Compte
                        </TabsTrigger>
                        <TabsTrigger 
                          value="professional" 
                          className="whitespace-nowrap"
                        >
                          Profil MÃ©tier
                        </TabsTrigger>
                        <TabsTrigger 
                          value="hr" 
                          className="whitespace-nowrap"
                        >
                          RH & Contrat
                        </TabsTrigger>
                        <TabsTrigger 
                          value="documents" 
                          className="whitespace-nowrap"
                        >
                          Documents
                        </TabsTrigger>
                      </TabsList>

                      {/* Tab 1: Identity */}
                      <TabsContent value="identity" className="space-y-8 mt-0">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                            <Fingerprint className="size-4 text-foreground/70" />
                          </div>
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Ã‰tat Civil & Contact</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                          <FormField control={form.control} name="firstName" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-2sm font-semibold text-foreground">PrÃ©nom</FormLabel>
                              <FormControl><Input placeholder="PrÃ©nom" {...field} className="h-10 bg-muted/50 border-border focus:bg-background transition-colors" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="lastName" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-2sm font-semibold text-foreground">Nom de famille</FormLabel>
                              <FormControl><Input placeholder="Nom" {...field} className="h-10 bg-muted/50 border-border focus:bg-background transition-colors" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                          <FormField control={form.control} name="birthDate" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-2sm font-semibold text-foreground">Date de naissance</FormLabel>
                              <FormControl><Input type="date" {...field} className="h-10 bg-muted/50 border-border focus:bg-background transition-colors" /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="birthPlace" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-2sm font-semibold text-foreground">Lieu de naissance</FormLabel>
                              <FormControl><Input placeholder="Ville, Pays" {...field} className="h-10 bg-muted/50 border-border focus:bg-background transition-colors" /></FormControl>
                            </FormItem>
                          )} />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                          <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-2sm font-semibold text-foreground">Email Personnel</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                                  <Input placeholder="email@personnel.com" {...field} className="h-10 pl-10 bg-muted/50 border-border focus:bg-background transition-colors" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-2sm font-semibold text-foreground">TÃ©lÃ©phone Mobile</FormLabel>
                              <FormControl><Input placeholder="+33 6 ..." {...field} className="h-10 bg-muted/50 border-border focus:bg-background transition-colors" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </TabsContent>

                      {/* Tab 2: Provisioning */}
                      <TabsContent value="account" className="space-y-6 pt-2">
                        <div className="p-6 rounded-2xl bg-muted/30 border border-border space-y-6">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                              <Shield className="size-4 text-foreground/70" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Identifiants de connexion</h3>
                          </div>

                          <FormField control={form.control} name="proEmail" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[13px] font-bold text-foreground">Email Professionnel LMS</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input {...field} readOnly className="h-11 bg-background/50 border-border font-medium text-foreground italic" />
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <ShieldCheck className="size-4 text-foreground/30" />
                                  </div>
                                </div>
                              </FormControl>
                              <p className="text-[11px] text-muted-foreground font-medium font-mono">Genere: prenom.nom@app.lms.local</p>
                            </FormItem>
                          )} />

                          <FormField control={form.control} name="password" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[13px] font-bold text-foreground">Mot de passe provisoire</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <div className="relative flex-1">
                                    <Input 
                                      type={showPassword ? "text" : "password"} 
                                      {...field} 
                                      className="h-11 bg-background border-border pr-10" 
                                      placeholder="Mot de passe sÃ©curisÃ©"
                                    />
                                    <button 
                                      type="button" 
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
                                    >
                                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                  </div>
                                </FormControl>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="h-11 px-3 border-border hover:bg-muted"
                                  onClick={generatePassword}
                                >
                                  <RiRefreshLine className="size-4 mr-2" />
                                  GÃ©nÃ©rer
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </TabsContent>

                      {/* Tab 3: Professional Profiling */}
                      <TabsContent value="professional" className="space-y-6 pt-2">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                            <Briefcase className="size-4 text-foreground/70" />
                          </div>
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Profil MÃ©tier & RÃ´les</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                          <FormField control={form.control} name="userCategory" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[13px] font-bold text-foreground">CatÃ©gorie</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="h-11 shadow-sm"><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="INTERNAL">Interne (RH)</SelectItem>
                                  <SelectItem value="CLIENT">Client</SelectItem>
                                  <SelectItem value="Certification">Sous-traitant</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="roleId" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[13px] font-bold text-foreground">RÃ´le SystÃ¨me</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="h-11 shadow-sm"><SelectValue placeholder="Choisir un rÃ´le" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {filteredRoles.map((role: UserRole) => (
                                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        {selectedCategory === 'Certification' && (
                          <FormField control={form.control} name="CertificationId" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[13px] font-bold text-foreground text-amber-600">Entreprise de Sous-traitance affiliÃ©e</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-11 shadow-sm border-amber-500/30 bg-amber-500/5">
                                    <SelectValue placeholder="SÃ©lectionner l'entreprise" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {CertificationList?.map((partner: any) => (
                                    <SelectItem key={partner.id} value={partner.id}>
                                      {partner.name} ({partner.city || 'Sans ville'})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                        )}

                        <div className="grid grid-cols-2 gap-5">
                          <FormField control={form.control} name="jobFunction" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[13px] font-bold text-foreground">Poste / Fonction</FormLabel>
                              <FormControl><Input placeholder="ex: Chef de poste" {...field} className="h-11 shadow-sm" /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="qualification" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[13px] font-bold text-foreground">Qualification Principale</FormLabel>
                              <FormControl><Input placeholder="ex: SSIAP 1, ADS" {...field} className="h-11 shadow-sm" /></FormControl>
                            </FormItem>
                          )} />
                        </div>

                        <div className="p-4 rounded-xl bg-muted/10 border border-border space-y-4 mt-2">
                           <h4 className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-2">
                             <ShieldCheck className="size-3.5" />
                             SpÃ©cificitÃ©s MÃ©tier SÃ©curitÃ©
                           </h4>
                           
                           <div className="grid grid-cols-2 gap-5">
                             <FormField control={form.control} name="carteProNumber" render={({ field }) => (
                               <FormItem className="space-y-1.5">
                                 <FormLabel className="text-[12px] font-semibold">NÂ° Carte Professionnelle</FormLabel>
                                 <FormControl><Input placeholder="CAR-..." {...field} className="h-10 bg-background" /></FormControl>
                               </FormItem>
                             )} />
                             <FormField control={form.control} name="carteProExpiry" render={({ field }) => (
                               <FormItem className="space-y-1.5">
                                 <FormLabel className="text-[12px] font-semibold">Expiration Carte Pro</FormLabel>
                                 <FormControl><Input type="date" {...field} className="h-10 bg-background" /></FormControl>
                               </FormItem>
                             )} />
                           </div>
                           
                           <div className="grid grid-cols-1 gap-5 mt-4">
                             <FormField control={form.control} name="isSchedulable" render={({ field }) => (
                               <FormItem className="space-y-1.5">
                                 <FormLabel className="text-[12px] font-semibold">DisponibilitÃ© Planning</FormLabel>
                                 <div className="flex items-center gap-2 h-10 px-3 bg-background border border-input rounded-md">
                                   <input 
                                     type="checkbox" 
                                     checked={!!field.value} 
                                     onChange={(e) => field.onChange(e.target.checked)}
                                     className="size-4 rounded border-input text-primary focus:ring-primary"
                                     id="isSchedulable"
                                   />
                                   <label htmlFor="isSchedulable" className="text-sm font-medium cursor-pointer">
                                     Plannifiable
                                   </label>
                                 </div>
                               </FormItem>
                             )} />
                           </div>
                        </div>
                      </TabsContent>

                      {/* Tab 4: HR & Compliance */}
                      <TabsContent value="hr" className="space-y-8 pt-2">
                        <div className="space-y-6">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                              <ShieldCheck className="size-4 text-rose-600 dark:text-rose-400" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">ConformitÃ© SÃ©curitÃ©</h3>
                          </div>

                          <div className="grid grid-cols-2 gap-5">
                            <FormField control={form.control} name="socialSecurityNumber" render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-[13px] font-bold text-foreground">NÂ° SÃ©curitÃ© Sociale</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input placeholder="1 00 00 00 000 000" {...field} className="h-11 pl-10 shadow-sm" />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="cniNumber" render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-[13px] font-bold text-foreground">CNI / Passeport</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input placeholder="ABC123456" {...field} className="h-11 pl-10 shadow-sm" />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )} />
                          </div>

                          <div className="grid grid-cols-2 gap-5">
                            <FormField control={form.control} name="residencePermitNumber" render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-[13px] font-bold text-foreground">NÂ° Titre de SÃ©jour (si Ã©tranger)</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input placeholder="0000000000" {...field} className="h-11 pl-10 shadow-sm" />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="residencePermitExpiry" render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-[13px] font-bold text-foreground">Expiration Titre SÃ©jour</FormLabel>
                                <FormControl><Input type="date" {...field} className="h-11 shadow-sm px-4" /></FormControl>
                              </FormItem>
                            )} />
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                              <CalendarIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Contrat & RÃ©sidence</h3>
                          </div>

                          <div className="grid grid-cols-2 gap-5">
                            <FormField control={form.control} name="contractType" render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-[13px] font-bold text-foreground">Type de Contrat</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger className="h-11 shadow-sm"><SelectValue placeholder="Choisir un type" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="CDI">CDI</SelectItem>
                                    <SelectItem value="CDD">CDD</SelectItem>
                                    <SelectItem value="INTERIM">IntÃ©rim</SelectItem>
                                    <SelectItem value="STAGE">Stage / Alternance</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="workTimeType" render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-[13px] font-bold text-foreground">Temps de Travail</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger className="h-11 shadow-sm"><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="FULL_TIME">Temps Plein</SelectItem>
                                    <SelectItem value="PART_TIME">Temps Partiel</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )} />
                          </div>

                          <div className="grid grid-cols-2 gap-5">
                            <FormField control={form.control} name="city" render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-[13px] font-bold text-foreground">Ville</FormLabel>
                                <FormControl><Input placeholder="Paris" {...field} className="h-11 shadow-sm" /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="postalCode" render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-[13px] font-bold text-foreground">Code Postal</FormLabel>
                                <FormControl><Input placeholder="75000" {...field} className="h-11 shadow-sm" /></FormControl>
                              </FormItem>
                            )} />
                          </div>
                        </div>
                      </TabsContent>

                      {/* Tab 5: Documents */}
                      <TabsContent value="documents" className="space-y-6 pt-2">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                            <FileText className="size-4 text-foreground/70" />
                          </div>
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Documents & Justificatifs</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                          {[
                            { name: 'documentCni', label: 'CNI / Passeport', icon: CreditCard },
                            { name: 'documentAssurance', label: 'Attestation Assurance', icon: ShieldCheck },
                            { name: 'documentResidencePermit', label: 'Titre de SÃ©jour', icon: FileText },
                            { name: 'documentCartePro', label: 'Carte Professionnelle', icon: Shield },
                          ].map((doc) => (
                            <FormField key={doc.name} control={form.control} name={doc.name as any} render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-[13px] font-bold text-foreground">{doc.label}</FormLabel>
                                <FormControl>
                                  <div className="relative group">
                                    <div className={cn(
                                      "flex items-center justify-center w-full h-24 border-2 border-dashed rounded-xl transition-colors bg-muted/10",
                                      field.value ? "border-foreground/20 bg-muted/20" : "border-border hover:border-foreground/20"
                                    )}>
                                      {field.value ? (
                                        <div className="flex flex-col items-center gap-1">
                                          <doc.icon className="size-6 text-foreground/70" />
                                          <span className="text-[10px] font-bold text-foreground/70 uppercase">Document chargÃ©</span>
                                          <button 
                                            type="button"
                                            className="text-[10px] text-foreground/50 hover:underline font-medium"
                                            onClick={() => field.onChange('')}
                                          >
                                            Supprimer
                                          </button>
                                        </div>
                                      ) : (
                                        <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center">
                                          <CloudUpload className="size-6 text-muted-foreground/50 group-hover:text-foreground/50 transition-colors" />
                                          <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground/70 transition-colors">Cliquer pour charger</span>
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
                              </FormItem>
                            )} />
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
            </SheetBody>

            <SheetFooter className="flex-row border-t pb-4 p-5 border-border gap-2.5 lg:gap-0 bg-background shrink-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                <Info className="size-3.5" />
                Un email de bienvenue sera envoyÃ© au Certification aprÃ¨s crÃ©ation.
              </div>
              <div className="flex gap-2.5 ml-auto">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
                <Button 
                  type="submit" 
                  variant="outline" 
                  className="bg-foreground text-background hover:bg-foreground/90 font-bold border-none"
                  disabled={mutation.status === 'pending'}
                >
                  {mutation.status === 'pending' ? (
                    <LoaderCircleIcon className="animate-spin size-4 mr-2" />
                  ) : (
                    <UserPlus className="size-4 mr-2" />
                  )}
                  CrÃ©er le Certification
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default CertificationAddSheet;



