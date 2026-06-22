'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import type { LandingTeamOfferApiRow } from '@/lib/catalog-team-serialize';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FormValues = {
  catalogStatus: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  volet: 'formateur' | 'pedagogique' | 'rh' | 'direction';
  sortOrder: number;
  titleOverride: string;
  certificationsLabelOverride: string;
  bioOverride: string;
  statAOverride: string;
  statBOverride: string;
  ratingOverride: string;
  linkedinUrl: string;
  websiteUrl: string;
};

type Props = {
  member: LandingTeamOfferApiRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

function toForm(member: LandingTeamOfferApiRow): FormValues {
  return {
    catalogStatus:
      member.catalogStatus === 'ACTIVE' ||
      member.catalogStatus === 'DRAFT' ||
      member.catalogStatus === 'ARCHIVED'
        ? member.catalogStatus
        : 'DRAFT',
    volet: member.volet,
    sortOrder: member.sortOrder,
    titleOverride: member.titleOverride ?? '',
    certificationsLabelOverride: member.certificationsLabelOverride ?? '',
    bioOverride: member.bioOverride ?? '',
    statAOverride: String(member.statA),
    statBOverride: String(member.statB),
    ratingOverride: String(member.rating),
    linkedinUrl: member.linkedinUrl ?? '',
    websiteUrl: member.websiteUrl ?? '',
  };
}

export function LandingTeamEditSheet({ member, open, onOpenChange, onSaved }: Props) {
  const form = useForm<FormValues>();

  useEffect(() => {
    if (member && open) {
      form.reset(toForm(member));
    }
  }, [member, open, form]);

  async function onSubmit(values: FormValues) {
    if (!member) return;
    const body = {
      catalogStatus: values.catalogStatus,
      volet: values.volet,
      sortOrder: Number(values.sortOrder) || 0,
      titleOverride: values.titleOverride.trim() || null,
      certificationsLabelOverride: values.certificationsLabelOverride.trim() || null,
      bioOverride: values.bioOverride.trim() || null,
      statAOverride: values.statAOverride.trim() ? Number(values.statAOverride) : null,
      statBOverride: values.statBOverride.trim() ? Number(values.statBOverride) : null,
      ratingOverride: values.ratingOverride.trim() ? Number(values.ratingOverride) : null,
      linkedinUrl: values.linkedinUrl.trim() || null,
      websiteUrl: values.websiteUrl.trim() || null,
    };

    const res = await apiFetch(
      `/api/sections/communication-contenu/cms/landing-team/${encodeURIComponent(member.userId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(
        (json as { error?: { message?: string } }).error?.message ?? 'Enregistrement impossible',
      );
      return;
    }
    toast.success('Fiche équipe mise à jour');
    onSaved();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{member?.name ?? 'Membre équipe'}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4 overflow-y-auto py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Statut catalogue</Label>
              <Select
                value={form.watch('catalogStatus')}
                onValueChange={(v) =>
                  form.setValue('catalogStatus', v as FormValues['catalogStatus'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE — visible landing</SelectItem>
                  <SelectItem value="DRAFT">DRAFT — brouillon</SelectItem>
                  <SelectItem value="ARCHIVED">ARCHIVED — retiré</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Volet</Label>
              <Select
                value={form.watch('volet')}
                onValueChange={(v) => form.setValue('volet', v as FormValues['volet'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direction">Direction</SelectItem>
                  <SelectItem value="formateur">Formateurs</SelectItem>
                  <SelectItem value="pedagogique">Pédagogique</SelectItem>
                  <SelectItem value="rh">RH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ordre d&apos;affichage</Label>
            <Input type="number" {...form.register('sortOrder', { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label>Titre (override)</Label>
            <Input {...form.register('titleOverride')} placeholder={member?.title} />
          </div>
          <div className="space-y-2">
            <Label>Certifications (override)</Label>
            <Input {...form.register('certificationsLabelOverride')} />
          </div>
          <div className="space-y-2">
            <Label>Bio (override landing)</Label>
            <Textarea
              rows={4}
              {...form.register('bioOverride')}
              placeholder={member?.bio?.trim() || 'Texte issu de la fiche RH si vide'}
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour utiliser la présentation landing de la fiche formateur / collaborateur.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Stat A</Label>
              <Input {...form.register('statAOverride')} />
            </div>
            <div className="space-y-2">
              <Label>Stat B</Label>
              <Input {...form.register('statBOverride')} />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Input {...form.register('ratingOverride')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>LinkedIn</Label>
            <Input {...form.register('linkedinUrl')} placeholder="https://linkedin.com/in/..." />
          </div>
          <div className="space-y-2">
            <Label>Site web</Label>
            <Input {...form.register('websiteUrl')} placeholder="https://..." />
          </div>
        </SheetBody>
        <SheetFooter>
          <Button
            type="button"
            disabled={form.formState.isSubmitting}
            onClick={() => void form.handleSubmit(onSubmit)()}
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Enregistrer'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
