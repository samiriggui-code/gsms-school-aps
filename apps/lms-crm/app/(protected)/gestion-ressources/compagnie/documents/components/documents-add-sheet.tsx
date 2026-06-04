'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { VIE_SCOLAIRE_SHEET_MEDIUM } from '../../../constants/sheet-shell-classes';
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
import { FileText, Calendar as CalendarIcon, User, Info } from 'lucide-react';
import { DocumentAddSchema, DocumentAddSchemaType } from '../forms/documents--add-schema';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

export function DocumentsAddSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const { data: collaborators } = useQuery({
    queryKey: ['collaborateurs-list-select'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/collaborateurs?limit=100');
      return response.json();
    },
  });

  const form = useForm<DocumentAddSchemaType>({
    resolver: zodResolver(DocumentAddSchema),
    defaultValues: {
      type: 'CNI',
      number: '',
      issueDate: '',
      expiryDate: '',
      userId: '',
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: DocumentAddSchemaType) => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/documents', {
        method: 'POST',
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Échec de l\'ajout du document');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.custom(() => (
        <Alert variant="mono" icon="success">
          <AlertIcon><RiCheckboxCircleFill /></AlertIcon>
          <AlertTitle>Document ajouté avec succès</AlertTitle>
        </Alert>
      ));

      queryClient.invalidateQueries({ queryKey: ['company-documents-list'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.custom(() => (
        <Alert variant="mono" icon="destructive">
          <AlertIcon><RiErrorWarningFill /></AlertIcon>
          <AlertTitle>{error.message}</AlertTitle>
        </Alert>
      ));
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_MEDIUM}>
        <SheetHeader className="border-b py-4 px-6 border-border/70 bg-background shrink-0">
          <SheetTitle className="text-sm font-semibold text-foreground">Ajouter un Document Officiel</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="grow flex flex-col min-h-0">
            <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  <div className="bg-primary/5 rounded-xl p-4 flex items-center gap-4 border border-primary/10">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="size-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Informations Document</h4>
                      <p className="text-xs text-muted-foreground">Type, numéro et dates de validité</p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collaborateur concerné</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un collaborateur" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {collaborators?.data?.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de document</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CARTE_PRO">Carte Pro</SelectItem>
                              <SelectItem value="CNI">CNI</SelectItem>
                              <SelectItem value="PASSEPORT">Passeport</SelectItem>
                              <SelectItem value="TITRE_SEJOUR">Titre de Séjour</SelectItem>
                              <SelectItem value="PERMIS_CONDUIRE">Permis de Conduire</SelectItem>
                              <SelectItem value="CASIER_JUDICIAIRE">Casier Judiciaire</SelectItem>
                              <SelectItem value="AUTORISATION_TRAVAIL">Autorisation de Travail</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro / Référence</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 123456789..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date d'émission</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date d'expiration</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
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
                      <FormItem>
                        <FormLabel>Notes (Optionnel)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Commentaires sur ce document..." 
                            className="min-h-[80px] resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </ScrollArea>
            </SheetBody>

            <SheetFooter className="border-t pb-4 px-6 py-4 border-border/60 bg-background shrink-0 flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Ajout...' : 'Ajouter le document'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
