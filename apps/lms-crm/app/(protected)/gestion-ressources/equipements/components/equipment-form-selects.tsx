'use client';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import {
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
  EQUIPMENT_TYPE_LABELS,
  EQUIPMENT_TYPE_VALUES,
  PEDAGOGIC_DOMAIN_LABELS,
  PEDAGOGIC_DOMAIN_VALUES,
} from '@/lib/equipment-constants';
import type { ClientSiteOption } from '../hooks/use-client-sites';

type FieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  className?: string;
};

export function EquipmentTypeSelect<T extends FieldValues>({
  control,
  name,
  label = 'Catégorie technique',
  className,
}: FieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value || undefined}>
            <FormControl>
              <SelectTrigger className={className ?? 'h-11 shadow-sm'}>
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {EQUIPMENT_TYPE_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {EQUIPMENT_TYPE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function EquipmentPedagogicDomainSelect<T extends FieldValues>({
  control,
  name,
  label = 'Domaine pédagogique',
  className,
}: FieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">{label}</FormLabel>
          <Select onValueChange={field.onChange} value={(field.value as string) || undefined}>
            <FormControl>
              <SelectTrigger className={className ?? 'h-11 shadow-sm'}>
                <SelectValue placeholder="Choisir un domaine" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {PEDAGOGIC_DOMAIN_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {PEDAGOGIC_DOMAIN_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

type SiteSelectProps<T extends FieldValues> = FieldProps<T> & {
  sites: ClientSiteOption[];
  isLoading?: boolean;
  /** Si true, « siège » enregistre `null` (fiche unité). Sinon chaîne vide (ajout catalogue). */
  nullable?: boolean;
};

export function EquipmentSiteSelect<T extends FieldValues>({
  control,
  name,
  sites,
  isLoading,
  nullable = false,
  label = "Site d'affectation",
  className,
}: SiteSelectProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">{label}</FormLabel>
          <Select
            onValueChange={(v) => field.onChange(v === 'none' ? (nullable ? null : '') : v)}
            value={field.value ? String(field.value) : 'none'}
            disabled={isLoading}
          >
            <FormControl>
              <SelectTrigger className={className ?? 'h-11 shadow-sm'}>
                <SelectValue placeholder={isLoading ? 'Chargement…' : 'Stock global (siège)'} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="none">Stock global (siège)</SelectItem>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

type ComplianceFieldsProps<T extends FieldValues> = {
  control: Control<T>;
  /** Préfixe ex. `metadata` pour les champs imbriqués. */
  prefix?: string;
  inputClassName?: string;
};

function metaName(prefix: string | undefined, key: string) {
  return (prefix ? `${prefix}.${key}` : key) as FieldPath<FieldValues>;
}

export function EquipmentComplianceFields<T extends FieldValues>({
  control,
  prefix = 'metadata',
  inputClassName = 'h-11 shadow-sm',
}: ComplianceFieldsProps<T>) {
  const n = (key: string) => metaName(prefix, key) as FieldPath<T>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name={n('brand')}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Marque</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Zoll" {...field} value={(field.value as string) ?? ''} className={inputClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={n('model')}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Modèle</FormLabel>
              <FormControl>
                <Input placeholder="Ex: AED Plus" {...field} value={(field.value as string) ?? ''} className={inputClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={n('supplier')}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Fournisseur</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Matériel Pro Formation" {...field} value={(field.value as string) ?? ''} className={inputClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={n('regulatoryRef')}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Réf. réglementaire</FormLabel>
              <FormControl>
                <Input placeholder="Ex: NF S61-931" {...field} value={(field.value as string) ?? ''} className={inputClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name={n('purchaseDate')}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Date d&apos;achat</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={(field.value as string) ?? ''} className={inputClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={n('warrantyUntil')}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Fin de garantie</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={(field.value as string) ?? ''} className={inputClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={n('lastControlDate')}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Dernier contrôle</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={(field.value as string) ?? ''} className={inputClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={n('nextControlDate')}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Prochain contrôle</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={(field.value as string) ?? ''} className={inputClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name={n('notes')}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Notes</FormLabel>
            <FormControl>
              <Input placeholder="Remarques internes…" {...field} value={(field.value as string) ?? ''} className={inputClassName} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
