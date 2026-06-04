'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { normalizeEquipmentType } from '@/lib/equipment-constants';
import {
  normalizeEquipmentMetadata,
} from '../../forms/equipment-metadata-schema';
import {
  EquipmentComplianceFields,
  EquipmentPedagogicDomainSelect,
  EquipmentSiteSelect,
  EquipmentTypeSelect,
} from '../../components/equipment-form-selects';
import { useClientSites } from '../../hooks/use-client-sites';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill, RiRefreshLine } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
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
import { Package, Hash, MapPin, Settings, Info, ShieldCheck, CloudUpload, Package as PackageIcon } from 'lucide-react';
import { Equipment as Inventaire } from '@/app/models/equipment';
import { EquipmentEditSchema, EquipmentEditSchemaType } from '../forms/equipment-edit-schema';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/helpers';
import { getCatalogBaseSerial } from '@/lib/equipment-catalog';

interface InventaireDetailsSettingsProps {
  inventaire: Inventaire;
  formRef?: React.RefObject<HTMLFormElement | null>;
  onSuccess?: (catalogLabel?: string) => void;
  /** Fiche catalogue : édition catégorie + sync toutes les pièces */
  catalogMode?: boolean;
  catalogLabel?: string;
}

export function InventaireDetailsSettings({
  inventaire,
  formRef,
  onSuccess,
  catalogMode = false,
  catalogLabel,
}: InventaireDetailsSettingsProps) {
  const queryClient = useQueryClient();
  const { data: sites = [], isLoading: sitesLoading } = useClientSites();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(inventaire.avatar || null);

  const form = useForm<EquipmentEditSchemaType>({
    resolver: zodResolver(EquipmentEditSchema),
    defaultValues: {
      label: inventaire.label || '',
      serialNumber: inventaire.serialNumber || '',
      type: normalizeEquipmentType(inventaire.type),
      status: inventaire.status || 'AVAILABLE',
      assignedSiteId: inventaire.assignedSiteId || null,
      metadata: normalizeEquipmentMetadata(inventaire.metadata),
      avatar: '',
    },
    mode: 'onSubmit',
  });

  const { setValue } = form;
  const [settingsTab, setSettingsTab] = useState('identification');

  useEffect(() => {
    if (inventaire.avatar) {
      setAvatarPreview(inventaire.avatar);
    }
  }, [inventaire.avatar]);

  useEffect(() => {
    form.reset({
      label: inventaire.label || '',
      serialNumber: inventaire.serialNumber || '',
      type: normalizeEquipmentType(inventaire.type),
      status: inventaire.status || 'AVAILABLE',
      assignedSiteId: inventaire.assignedSiteId || null,
      metadata: normalizeEquipmentMetadata(inventaire.metadata),
      avatar: '',
    });
    if (inventaire.avatar) {
      setAvatarPreview(inventaire.avatar);
    }
  }, [inventaire.id, inventaire.label, inventaire.serialNumber, inventaire.type, inventaire.status, inventaire.assignedSiteId, inventaire.metadata, inventaire.avatar, form]);

  const mutation = useMutation({
    mutationFn: async (values: EquipmentEditSchemaType) => {
      const formData = new FormData();

      const entries = Object.entries(values).filter(([key]) => {
        if (!catalogMode) return true;
        return key !== 'serialNumber' && key !== 'status';
      });

      entries.forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            formData.append(key, value);
          } else if (key === 'metadata' && typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await apiFetch(
        `/api/sections/gestion-ressources/equipements/inventaire/${inventaire.id}`,
        { method: 'PATCH', body: formData },
      );

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      const patchResult = await response.json();
      const equipment = patchResult.data ?? patchResult;
      const avatarFromMeta =
        equipment?.metadata && typeof equipment.metadata === 'object'
          ? (equipment.metadata as { avatar?: string }).avatar
          : equipment?.avatar;

      if (catalogMode && catalogLabel) {
        const syncResponse = await apiFetch(
          '/api/sections/gestion-ressources/equipements/inventaire/sync-catalog',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromLabel: catalogLabel,
              label: values.label,
              type: values.type,
              metadata: values.metadata,
              avatarUrl: avatarFromMeta ?? undefined,
            }),
          },
        );
        if (!syncResponse.ok) {
          const { message } = await syncResponse.json();
          throw new Error(message);
        }
        const syncResult = await syncResponse.json();
        const syncedLabel =
          syncResult?.data?.catalogLabel ?? values.label ?? catalogLabel;
        return { ...syncResult, syncedCatalogLabel: syncedLabel };
      }

      return patchResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['equipment-inventaire'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', inventaire.id] });
      queryClient.invalidateQueries({ queryKey: ['equipment-catalog'] });

      const syncedCatalogLabel =
        result && typeof result === 'object' && 'syncedCatalogLabel' in result
          ? (result as { syncedCatalogLabel?: string }).syncedCatalogLabel
          : undefined;

      if (onSuccess) {
        onSuccess(syncedCatalogLabel);
      }

      toast.custom(() => (
        <Alert variant="mono" icon="success">
          <AlertIcon>
            <RiCheckboxCircleFill />
          </AlertIcon>
          <AlertTitle>
            {catalogMode ? 'Catégorie mise à jour sur toutes les pièces' : 'Équipement mis à jour avec succès'}
          </AlertTitle>
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

  const handleSubmit = (values: EquipmentEditSchemaType) => {
    mutation.mutate(values);
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <Form {...form}>
          <form 
            ref={formRef} 
            onSubmit={form.handleSubmit(handleSubmit)} 
            className="space-y-6"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                <Settings className="size-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                  {catalogMode ? 'Paramètres de la catégorie' : "Paramètres de l'équipement"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {catalogMode
                    ? 'Photo, libellé et localisation sont appliqués à toutes les pièces du catalogue.'
                    : 'Modifiez les attributs enregistrés de cette pièce.'}
                </p>
              </div>
            </div>

            {catalogMode && (
              <div className="flex gap-3 rounded-lg border border-border/60 bg-muted/20 p-4">
                <Info className="size-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Référence catégorie :{' '}
                  <span className="font-semibold text-foreground">
                    {getCatalogBaseSerial(inventaire.serialNumber)}
                  </span>
                  . Statuts et pièces individuelles : onglet Inventaire (ou fiche unité).
                </p>
              </div>
            )}

            <Tabs value={settingsTab} onValueChange={setSettingsTab} className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 mb-6 gap-6">
                <TabsTrigger
                  value="identification"
                  className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-0 pb-3 text-sm font-bold shadow-none"
                >
                  Identification
                </TabsTrigger>
                {!catalogMode && (
                <TabsTrigger
                  value="compliance"
                  className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-0 pb-3 text-sm font-bold shadow-none"
                >
                  Conformité
                </TabsTrigger>
                )}
                <TabsTrigger
                  value="location"
                  className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none px-0 pb-3 text-sm font-bold shadow-none"
                >
                  Localisation
                </TabsTrigger>
              </TabsList>

              <TabsContent value="identification" className="space-y-6 mt-0">
            <section className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                  <CloudUpload className="size-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                  {catalogMode ? 'Photo de la catégorie' : "Photo de l'équipement"}
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-6 bg-muted/20 p-4 rounded-xl border border-dashed border-border/60">
                <div className="w-[140px] h-[140px] bg-background border border-border rounded-lg flex items-center justify-center overflow-hidden relative group">
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
                          <PackageIcon className="size-12" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{getInitials(inventaire.label)}</span>
                        </div>
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>

                <div className="flex flex-col gap-3 grow pt-2">
                  <p className="text-sm font-semibold text-foreground">Télécharger une nouvelle photo</p>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-[300px]">
                    Utilisez une image claire pour faciliter l'identification visuelle lors des inventaires physiques.
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <label
                      htmlFor="avatar-edit-upload"
                      className="flex items-center justify-center gap-2 px-4 h-9 rounded-md border border-border bg-background hover:bg-muted/50 transition-colors text-xs font-bold text-foreground cursor-pointer shadow-sm"
                    >
                      <CloudUpload className="size-4" />
                      {avatarPreview ? 'Changer' : 'Sélectionner'}
                    </label>
                    <input
                      type="file"
                      id="avatar-edit-upload"
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
                    {avatarPreview && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-muted-foreground"
                        type="button"
                        onClick={() => {
                          setValue('avatar', '');
                          setAvatarPreview(inventaire.avatar || null);
                        }}
                      >
                        Réinitialiser
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <Separator className="bg-border/50" />

            {/* Technical Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                  <Package className="size-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Informations Techniques</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">Libellé</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-10 bg-secondary/50 border-border focus:bg-background transition-colors" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {catalogMode ? (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-2sm font-semibold text-foreground">Référence catégorie</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                        <Input
                          readOnly
                          disabled
                          value={getCatalogBaseSerial(inventaire.serialNumber)}
                          className="h-10 pl-10 bg-muted/40 border-border"
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                ) : (
                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-2sm font-semibold text-foreground">Numéro de série</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                            <Input {...field} className="h-10 pl-10 bg-secondary/50 border-border focus:bg-background transition-colors" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <EquipmentTypeSelect
                  control={form.control}
                  name="type"
                  label={catalogMode ? 'Type de catégorie' : "Type d'équipement"}
                  className="h-10 bg-secondary/50 border-border"
                />
                {!catalogMode && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">Statut opérationnel</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 bg-secondary/50 border-border">
                            <SelectValue placeholder="Sélectionner un statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AVAILABLE">Disponible</SelectItem>
                          <SelectItem value="IN_USE">En service</SelectItem>
                          <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                          <SelectItem value="OUT_OF_SERVICE">Hors service</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                )}
              </div>
            </section>
              </TabsContent>

              {!catalogMode && (
              <TabsContent value="compliance" className="space-y-6 mt-0">
            <section className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                  <ShieldCheck className="size-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                  Conformité & fournisseur
                </h3>
              </div>
              <EquipmentPedagogicDomainSelect
                control={form.control}
                name="metadata.pedagogicDomain"
                label="Domaine pédagogique"
                className="h-10 bg-secondary/50 border-border max-w-md"
              />
              <EquipmentComplianceFields
                control={form.control}
                inputClassName="h-10 bg-secondary/50 border-border focus:bg-background transition-colors"
              />
            </section>
              </TabsContent>
              )}

              <TabsContent value="location" className="space-y-6 mt-0">
            <section className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                  <MapPin className="size-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Affectation & Localisation</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-5">
                <EquipmentSiteSelect
                  control={form.control}
                  name="assignedSiteId"
                  sites={sites}
                  isLoading={sitesLoading}
                  nullable
                  label="Site d'affectation"
                  className="h-10 bg-secondary/50 border-border"
                />
                <FormField
                  control={form.control}
                  name="metadata.storageRoom"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-2sm font-semibold text-foreground">Salle / zone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={(field.value as string) ?? ''}
                          className="h-10 bg-secondary/50 border-border focus:bg-background transition-colors"
                          placeholder="Ex: Salle incendie B2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
