'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Equipment as Inventaire } from '@/app/models/equipment';
import {
  EquipmentMetadataSchema,
  normalizeEquipmentMetadata,
  type EquipmentMetadata,
} from '../../forms/equipment-metadata-schema';
import {
  EquipmentComplianceFields,
  EquipmentPedagogicDomainSelect,
} from '../../components/equipment-form-selects';
import { ShieldCheck, Info } from 'lucide-react';
import { getPedagogicDomainLabel } from '@/lib/equipment-constants';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ComplianceFormSchema = z.object({
  metadata: EquipmentMetadataSchema,
});

type ComplianceFormValues = z.infer<typeof ComplianceFormSchema>;

function formatMetaDate(value: string | undefined) {
  if (!value) return '—';
  try {
    return format(new Date(value), 'dd MMM yyyy', { locale: fr });
  } catch {
    return value;
  }
}

type InventaireDetailsComplianceProps = {
  inventaire: Inventaire;
  formRef?: React.RefObject<HTMLFormElement | null>;
  onSuccess?: () => void;
  isCatalogMode?: boolean;
  readOnly?: boolean;
};

export function InventaireDetailsCompliance({
  inventaire,
  formRef,
  onSuccess,
  isCatalogMode = false,
  readOnly = false,
}: InventaireDetailsComplianceProps) {
  const queryClient = useQueryClient();
  const meta = normalizeEquipmentMetadata(inventaire.metadata);

  const form = useForm<ComplianceFormValues>({
    resolver: zodResolver(ComplianceFormSchema),
    defaultValues: { metadata: meta },
    mode: 'onSubmit',
  });

  useEffect(() => {
    form.reset({ metadata: normalizeEquipmentMetadata(inventaire.metadata) });
  }, [inventaire.id, inventaire.metadata, form]);

  const mutation = useMutation({
    mutationFn: async (values: ComplianceFormValues) => {
      const formData = new FormData();
      formData.append('metadata', JSON.stringify(values.metadata));

      const response = await apiFetch(
        `/api/sections/gestion-ressources/equipements/inventaire/${inventaire.id}`,
        { method: 'PATCH', body: formData },
      );

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-inventaire'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', inventaire.id] });
      queryClient.invalidateQueries({ queryKey: ['equipment-catalog'] });
      onSuccess?.();
      toast.custom(() => (
        <Alert variant="mono" icon="success">
          <AlertIcon>
            <RiCheckboxCircleFill />
          </AlertIcon>
          <AlertTitle>Conformité enregistrée</AlertTitle>
        </Alert>
      ));
    },
    onError: (error: Error) => {
      toast.custom(() => (
        <Alert variant="mono" icon="destructive">
          <AlertIcon>
            <RiErrorWarningFill />
          </AlertIcon>
          <AlertTitle>{error.message}</AlertTitle>
        </Alert>
      ));
    },
  });

  if (readOnly) {
    return <ComplianceSummary meta={meta} />;
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0 space-y-6">
        {isCatalogMode && (
          <div className="flex gap-3 rounded-lg border border-border/60 bg-muted/20 p-4">
            <Info className="size-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ces informations de conformité sont enregistrées sur la pièce de référence de la catégorie (
              <span className="font-semibold text-foreground">{inventaire.serialNumber}</span>
              ). Elles servent de modèle pour l&apos;ensemble du catalogue.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
            <ShieldCheck className="size-4 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
            Conformité & réglementation
          </h3>
        </div>

        <Form {...form}>
          <form
            ref={formRef}
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-6"
          >
            <EquipmentPedagogicDomainSelect
              control={form.control}
              name="metadata.pedagogicDomain"
              label="Domaine pédagogique"
              className="h-11 bg-secondary/50 border-border max-w-md"
            />
            <EquipmentComplianceFields
              control={form.control}
              inputClassName="h-11 bg-secondary/50 border-border focus:bg-background transition-colors"
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function ComplianceSummary({ meta }: { meta: EquipmentMetadata }) {
  const rows = [
    { label: 'Domaine pédagogique', value: getPedagogicDomainLabel(meta.pedagogicDomain) },
    { label: 'Marque', value: meta.brand || '—' },
    { label: 'Modèle', value: meta.model || '—' },
    { label: 'Fournisseur', value: meta.supplier || '—' },
    { label: 'Réf. réglementaire', value: meta.regulatoryRef || '—' },
    { label: "Date d'achat", value: formatMetaDate(meta.purchaseDate) },
    { label: 'Fin de garantie', value: formatMetaDate(meta.warrantyUntil) },
    { label: 'Dernier contrôle', value: formatMetaDate(meta.lastControlDate) },
    { label: 'Prochain contrôle', value: formatMetaDate(meta.nextControlDate) },
    { label: 'Notes', value: meta.notes || '—' },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-col gap-1 rounded-lg border border-border/50 bg-muted/10 px-4 py-3"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {row.label}
          </span>
          <span className="text-sm font-semibold text-foreground">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
