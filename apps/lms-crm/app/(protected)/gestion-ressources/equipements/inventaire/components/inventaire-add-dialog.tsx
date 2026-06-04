'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { LoaderCircleIcon, PackagePlus, Info, Hash, Tag, Activity } from 'lucide-react';
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

const InventaireAddDialog = ({
  open,
  closeDialog,
}: {
  open: boolean;
  closeDialog: () => void;
}) => {
  const queryClient = useQueryClient();
  const { data: sites = [], isLoading: sitesLoading } = useClientSites();

  const form = useForm<InventaireAddSchemaInput, unknown, InventaireAddSchemaType>({
    resolver: zodResolver(InventaireAddSchema),
    defaultValues: {
      label: '',
      serialNumber: '',
      type: 'AUTRE',
      unitCount: 3,
      assignedSiteId: '',
      metadata: emptyEquipmentMetadata(),
      avatar: undefined,
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) {
      form.reset({
        label: '',
        serialNumber: '',
        type: 'AUTRE',
        unitCount: 3,
        assignedSiteId: '',
        metadata: emptyEquipmentMetadata(),
        avatar: undefined,
      });
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: async (values: InventaireAddSchemaType) => {
      const response = await apiFetch('/api/sections/gestion-ressources/equipements/inventaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      const message = 'Équipement ajouté à l\'inventaire avec succès';
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        ),
        {
          position: 'top-center',
        },
      );

      queryClient.invalidateQueries({ queryKey: ['inventaire-list'] });
      closeDialog();
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
        {
          position: 'top-center',
        },
      );
    },
  });

  const isProcessing = mutation.status === 'pending';

  const handleSubmit = (values: InventaireAddSchemaType) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-[650px] p-0 overflow-hidden border-none shadow-2xl bg-background">
        <DialogHeader className="px-8 py-6 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PackagePlus className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">Ajouter à l'inventaire</DialogTitle>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Ajoutez un nouvel équipement à votre inventaire et assignez-lui des propriétés.</p>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogBody className="px-8 py-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Section: Informations de base */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Info className="size-4 text-muted-foreground/60" />
                  <h3 className="text-[13px] font-bold text-foreground/80 uppercase tracking-wider">Informations Équipement</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[13px] font-semibold text-foreground/70">Libellé</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Tag className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                            <Input
                              placeholder="Nom de l'équipement"
                              {...field}
                              className="h-11 ps-10 focus-visible:ring-primary/20 border-input bg-muted/20"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[13px] font-semibold text-foreground/70">N° Série / Référence</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Hash className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                            <Input placeholder="REF-001" {...field} className="h-11 ps-10 focus-visible:ring-primary/20 border-input bg-muted/20" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="unitCount"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[13px] font-semibold text-foreground/70">Nombre de pièces</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            className="h-11 border-input bg-muted/20"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                  <EquipmentTypeSelect
                    control={form.control}
                    name="type"
                    label="Type"
                    className="h-11 border-input bg-muted/20"
                  />
                </div>
              </div>

              {/* Section: Informations additionnelles */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Activity className="size-4 text-muted-foreground/60" />
                  <h3 className="text-[13px] font-bold text-foreground/80 uppercase tracking-wider">Informations additionnelles</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                  <EquipmentSiteSelect
                    control={form.control}
                    name="assignedSiteId"
                    sites={sites}
                    isLoading={sitesLoading}
                    label="Site assigné (optionnel)"
                    className="h-11 border-input bg-muted/20"
                  />

                  <EquipmentPedagogicDomainSelect
                    control={form.control}
                    name="metadata.pedagogicDomain"
                    label="Domaine pédagogique"
                    className="h-11 border-input bg-muted/20"
                  />
                </div>

                <EquipmentComplianceFields
                  control={form.control}
                  inputClassName="h-11 border-input bg-muted/20"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                <Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[12px] text-blue-400 leading-relaxed">
                  L'équipement sera ajouté à la liste d'inventaire générale et pourra être assigné.
                </p>
              </div>
            </DialogBody>

            <DialogFooter className="px-8 py-6 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" className="h-11 px-6 font-bold text-muted-foreground hover:bg-muted" onClick={closeDialog}>
                Annuler
              </Button>
              <Button
                type="submit"
                className="h-11 px-8 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20"
                disabled={!form.formState.isDirty || isProcessing}
              >
                {isProcessing ? (
                  <LoaderCircleIcon className="animate-spin size-4 mr-2" />
                ) : (
                  <PackagePlus className="size-4 mr-2" />
                )}
                Ajouter à l'inventaire
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InventaireAddDialog;
