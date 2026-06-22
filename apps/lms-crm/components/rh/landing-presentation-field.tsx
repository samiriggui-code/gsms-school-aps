'use client';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Globe } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
};

export function LandingPresentationField<T extends FieldValues>({ control, name }: Props<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-indigo-500" aria-hidden />
            <FormLabel className="text-2sm font-semibold text-foreground">
              Présentation landing
            </FormLabel>
          </div>
          <FormDescription className="text-xs leading-relaxed">
            Texte affiché sur la section <strong>#trainers</strong> du site (expérience, parcours,
            expertises). Prioritaire sur la fiche équipe landing sauf override « Bio » explicite.
          </FormDescription>
          <FormControl>
            <Textarea
              {...field}
              value={field.value ?? ''}
              rows={5}
              maxLength={2000}
              placeholder="Ex. : 15 ans d'expérience en sécurité incendie, formateur SSIAP 1–3, intervenant sur ERP et IGH…"
              className="resize-y min-h-[120px] bg-secondary/50 border-border focus:bg-background transition-colors"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
