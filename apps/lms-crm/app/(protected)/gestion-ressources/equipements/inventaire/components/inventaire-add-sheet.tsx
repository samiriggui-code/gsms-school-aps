'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_AUTO } from '../../../constants/sheet-shell-classes';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  PackagePlus,
  MapPin,
  Package as PackageIcon,
  Info,
  CloudUpload,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  InventaireAddSchema,
  InventaireAddSchemaInput,
  InventaireAddSchemaType,
} from '../forms/inventaire-add-schema';
import { emptyEquipmentMetadata } from '../../forms/equipment-metadata-schema';
import {
  EquipmentComplianceFields,
  EquipmentPedagogicDomainSelect,
  EquipmentSiteSelect,
  EquipmentTypeSelect,
} from '../../components/equipment-form-selects';
import { useClientSites } from '../../hooks/use-client-sites';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const InventaireAddSheet = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('identity');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { data: sites = [], isLoading: sitesLoading } = useClientSites();

  const form = useForm<InventaireAddSchemaInput, unknown, InventaireAddSchemaType>({
    resolver: zodResolver(InventaireAddSchema),
    defaultValues: {
      label: '',
      serialNumber: '',
      type: 'AUTRE',
      unitCount: 3,
      assignedSiteId: '',
      avatar: '',
      metadata: emptyEquipmentMetadata(),
    },
    mode: 'onChange',
  });

  const { watch, setValue, reset } = form;
  const label = watch('label');
  const serialNumber = watch('serialNumber');
  const metadata = watch('metadata');

  const completion = {
    identity: Boolean(label && watch('type')),
    specs: Boolean(serialNumber && watch('unitCount')),
    compliance: Boolean(
      metadata?.brand ||
        metadata?.nextControlDate ||
        metadata?.regulatoryRef,
    ),
    location: Boolean(watch('assignedSiteId') || metadata?.storageRoom),
  };

  const requiredDone = completion.identity && completion.specs;

  const mutation = useMutation({
    mutationFn: async (values: InventaireAddSchemaType) => {
      const formData = new FormData();

      Object.entries(values).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === 'metadata') {
          formData.append(key, JSON.stringify(value));
        } else if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      });

      const response = await apiFetch('/api/sections/gestion-ressources/equipements/inventaire', {
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
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Équipement ajouté à l&apos;inventaire</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );

      queryClient.invalidateQueries({ queryKey: ['equipment-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-stock-available'] });
      onOpenChange(false);
      reset({
        label: '',
        serialNumber: '',
        type: 'AUTRE',
        unitCount: 3,
        assignedSiteId: '',
        avatar: '',
        metadata: emptyEquipmentMetadata(),
      });
      setAvatarPreview(null);
      setActiveTab('identity');
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

  const progressItems: Array<{
    label: string;
    done: boolean;
    optional: boolean;
    tab: string;
  }> = [
    { label: 'Identification', done: completion.identity, optional: false, tab: 'identity' },
    { label: 'Spécifications', done: completion.specs, optional: false, tab: 'identity' },
    { label: 'Conformité', done: completion.compliance, optional: true, tab: 'compliance' },
    { label: 'Localisation', done: completion.location, optional: true, tab: 'location' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_AUTO}>
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-background shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
            Nouvelle catégorie — Inventaire
          </SheetTitle>
          <SheetDescription className="sr-only">
            Ajouter une catégorie d&apos;équipement et générer les pièces unitaires.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="grow flex flex-col min-h-0"
          >
            <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
              <div className="flex justify-between flex-wrap gap-2 border-b border-border px-5 py-5 bg-background shrink-0">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="lg:text-[24px] font-bold text-foreground tracking-tight leading-none">
                      {label || 'Nouvelle catégorie'}
                    </span>
                    <Badge
                      variant="warning"
                      appearance="light"
                      size="sm"
                      className="font-bold uppercase text-[10px] px-2"
                    >
                      Brouillon
                    </Badge>
                  </div>
                  <div className="text-2sm text-muted-foreground">
                    Crée la catégorie et {watch('unitCount') || 3} pièce(s) numérotées (001, 002, 003…).
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-0">
                <div className="flex flex-wrap lg:flex-nowrap px-5 grow">
                  <div className="w-full shrink-0 lg:w-[280px] py-5 lg:pe-8 space-y-6">
                    <div className="w-full h-[240px] bg-muted/10 border border-border rounded-lg flex items-center justify-center overflow-hidden relative group">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
                          <PackageIcon className="size-16" />
                          <span className="text-xs font-bold uppercase tracking-widest">Pas d&apos;image</span>
                        </div>
                      )}
                    </div>

                    <label
                      htmlFor="avatar-upload"
                      className="flex items-center justify-center gap-2 h-10 rounded-md border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors text-xs font-bold cursor-pointer"
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
                          setValue('avatar', file as File);
                          const reader = new FileReader();
                          reader.onload = (event) =>
                            setAvatarPreview(event.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <span>Avancement</span>
                        <span className="text-foreground">
                          {progressItems.filter((i) => i.done).length}/{progressItems.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {progressItems.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setActiveTab(item.tab)}
                            className="flex w-full items-center justify-between text-xs rounded-md px-1 py-0.5 hover:bg-muted/40 transition-colors text-left"
                          >
                            <span className="text-muted-foreground">
                              {item.label}
                              {item.optional ? ' (opt.)' : ''}
                            </span>
                            <span
                              className={cn(
                                'font-semibold',
                                item.done ? 'text-emerald-500' : item.optional ? 'text-muted-foreground' : 'text-amber-500',
                              )}
                            >
                              {item.done ? 'Complet' : item.optional ? '—' : 'À remplir'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 py-5 min-w-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 mb-6 gap-6">
                        <TabsTrigger
                          value="identity"
                          className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-0 pb-3 text-sm font-bold shadow-none"
                        >
                          Identification
                        </TabsTrigger>
                        <TabsTrigger
                          value="compliance"
                          className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-0 pb-3 text-sm font-bold shadow-none"
                        >
                          Conformité
                        </TabsTrigger>
                        <TabsTrigger
                          value="location"
                          className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-0 pb-3 text-sm font-bold shadow-none"
                        >
                          Localisation
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="identity" className="space-y-6 mt-0">
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="label"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                                  Libellé de la catégorie
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Défibrillateur AED" {...field} className="h-11 shadow-sm" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="serialNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                                  Référence catégorie
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: DEF-AED" {...field} className="h-11 shadow-sm" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="unitCount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                                  Nombre de pièces
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={20}
                                    className="h-11 shadow-sm"
                                    value={field.value}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <p className="text-[10px] text-muted-foreground">
                                  Génère les unités -001, -002, -003… avec statuts démo.
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <EquipmentTypeSelect control={form.control} name="type" />
                          <EquipmentPedagogicDomainSelect
                            control={form.control}
                            name="metadata.pedagogicDomain"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="compliance" className="space-y-6 mt-0">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <ShieldCheck className="size-4" />
                          <p className="text-xs">
                            Informations héritées par chaque pièce de la catégorie (marque, contrôles, normes).
                          </p>
                        </div>
                        <EquipmentComplianceFields control={form.control} />
                      </TabsContent>

                      <TabsContent value="location" className="space-y-6 mt-0">
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                          <EquipmentSiteSelect
                            control={form.control}
                            name="assignedSiteId"
                            sites={sites}
                            isLoading={sitesLoading}
                          />
                          <FormField
                            control={form.control}
                            name="metadata.storageRoom"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                                  Salle / zone de stockage
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ex: Salle simulation RDC"
                                    {...field}
                                    value={(field.value as string) ?? ''}
                                    className="h-11 shadow-sm"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        {!sitesLoading && sites.length === 0 && (
                          <div className="bg-muted/30 border border-dashed border-border rounded-lg p-4 flex gap-3">
                            <MapPin className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground">
                              Aucun site client configuré : l&apos;équipement restera au stock global (siège).
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
            </SheetBody>

            <SheetFooter className="border-t p-5 bg-muted/10 shrink-0 flex items-center justify-between">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Info className="size-3.5" />
                {requiredDone
                  ? 'Prêt à créer la catégorie et les pièces.'
                  : 'Libellé, référence et type sont obligatoires.'}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground font-bold px-8 shadow-lg shadow-primary/20"
                  disabled={mutation.isPending || !requiredDone}
                >
                  {mutation.isPending ? (
                    <RefreshCw className="size-4 animate-spin mr-2" />
                  ) : (
                    <PackagePlus className="size-4 mr-2" />
                  )}
                  Valider l&apos;ajout
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default InventaireAddSheet;
