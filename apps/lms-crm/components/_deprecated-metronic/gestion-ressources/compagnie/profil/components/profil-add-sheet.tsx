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
import { VIE_SCOLAIRE_SHEET_LARGE } from '../../../constants/sheet-shell-classes';
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
  Building2,
  Mail, 
  Briefcase, 
  Shield, 
  ShieldCheck, 
  Fingerprint,
  Eye,
  EyeOff,
  FileText, 
  MapPin,
  Calendar as CalendarIcon,
  LoaderCircleIcon,
  Info,
  CloudUpload,
  Phone,
  TextQuote
} from 'lucide-react';
import { ProfilAddSchema, ProfilAddSchemaType } from '../forms/profil-add-schema';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/helpers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const ProfilAddSheet = ({
  open,
  onOpenChange,
  defaultType = 'PRESTATAIRE',
  hideTypeSelect = false,
  labels,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: 'PRESTATAIRE' | 'SUBCONTRACTOR';
  hideTypeSelect?: boolean;
  labels?: {
    title?: string;
    submit?: string;
    success?: string;
  };
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('identity');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<ProfilAddSchemaType>({
    resolver: zodResolver(ProfilAddSchema),
    defaultValues: {
      type: defaultType,
      name: '',
      siret: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      service: '',
      specialty: '',
      agreementNumber: '',
      authorizationNumber: '',
      representativeFirstName: '',
      representativeLastName: '',
      expiryDate: '',
      description: '',
      avatar: '',
      documentAgreement: '',
      documentCnaps: '',
      documentInsurance: '',
      documentKbis: '',
      password: '',
    },
    mode: 'onChange',
  });

  const { watch, setValue } = form;
  const profilName = watch('name');
  const profilType = watch('type');
  const repFirstName = watch('representativeFirstName');
  const repLastName = watch('representativeLastName');

  const [proEmail, setProEmail] = useState<string>('');

  // Auto-generate Pro Email for Subcontractor Representative
  useEffect(() => {
    if (profilType === 'SUBCONTRACTOR' && repFirstName && repLastName) {
      const email = `${repFirstName.toLowerCase().trim()}.${repLastName.toLowerCase().trim()}@app.gsms-security.com`.replace(/\s+/g, '');
      setProEmail(email);
    } else {
      setProEmail('');
    }
  }, [profilType, repFirstName, repLastName]);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < 14; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('password', password, { shouldValidate: true });
    setShowPassword(true);
  };

  const mutation = useMutation({
    mutationFn: async (values: ProfilAddSchemaType) => {
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

      const response = await apiFetch('/api/sections/gestion-ressources/partenaires/prestataires', {
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
          <AlertTitle>{labels?.success ?? 'Partenaire ajoutÃ© avec succÃ¨s'}</AlertTitle>
        </Alert>
      ), { position: 'top-center' });

      queryClient.invalidateQueries({ queryKey: ['profils-list'] });
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
          <SheetTitle className="font-medium text-sm">{labels?.title ?? 'Nouveau Partenaire Entreprise'}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="grow flex flex-col min-h-0">
            <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
              <div className="flex justify-between flex-wrap gap-2 border-b border-border px-5 py-5 bg-background shrink-0">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="lg:text-[22px] font-semibold text-foreground leading-none">
                      {profilName || "Nouvelle Entreprise"}
                    </span>
                    <Badge variant="outline" appearance="light" size="sm" className="uppercase text-[10px] font-bold">
                      {profilType === 'PRESTATAIRE' ? 'Prestataire GÃ©nÃ©ral' : 'Sous-traitant SÃ©curitÃ©'}
                    </Badge>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 text-2sm">
                    <span className="font-normal text-muted-foreground italic">
                      Configuration du profil entreprise et conformitÃ©
                    </span>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-0 mx-1.5" viewportClassName="[&>div]:h-full [&>div>div]:h-full">
                <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
                  {/* Left Column: Quick Info & Preview */}
                  <div className="w-full shrink-0 lg:w-[300px] py-5 lg:pe-5 space-y-4">
                    <div className="w-full h-[200px] bg-accent/30 border border-border rounded-xl flex items-center justify-center overflow-hidden relative group">
                      {avatarPreview ? (
                        <div className="relative w-full h-full group">
                          <img 
                            src={avatarPreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105" 
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
                          <AvatarFallback className="rounded-none bg-accent/20">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
                              <Building2 className="size-[48px]" />
                              <span className="text-sm font-bold uppercase tracking-widest">{profilName ? getInitials(profilName) : "ENT"}</span>
                            </div>
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={cn(
                        "absolute inset-x-0 bottom-0 p-3 transition-transform bg-gradient-to-t from-black/60 to-transparent",
                        avatarPreview ? "translate-y-full group-hover:translate-y-0" : "translate-y-0"
                      )}>
                        <label htmlFor="avatar-upload" className="block w-full cursor-pointer">
                          <div className="w-full py-2 bg-popover/90 hover:bg-popover text-popover-foreground rounded-lg text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm border border-border">
                            <RiRefreshLine className="size-3.5" />
                            {watch('avatar') ? 'Changer le logo' : 'Ajouter un logo'}
                          </div>
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
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      {[
                        { label: "Type", value: profilType === 'PRESTATAIRE' ? 'Prestataire' : 'Sous-traitant' },
                        { label: "SIRET", value: watch('siret') || '-' },
                        { label: "Email", value: watch('email') || '-' },
                        { label: "Ville", value: watch('city') || '-' }
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-2sm pb-3 border-b border-border/50 last:border-0">
                          <span className="text-secondary-foreground font-normal">{item.label}</span>
                          <span className="font-semibold text-foreground truncate max-w-[150px]">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {profilType === 'SUBCONTRACTOR' && (
                      <div className="bg-muted/10 rounded-xl p-4 space-y-3 border border-border mt-6">
                        <div className="flex items-center gap-2 text-foreground/70 font-bold text-[11px] uppercase tracking-wider">
                          <Shield className="size-3.5" />
                          AccÃ¨s Plateforme
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold text-primary">Identifiant SaaS GÃ©nÃ©rÃ©</span>
                            <span className="text-xs font-semibold text-foreground truncate">{proEmail || 'En attente des noms...'}</span>
                          </div>
                          <div className="flex flex-col gap-1 border-t border-border pt-3">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Email de contact</span>
                            <span className="text-xs font-medium text-foreground truncate">{watch('email') || '-'}</span>
                          </div>
                          <div className="flex flex-col gap-1 border-t border-border pt-3">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold text-amber-600">Mot de passe gÃ©nÃ©rÃ©</span>
                            <span className="text-xs font-mono font-semibold text-foreground truncate tracking-wider">
                              {watch('password') ? (showPassword ? watch('password') : 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢') : 'Non gÃ©nÃ©rÃ©'}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic leading-tight">
                          Un email de bienvenue avec ces identifiants sera envoyÃ© Ã  l'entreprise aprÃ¨s crÃ©ation.
                        </p>
                      </div>
                    )}

                    {profilType === 'SUBCONTRACTOR' && (
                      <div className="bg-amber-500/10 rounded-xl p-4 space-y-3 border border-amber-500/20 mt-4">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                          <ShieldCheck className="size-3.5" />
                          ConformitÃ© SÃ©curitÃ©
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">AgrÃ©ment</span>
                            <span className="text-xs font-semibold text-foreground truncate">{watch('agreementNumber') || 'Non renseignÃ©'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Tabbed Form */}
                  <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 mb-6 gap-6">
                        <TabsTrigger 
                          value="identity" 
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-sm font-medium whitespace-nowrap"
                        >
                          Identification
                        </TabsTrigger>
                        <TabsTrigger 
                          value="contact" 
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-sm font-medium whitespace-nowrap"
                        >
                          Contact & Localisation
                        </TabsTrigger>
                        {profilType === 'SUBCONTRACTOR' && (
                          <TabsTrigger 
                            value="account" 
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-sm font-medium whitespace-nowrap"
                          >
                            AccÃ¨s & Compte
                          </TabsTrigger>
                        )}
                        <TabsTrigger 
                          value="specifics" 
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-sm font-medium whitespace-nowrap"
                        >
                          SpÃ©cificitÃ©s MÃ©tier
                        </TabsTrigger>
                        <TabsTrigger 
                          value="documents" 
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 text-sm font-medium whitespace-nowrap"
                        >
                          Documents & Notes
                        </TabsTrigger>
                      </TabsList>

                      {/* Tab 1: Identity */}
                      <TabsContent value="identity" className="space-y-8 mt-0">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                            <Building2 className="size-4 text-foreground/70" />
                          </div>
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Informations Entreprise</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                          {!hideTypeSelect && (
                            <FormField control={form.control} name="type" render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-[13px] font-bold text-foreground">Type de Partenaire</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger className="h-11 shadow-sm"><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="PRESTATAIRE">Prestataire (Services GÃ©nÃ©raux)</SelectItem>
                                    <SelectItem value="SUBCONTRACTOR">Sous-traitant (SÃ©curitÃ© PrivÃ©e)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )} />
                          )}
                          <FormField control={form.control} name="siret" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[13px] font-bold text-foreground">NumÃ©ro SIRET</FormLabel>
                              <FormControl><Input placeholder="14 chiffres" {...field} className="h-11 shadow-sm" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[13px] font-bold text-foreground">Nom de la sociÃ©tÃ©</FormLabel>
                            <FormControl><Input placeholder="Raison sociale" {...field} className="h-11 shadow-sm" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </TabsContent>

                      {/* Tab 2: Contact */}
                      <TabsContent value="contact" className="space-y-6 pt-2">
                        <div className="grid grid-cols-2 gap-5">
                          <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[13px] font-bold text-foreground text-foreground">Email de contact</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                  <Input placeholder="contact@entreprise.com" {...field} className="h-11 pl-10 shadow-sm" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[13px] font-bold text-foreground text-foreground">TÃ©lÃ©phone</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                  <Input placeholder="+33..." {...field} className="h-11 pl-10 shadow-sm" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-1 gap-5">
                          <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[13px] font-bold text-foreground">Adresse SiÃ¨ge</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                  <Input placeholder="NÂ°, Rue..." {...field} className="h-11 pl-10 shadow-sm" />
                                </div>
                              </FormControl>
                            </FormItem>
                          )} />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                          <FormField control={form.control} name="postalCode" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[13px] font-bold text-foreground">Code Postal</FormLabel>
                              <FormControl><Input placeholder="75000" {...field} className="h-11 shadow-sm" /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="city" render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[13px] font-bold text-foreground">Ville</FormLabel>
                              <FormControl><Input placeholder="Paris" {...field} className="h-11 shadow-sm" /></FormControl>
                            </FormItem>
                          )} />
                        </div>
                      </TabsContent>

                      {/* Tab: AccÃ¨s & Compte (Subcontractors only) */}
                      {profilType === 'SUBCONTRACTOR' && (
                        <TabsContent value="account" className="space-y-8 mt-0">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                              <Shield className="size-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Identifiants de Connexion</h3>
                          </div>

                          <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-6">
                            <div className="flex items-start gap-4">
                              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Info className="size-5 text-primary" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-foreground tracking-tight leading-none">AccÃ¨s Responsable Entreprise</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  L'identifiant SaaS sera gÃ©nÃ©rÃ© Ã  partir du nom du responsable. 
                                  Il permettra l'accÃ¨s Ã  la facturation et au suivi du planning de ses agents.
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                              <FormField
                                control={form.control}
                                name="representativeFirstName"
                                render={({ field }) => (
                                  <FormItem className="space-y-1.5">
                                    <FormLabel className="text-[13px] font-bold text-foreground">PrÃ©nom du responsable</FormLabel>
                                    <FormControl><Input placeholder="PrÃ©nom" {...field} className="h-11 shadow-sm" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="representativeLastName"
                                render={({ field }) => (
                                  <FormItem className="space-y-1.5">
                                    <FormLabel className="text-[13px] font-bold text-foreground">Nom du responsable</FormLabel>
                                    <FormControl><Input placeholder="Nom" {...field} className="h-11 shadow-sm" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex flex-col gap-1">
                              <span className="text-[10px] text-primary uppercase font-bold tracking-wider leading-none">SaaS Email Identifiant</span>
                              <span className="text-sm font-bold text-foreground">{proEmail || 'En attente des informations responsable...'}</span>
                            </div>

                            <Separator className="bg-border/50" />

                            <FormField
                              control={form.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <FormLabel className="text-[13px] font-bold text-foreground">Mot de passe provisoire</FormLabel>
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      className="h-auto p-0 text-[11px] font-bold uppercase tracking-wider text-primary hover:no-underline hover:bg-transparent"
                                      onClick={generatePassword}
                                    >
                                      GÃ©nÃ©rer automatiquement
                                    </Button>
                                  </div>
                                  <FormControl>
                                    <div className="relative">
                                      <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                      <Input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" 
                                        {...field} 
                                        className="h-11 pl-10 pr-12 shadow-sm font-mono tracking-wider" 
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 size-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowPassword(!showPassword)}
                                      >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                      </Button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>
                      )}

                      {/* Tab 3: Specifics */}
                      <TabsContent value="specifics" className="space-y-6 pt-2">
                        {profilType === 'PRESTATAIRE' ? (
                          <div className="space-y-6">
                            <div className="flex items-center gap-2.5">
                              <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <Briefcase className="size-4 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Domaine d'Intervention</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-5">
                              <FormField control={form.control} name="service" render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-[13px] font-bold text-foreground">Secteur d'activitÃ©</FormLabel>
                                  <FormControl><Input placeholder="ex: Nettoyage informatique" {...field} className="h-11 shadow-sm" /></FormControl>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="specialty" render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-[13px] font-bold text-foreground">SpÃ©cialitÃ© technique</FormLabel>
                                  <FormControl><Input placeholder="ex: Maintenance serveurs" {...field} className="h-11 shadow-sm" /></FormControl>
                                </FormItem>
                              )} />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="flex items-center gap-2.5">
                              <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                <ShieldCheck className="size-4 text-amber-600 dark:text-amber-400" />
                              </div>
                              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">AgrÃ©ment SÃ©curitÃ© PrivÃ©e</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                              <FormField control={form.control} name="agreementNumber" render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-[13px] font-bold text-foreground text-foreground">NumÃ©ro d'agrÃ©ment</FormLabel>
                                  <FormControl><Input placeholder="AGR-..." {...field} className="h-11 shadow-sm" /></FormControl>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="authorizationNumber" render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-[13px] font-bold text-foreground text-foreground">Autorisation d'exercer</FormLabel>
                                  <FormControl><Input placeholder="AUT-..." {...field} className="h-11 shadow-sm" /></FormControl>
                                </FormItem>
                              )} />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                              <FormField control={form.control} name="expiryDate" render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-[13px] font-bold text-foreground text-foreground">Date d'expiration</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="date" 
                                      className="h-11 shadow-sm px-4"
                                      name={field.name}
                                      onBlur={field.onBlur}
                                      onChange={(event) => field.onChange(event.target.value)}
                                      ref={field.ref}
                                      value={(field.value as any) instanceof Date ? (field.value as any).toISOString().split('T')[0] : (field.value || '')}
                                    />
                                  </FormControl>
                                </FormItem>
                              )} />
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      {/* Tab 4: Documents */}
                      <TabsContent value="documents" className="space-y-6 pt-2">
                         <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                            <FileText className="size-4 text-foreground/70" />
                          </div>
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Documents & Notes</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Insurance Document */}
                          <div className="relative group">
                            <label htmlFor="doc-insurance" className={cn(
                              "p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-2 cursor-pointer bg-muted/5 w-full",
                              watch('documentInsurance') ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50"
                            )}>
                              {watch('documentInsurance') ? (
                                <RiCheckboxCircleFill className="size-8 text-primary" />
                              ) : (
                                <CloudUpload className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                              )}
                              <span className="text-xs font-bold text-foreground/70 text-center">
                                {watch('documentInsurance') instanceof File 
                                  ? (watch('documentInsurance') as File).name 
                                  : "Assurance RC Pro"}
                              </span>
                              <span className="text-[10px] text-muted-foreground italic">PDF, JPG (max 5MB)</span>
                            </label>
                            <input 
                              type="file" 
                              id="doc-insurance" 
                              className="hidden" 
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setValue('documentInsurance', file as any);
                              }}
                            />
                          </div>

                          {/* Kbis Document */}
                          <div className="relative group">
                            <label htmlFor="doc-kbis" className={cn(
                              "p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-2 cursor-pointer bg-muted/5 w-full",
                              watch('documentKbis') ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50"
                            )}>
                              {watch('documentKbis') ? (
                                <RiCheckboxCircleFill className="size-8 text-primary" />
                              ) : (
                                <CloudUpload className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                              )}
                              <span className="text-xs font-bold text-foreground/70 text-center">
                                {watch('documentKbis') instanceof File 
                                  ? (watch('documentKbis') as File).name 
                                  : "Extrait Kbis"}
                              </span>
                              <span className="text-[10px] text-muted-foreground italic">PDF, JPG (max 5MB)</span>
                            </label>
                            <input 
                              type="file" 
                              id="doc-kbis" 
                              className="hidden" 
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setValue('documentKbis', file as any);
                              }}
                            />
                          </div>

                          {/* CNAPS Agreement Document (Only for Subcontractors) */}
                          {profilType === 'SUBCONTRACTOR' && (
                            <div className="relative group col-span-2">
                              <label htmlFor="doc-cnaps" className={cn(
                                "p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-2 cursor-pointer bg-muted/5 w-full",
                                watch('documentCnaps') ? "border-amber-500/50 bg-amber-500/5" : "border-border hover:border-amber-500/50"
                              )}>
                                {watch('documentCnaps') ? (
                                  <ShieldCheck className="size-8 text-amber-500" />
                                ) : (
                                  <Shield className="size-8 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                                )}
                                <span className="text-xs font-bold text-foreground/70 text-center">
                                  {watch('documentCnaps') instanceof File 
                                    ? (watch('documentCnaps') as File).name 
                                    : "AgrÃ©ment CNAPS (Obligatoire)"}
                                </span>
                                <span className="text-[10px] text-muted-foreground italic">PDF, JPG (max 5MB)</span>
                              </label>
                              <input 
                                type="file" 
                                id="doc-cnaps" 
                                className="hidden" 
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setValue('documentCnaps', file as any);
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <FormField control={form.control} name="description" render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[13px] font-bold text-foreground flex items-center gap-2">
                                <TextQuote className="size-3.5" />
                                Notes & Description
                            </FormLabel>
                            <FormControl>
                              <textarea 
                                {...field} 
                                className="w-full min-h-[120px] p-3 rounded-lg bg-muted/30 border border-border focus:bg-background focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                                placeholder="Informations complÃ©mentaires sur le partenaire..."
                              />
                            </FormControl>
                          </FormItem>
                        )} />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
            </SheetBody>

            <SheetFooter className="border-t py-4 px-6 bg-muted/20 shrink-0">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="size-4" />
                  <span className="text-xs italic">Tous les champs marquÃ©s d'un astÃ©risque sont obligatoires.</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                    Annuler
                  </Button>
                  <Button type="submit" className="px-8 shadow-lg shadow-primary/20" disabled={mutation.isPending}>
                    {mutation.isPending ? (
                      <>
                        <LoaderCircleIcon className="size-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="size-4 mr-2" />
                        {labels?.submit ?? 'Enregistrer le Partenaire'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export { ProfilAddSheet };

