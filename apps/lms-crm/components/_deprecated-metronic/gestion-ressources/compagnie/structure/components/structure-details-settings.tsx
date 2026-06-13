'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FieldErrors, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Phone,
  TextQuote,
  GraduationCap,
  Globe,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { StructureEditSchema, StructureEditSchemaType } from '../forms/structure-edit-schema';
import { Textarea } from '@/components/ui/textarea';

interface StructureDetailsSettingsProps {
  structure: any;
  formRef?: React.RefObject<HTMLFormElement | null>;
}

export function StructureDetailsSettings({ structure, formRef }: StructureDetailsSettingsProps) {
  const queryClient = useQueryClient();

  const isHeadquarter = structure?.type === 'HEADQUARTER';

  const buildDefaults = useCallback((p: any): StructureEditSchemaType => ({
    name: p.name || '',
    type: p.type || 'AGENCY',
    description: p.description || '',
    parentId: p.parentId || null,
    isActive: p.isActive ?? true,
    nda: p.nda || '',
    agreementNumber: p.agreementNumber || '',
    qualiopiStatus: p.qualiopiStatus || 'NONE',
    siret: p.siret || '',
    nafCode: p.nafCode || '',
    capacity: p.capacity || null,
    address: p.address || '',
    city: p.city || '',
    postalCode: p.postalCode || '',
    contactEmail: p.contactEmail || '',
    contactPhone: p.contactPhone || '',
    website: p.website || '',
    legalStatus: p.legalStatus || '',
    capital: p.capital || '',
    rcsNumber: p.rcsNumber || '',
    tvaNumber: p.tvaNumber || '',
    openedAt: p.openedAt || '',
    trainingTeamInfo: p.trainingTeamInfo || null,
  }), []);

  const defaultValues = useMemo(() => buildDefaults(structure), [buildDefaults, structure]);

  const form = useForm<StructureEditSchemaType>({
    resolver: zodResolver(StructureEditSchema) as any,
    defaultValues,
    mode: 'onSubmit',
  });

  const selectedType = form.watch('type');

  useEffect(() => {
    form.reset(defaultValues);
  }, [form, defaultValues]);

  const mutation = useMutation({
    mutationFn: async (values: StructureEditSchemaType) => {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/org-units/${structure.id}`, {
        method: 'PUT',
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message || 'Échec de la mise à jour');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-units-list'] });
      queryClient.invalidateQueries({ queryKey: ['org-unit-details', structure.id] });
      
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/org-units/${structure.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message || 'Échec de la suppression');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-units-list'] });
      toast.success('Unité supprimée avec succès');
      // On devrait fermer le sheet ici, mais la prop onOpenChange n'est pas passée ici
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = (values: StructureEditSchemaType) => {
    mutation.mutate(values);
  };

  const handleInvalid = (errors: FieldErrors<StructureEditSchemaType>) => {
    toast.error('Veuillez corriger les erreurs dans le formulaire');
  };

  return (
    <div className="space-y-6">
      {isHeadquarter && (
        <Alert variant="mono" className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertIcon><AlertTriangle className="size-4" /></AlertIcon>
          <AlertTitle className="text-xs font-bold">
            Cette unité est votre Siège Social. Elle est liée à votre contrat et ne peut pas être supprimée.
          </AlertTitle>
        </Alert>
      )}

      <Form {...form}>
        <form
          ref={formRef}
          onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}
          className="space-y-6 pb-20"
        >
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
            <FormField control={form.control as any} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider">Nom de l'unité</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-muted/30" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control as any} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider">Type d'unité</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isHeadquarter}>
                  <FormControl>
                    <SelectTrigger className="bg-muted/30">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="HEADQUARTER">Siège Social</SelectItem>
                    <SelectItem value="REGION">Direction Régionale</SelectItem>
                    <SelectItem value="AGENCY">Agence</SelectItem>
                    <SelectItem value="DEPOSIT">Dépôt</SelectItem>
                    <SelectItem value="SECTOR">Secteur</SelectItem>
                    <SelectItem value="DEPARTMENT">Département</SelectItem>
                    <SelectItem value="TRAINING_SCHOOL">École de Formation</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
                {isHeadquarter && <p className="text-[10px] text-amber-600 font-medium">Le type du Siège Social ne peut pas être changé.</p>}
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control as any} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wider">Description</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ''} className="bg-muted/30 min-h-[80px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="bg-muted/10 p-4 rounded-xl border border-border space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <MapPin className="size-3" /> Localisation & Contact
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField control={form.control as any} name="address" render={({ field }) => (
                <FormItem className="md:col-span-3">
                  <FormLabel className="text-xs">Adresse</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control as any} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Ville</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control as any} name="postalCode" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Code Postal</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control as any} name="contactPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Téléphone</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {(selectedType === 'TRAINING_SCHOOL' || structure.nda) && (
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <GraduationCap className="size-3" /> Spécifications Academy
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <FormField control={form.control as any} name="nda" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">N° Déclaration d'Activité (NDA)</FormLabel>
                    <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control as any} name="qualiopiStatus" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Certification Qualiopi</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">Non certifié</SelectItem>
                        <SelectItem value="PENDING">En cours</SelectItem>
                        <SelectItem value="OBTAINED">Obtenu</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control as any} name="siret" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">SIRET de l'unité</FormLabel>
                    <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control as any} name="capacity" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Capacité d'accueil</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value === null ? '' : field.value} 
                        onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <FormField control={form.control as any} name="legalStatus" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Forme Juridique</FormLabel>
                    <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control as any} name="capital" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Capital Social</FormLabel>
                    <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <FormField control={form.control as any} name="rcsNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">N° RCS / Greffe</FormLabel>
                    <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control as any} name="tvaNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">N° TVA Intracommunautaire</FormLabel>
                    <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          )}

          {!isHeadquarter && (
            <div className="pt-6 border-t border-destructive/20 mt-10">
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-destructive">Zone de danger</h5>
                    <p className="text-xs text-muted-foreground">La suppression est irréversible et impossible si l'unité a des sous-unités.</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm" 
                    className="font-bold uppercase text-[10px]"
                    onClick={() => {
                      if(confirm('Êtes-vous sûr de vouloir supprimer cette unité ?')) {
                        deleteMutation.mutate();
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="size-3.5 mr-2" />
                    {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
