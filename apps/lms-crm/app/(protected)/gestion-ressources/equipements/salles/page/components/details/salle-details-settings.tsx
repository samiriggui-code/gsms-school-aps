'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill, RiRefreshLine } from '@remixicon/react';
import { CloudUpload, Hash, MapPin, Package, Theater } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getAvatarUrl, getInitials } from '@/lib/helpers';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SalleFormSchema, type SalleFormValues } from '../../forms/salle-form-schema';
import type { VenueRoomRow } from '../../types';

export function SalleDetailsSettings({
  room,
  formRef,
  onSuccess,
}: {
  room: VenueRoomRow;
  formRef?: React.RefObject<HTMLFormElement | null>;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState<string | null>(
    room.imageUrl ? getAvatarUrl(room.imageUrl) : null,
  );
  const [clearImage, setClearImage] = useState(false);

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

  const { setValue } = form;

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
    setImagePreview(room.imageUrl ? getAvatarUrl(room.imageUrl) : null);
    setClearImage(false);
  }, [room, form]);

  const mutation = useMutation({
    mutationFn: async (values: SalleFormValues) => {
      const capacity =
        values.capacity === '' || values.capacity === null || values.capacity === undefined
          ? null
          : Number(values.capacity);

      const hasFile = values.image instanceof File;
      if (hasFile || clearImage) {
        const formData = new FormData();
        formData.append('name', values.name.trim());
        formData.append('shortCode', values.shortCode?.trim() || '');
        formData.append('capacity', capacity === null ? '' : String(capacity));
        formData.append('floorLabel', values.floorLabel?.trim() || '');
        formData.append('isActive', String(room.isActive));
        formData.append('sortOrder', String(values.sortOrder ?? 0));
        if (clearImage) formData.append('clearImage', 'true');
        if (hasFile) formData.append('image', values.image as File);

        const res = await apiFetch(
          `/api/sections/gestion-ressources/equipements/salles/${room.id}`,
          { method: 'PATCH', body: formData },
        );
        if (!res.ok) {
          const j = await res.json();
          throw new Error(j?.error?.message || 'Mise à jour impossible');
        }
        return res.json();
      }

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
            isActive: room.isActive,
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
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-planning'] });
      void queryClient.invalidateQueries({ queryKey: ['salle-equipment-sessions', room.id] });
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
        className="space-y-8"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <section className="space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
              <CloudUpload className="size-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
              Photo de la salle
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-6 bg-muted/20 p-4 rounded-xl border border-dashed border-border/60">
            <div className="w-[140px] h-[140px] bg-background border border-border rounded-lg flex items-center justify-center overflow-hidden relative group">
              {imagePreview ? (
                <div className="relative w-full h-full group">
                  <img
                    src={imagePreview}
                    alt="Aperçu salle"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    type="button"
                    onClick={() => {
                      setValue('image', undefined);
                      setImagePreview(null);
                      setClearImage(true);
                    }}
                  >
                    <RiRefreshLine className="size-4" />
                  </Button>
                </div>
              ) : (
                <Avatar className="size-full rounded-none">
                  <AvatarFallback className="rounded-none bg-muted/20">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
                      <Theater className="size-12" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {getInitials(room.name)}
                      </span>
                    </div>
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            <div className="flex flex-col gap-3 grow pt-2">
              <p className="text-sm font-semibold text-foreground">Télécharger une nouvelle photo</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[300px]">
                Image utilisée dans la fiche salle et le référentiel (identification visuelle).
              </p>
              <div className="flex items-center gap-2 mt-2">
                <label
                  htmlFor="salle-image-upload"
                  className="flex items-center justify-center gap-2 px-4 h-9 rounded-md border border-border bg-background hover:bg-muted/50 transition-colors text-xs font-bold text-foreground cursor-pointer shadow-sm"
                >
                  <CloudUpload className="size-4" />
                  {imagePreview ? 'Changer' : 'Sélectionner'}
                </label>
                <input
                  type="file"
                  id="salle-image-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setValue('image', file);
                      setClearImage(false);
                      const reader = new FileReader();
                      reader.onload = (event) =>
                        setImagePreview(event.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {imagePreview ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    type="button"
                    onClick={() => {
                      setValue('image', undefined);
                      setImagePreview(room.imageUrl ? getAvatarUrl(room.imageUrl) : null);
                      setClearImage(false);
                    }}
                  >
                    Réinitialiser
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <Separator className="bg-border/50" />

        <section className="space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
              <Package className="size-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
              Informations
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-2sm font-semibold">Libellé</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-10 bg-secondary/50 border-border focus:bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shortCode"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-2sm font-semibold">Code court</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        className="h-10 pl-10 bg-secondary/50 border-border focus:bg-background"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="floorLabel"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-2sm font-semibold">Zone / étage</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        className="h-10 pl-10 bg-secondary/50 border-border focus:bg-background"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-2sm font-semibold">Capacité</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      value={field.value ?? ''}
                      className="h-10 bg-secondary/50 border-border focus:bg-background"
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
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-2sm font-semibold">Ordre d&apos;affichage</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      className="h-10 bg-secondary/50 border-border focus:bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>
      </form>
    </Form>
  );
}
