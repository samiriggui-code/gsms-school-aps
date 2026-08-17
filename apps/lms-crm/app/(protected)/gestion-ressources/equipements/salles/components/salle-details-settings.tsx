'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { apiFetch } from '@/lib/api';
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
import { Package } from 'lucide-react';
import { SalleFormSchema, type SalleFormValues } from '../forms/salle-form-schema';
import type { VenueRoomRow } from '../types';

export function SalleDetailsSettings({
  room,
  formRef,
  onSuccess,
  onOpenFixedInventory,
}: {
  room: VenueRoomRow;
  formRef?: React.RefObject<HTMLFormElement | null>;
  onSuccess?: () => void;
  onOpenFixedInventory?: () => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<SalleFormValues>({
    resolver: zodResolver(SalleFormSchema),
    defaultValues: {
      name: room.name,
      shortCode: room.shortCode ?? '',
      capacity: room.capacity ?? '',
      floorLabel: room.floorLabel ?? '',
      imageUrl: room.imageUrl ?? '',
      isActive: room.isActive,
      sortOrder: room.sortOrder,
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    form.reset({
      name: room.name,
      shortCode: room.shortCode ?? '',
      capacity: room.capacity ?? '',
      floorLabel: room.floorLabel ?? '',
      imageUrl: room.imageUrl ?? '',
      isActive: room.isActive,
      sortOrder: room.sortOrder,
    });
  }, [room, form]);

  const mutation = useMutation({
    mutationFn: async (values: SalleFormValues) => {
      const capacity =
        values.capacity === '' || values.capacity === null || values.capacity === undefined
          ? null
          : Number(values.capacity);
      const res = await apiFetch(
        `/api/sections/gestion-ressources/equipements/salles/${room.id}`,
        {
          method: 'PATCH',
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
        },
      );
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.error?.message || 'Mise à jour impossible');
      }
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-list'] });
      void queryClient.invalidateQueries({ queryKey: ['venue-room-detail', room.id] });
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-planning'] });
      void queryClient.invalidateQueries({ queryKey: ['room-dispatch-guide', room.id] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Salle mise à jour</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
      onSuccess?.();
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
    <Form {...form}>
      <form
        ref={formRef}
        className="space-y-5"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-2">
          <p className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Package className="size-4 text-primary" />
            Mobilier fixe de la salle
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Renseignez d&apos;abord la <strong>capacité</strong> ci-dessous, puis liez les unités depuis le stock
            global dans l&apos;onglet <strong>Inventaire fixe</strong>. L&apos;assistant recommande chaises, tables et
            équipements selon le profil de la salle.
          </p>
          {onOpenFixedInventory ? (
            <button
              type="button"
              onClick={onOpenFixedInventory}
              className="text-xs font-bold text-primary hover:underline"
            >
              Ouvrir l&apos;inventaire fixe →
            </button>
          ) : null}
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la salle</FormLabel>
              <FormControl>
                <Input {...field} />
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
                  <Input {...field} value={field.value ?? ''} />
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
                  <Input {...field} value={field.value ?? ''} />
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
                  <Input type="number" min={0} {...field} value={field.value ?? ''} />
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
                  Désactiver la salle si elle n&apos;est plus réservable.
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
  );
}
