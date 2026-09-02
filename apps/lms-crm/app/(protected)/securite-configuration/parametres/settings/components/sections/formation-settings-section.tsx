'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@repo/ui/form';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import { useCompanyProfileSettings } from '../company-profile-context';
import { SettingsFormFooter } from '../settings-form-footer';
import { buildCompanyProfileDefaults } from '@/lib/company-profile';
import { useTranslation } from '@/hooks/useTranslation';

const Schema = z.object({
  ndaNumber: z.string().optional(),
  ndaSpecialty: z.string().optional(),
  ndaDeclarationDate: z.string().optional(),
  ndaRegion: z.string().optional(),
  ndaTrainingActions: z.string().optional(),
  qualiopiCertifications: z.string().optional(),
  agreementAdef: z.string().optional(),
  agreementQualianor: z.string().optional(),
  agreementQualiopiRef: z.string().optional(),
  agreementSsiap: z.string().optional(),
});

type FormValues = z.infer<typeof Schema>;

export function FormationSettingsSection() {
  const { t } = useTranslation();
  const { profile, primaryAdminContact, saveProfile, isSaving, isLoading } =
    useCompanyProfileSettings();
  const base = buildCompanyProfileDefaults(profile, primaryAdminContact);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      ndaNumber: base.ndaNumber,
      ndaSpecialty: base.ndaSpecialty,
      ndaDeclarationDate: base.ndaDeclarationDate,
      ndaRegion: base.ndaRegion,
      ndaTrainingActions: base.ndaTrainingActions,
      qualiopiCertifications: base.qualiopiCertifications,
      agreementAdef: base.agreementAdef,
      agreementQualianor: base.agreementQualianor,
      agreementQualiopiRef: base.agreementQualiopiRef,
      agreementSsiap: base.agreementSsiap,
    },
  });

  useEffect(() => {
    const next = buildCompanyProfileDefaults(profile, primaryAdminContact);
    form.reset({
      ndaNumber: next.ndaNumber,
      ndaSpecialty: next.ndaSpecialty,
      ndaDeclarationDate: next.ndaDeclarationDate,
      ndaRegion: next.ndaRegion,
      ndaTrainingActions: next.ndaTrainingActions,
      qualiopiCertifications: next.qualiopiCertifications,
      agreementAdef: next.agreementAdef,
      agreementQualianor: next.agreementQualianor,
      agreementQualiopiRef: next.agreementQualiopiRef,
      agreementSsiap: next.agreementSsiap,
    });
  }, [profile, primaryAdminContact, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await saveProfile({ ...base, ...values });
      toast.success(t('pages.settings.formation.saveSuccess'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pages.settings.common.error'));
    }
  };

  if (isLoading) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 lg:gap-7.5">
        <Card className="pb-2.5">
          <CardHeader>
            <CardTitle>{t('pages.settings.formation.ndaTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-2">
            <FormField control={form.control} name="ndaNumber" render={({ field }) => (
              <FormItem><FormLabel>{t('pages.settings.formation.ndaNumber')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="ndaDeclarationDate" render={({ field }) => (
              <FormItem><FormLabel>{t('pages.settings.formation.ndaDeclarationDate')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="ndaRegion" render={({ field }) => (
              <FormItem><FormLabel>{t('pages.settings.formation.ndaRegion')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="ndaSpecialty" render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>{t('pages.settings.formation.ndaSpecialty')}</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="ndaTrainingActions" render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>{t('pages.settings.formation.ndaTrainingActions')}</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card className="pb-2.5">
          <CardHeader>
            <CardTitle>{t('pages.settings.formation.qualiopiTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-2">
            <FormField control={form.control} name="qualiopiCertifications" render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>{t('pages.settings.formation.qualiopiCertifications')}</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="agreementQualiopiRef" render={({ field }) => (
              <FormItem><FormLabel>{t('pages.settings.formation.agreementQualiopiRef')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="agreementAdef" render={({ field }) => (
              <FormItem><FormLabel>{t('pages.settings.formation.agreementAdef')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="agreementQualianor" render={({ field }) => (
              <FormItem><FormLabel>{t('pages.settings.formation.agreementQualianor')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="agreementSsiap" render={({ field }) => (
              <FormItem><FormLabel>{t('pages.settings.formation.agreementSsiap')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <div className="lg:col-span-2">
              <SettingsFormFooter
                onReset={() => form.reset()}
                isDirty={form.formState.isDirty}
                isSaving={isSaving}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}

