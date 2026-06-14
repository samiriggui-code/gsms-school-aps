'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Loader2, Theater } from 'lucide-react';
import { apiFetch } from '@/lib/api';
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
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SalleFormSchema, type SalleFormValues } from '../forms/salle-form-schema';

const DEFAULT_VALUES: SalleFormValues = {
  name: '',
  shortCode: '',
  capacity: '',
  floorLabel: '',
  imageUrl: '',
  isActive: true,
  sortOrder: 0,
};

export function SalleAddSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<SalleFormValues>({
    resolver: zodResolver(SalleFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) form.reset(DEFAULT_VALUES);
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: async (values: SalleFormValues) => {
      const capacity =
        values.capacity === '' || values.capacity === null || values.capacity === undefined
          ? null
          : Number(values.capacity);
      const res = await apiFetch('/api/sections/gestion-ressources/equipements/salles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          shortCode: values.shortCode?.trim() || null,
          capacity,
          floorLabel: values.floorLabel?.trim() || null,
          imageUrl: values.imageUrl?.trim() || null,
          isActive: values.isActive,
          sortOrder: values.sortOrder ?? 0,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.error?.message || 'Création impossible');
      }
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-list'] });
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-planning'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Salle créée</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
      form.reset(DEFAULT_VALUES);
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive">
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{e.message}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
    },
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) form.reset(DEFAULT_VALUES);
        onOpenChange(v);
      }}
    >
      <SheetContent className={VIE_SCOLAIRE_SHEET_AUTO}>
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-background shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
            Nouvelle salle
          </SheetTitle>
          <SheetDescription className="sr-only">
            Créer une salle de formation dans le référentiel.
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="border-b border-border px-5 py-4 shrink-0">
            <div className="flex items-center gap-2">
              <Theater className="size-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Référentiel des salles</p>
                <p className="text-xs text-muted-foreground">
                  Identifiez la salle, sa capacité et sa zone pour le planning des sessions.
                </p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <Form {...form}>
              <form
                id="salle-add-form"
                className="px-5 py-5 space-y-5"
                onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la salle</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex. Salle Alpha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="shortCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code court</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex. SAL-A" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="floorLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Étage / zone</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex. RDC — Bât. A" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacité</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="Ex. 20"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordre d&apos;affichage</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <FormLabel className="text-sm font-semibold">Salle active</FormLabel>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Une salle inactive n&apos;est plus proposée pour de nouvelles réservations.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="flex-row border-t p-5 gap-2 bg-background shrink-0">
          <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            className="ml-auto font-bold"
            type="submit"
            form="salle-add-form"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Créer la salle
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
