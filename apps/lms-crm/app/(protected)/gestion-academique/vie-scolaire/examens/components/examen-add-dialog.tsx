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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoaderCircleIcon, UserPlus, Info, Mail, Briefcase, Shield, ShieldCheck } from 'lucide-react';
import { UserRole } from '@/app/models/user';
import { useRoleSelectQuery } from '@/app/(protected)/securite-configuration/acces/roles/hooks/use-role-select-query';
import { ExamenAddSchema, ExamenAddSchemaType } from '../forms/examen-add-schema';

const ExamenAddDialog = ({
  open,
  closeDialog,
}: {
  open: boolean;
  closeDialog: () => void;
}) => {
  const queryClient = useQueryClient();

  // Fetch available roles
  const { data: roleList } = useRoleSelectQuery();

  const form = useForm<ExamenAddSchemaType>({
    resolver: zodResolver(ExamenAddSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      roleId: '',
      userCategory: 'INTERNAL',
      password: '',
      isSchedulable: true,
      jobFunction: '',
      qualification: '',
    },
    mode: 'onSubmit',
  });

  const selectedCategory = form.watch('userCategory');

  useEffect(() => {
    form.setValue('roleId', '');
  }, [selectedCategory, form]);

  const filteredRoles = (roleList || []).filter((role: any) => 
    !role.targetCategory || role.targetCategory === selectedCategory
  );

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: async (values: ExamenAddSchemaType) => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/Examens', {
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
      const message = 'Examen ajoutÃ© avec succÃ¨s';
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

      queryClient.invalidateQueries({ queryKey: ['rh-collaborators'] });
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

  const handleSubmit = (values: ExamenAddSchemaType) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-[650px] p-0 overflow-hidden border-none shadow-2xl bg-background">
        <DialogHeader className="px-8 py-6 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">Ajouter un examens</DialogTitle>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">CrÃ©ez un nouveau compte Examen et assignez-lui un rÃ´le et des qualifications.</p>
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
                  <h3 className="text-[13px] font-bold text-foreground/80 uppercase tracking-wider">Informations personnelles</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[13px] font-semibold text-foreground/70">PrÃ©nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Jean" {...field} className="h-11 ps-3 focus-visible:ring-primary/20 border-input bg-muted/20" />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[13px] font-semibold text-foreground/70">Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Dupont" {...field} className="h-11 ps-3 focus-visible:ring-primary/20 border-input bg-muted/20" />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[13px] font-semibold text-foreground/70">Adresse Email Personnelle</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                          <Input placeholder="jean.dupont@exemple.com" {...field} className="h-11 ps-10 focus-visible:ring-primary/20 border-input bg-muted/20" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section: RÃ´le et Fonction */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Shield className="size-4 text-muted-foreground/60" />
                  <h3 className="text-[13px] font-bold text-foreground/80 uppercase tracking-wider">AccÃ¨s et MÃ©tier</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="userCategory"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[13px] font-semibold text-foreground/70">CatÃ©gorie</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => field.onChange(value)}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="h-11 border-input bg-muted/20 focus:ring-primary/20">
                              <SelectValue placeholder="SÃ©lectionner une catÃ©gorie" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="INTERNAL">Interne (RH)</SelectItem>
                                <SelectItem value="CLIENT">Client</SelectItem>
                                <SelectItem value="Examen">Sous-traitant</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roleId"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[13px] font-semibold text-foreground/70">RÃ´le assignÃ©</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => field.onChange(value)}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="h-11 border-input bg-muted/20 focus:ring-primary/20">
                              <SelectValue placeholder="Choisir un rÃ´le" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {Array.isArray(filteredRoles) && filteredRoles.map((role: UserRole) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-medium">{role.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="jobFunction"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[13px] font-semibold text-foreground/70">Fonction / Poste</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Briefcase className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                            <Input placeholder="Ex: Agent de sÃ©curitÃ©..." {...field} className="h-11 ps-10 focus-visible:ring-primary/20 border-input bg-muted/20" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="qualification"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[13px] font-semibold text-foreground/70">Qualification</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <ShieldCheck className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                            <Input placeholder="Ex: ADS, SSIAP 1..." {...field} className="h-11 ps-10 focus-visible:ring-primary/20 border-input bg-muted/20" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex gap-3">
                <Info className="size-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[12px] text-indigo-400 leading-relaxed">
                  Le Examen recevra un email d'invitation pour activer son compte et dÃ©finir son mot de passe.
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
                  <UserPlus className="size-4 mr-2" />
                )}
                CrÃ©er le Examen
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ExamenAddDialog;



