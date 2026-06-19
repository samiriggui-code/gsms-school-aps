'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCompanyProfileSettings } from '../company-profile-context';
import { SettingsFormFooter } from '../settings-form-footer';
import { buildCompanyProfileDefaults } from '../../lib/company-profile-form-utils';
import { useTranslation } from '@/hooks/useTranslation';

const Schema = z.object({
  siret: z.string().optional(),
  siren: z.string().optional(),
  establishmentNic: z.string().optional(),
  cnaps: z.string().optional(),
  vatIntracommunityNumber: z.string().optional(),
  eoriNumber: z.string().optional(),
  nafApeCode: z.string().optional(),
  naf2025Code: z.string().optional(),
  legalFormDetailed: z.string().optional(),
  shareCapitalEuros: z.string().optional(),
  rcsRegistryCity: z.string().optional(),
});

type FormValues = z.infer<typeof Schema>;

export function LegalSettingsSection() {
  const { t } = useTranslation();
  const { profile, primaryAdminContact, saveProfile, isSaving, isLoading } =
    useCompanyProfileSettings();
  const base = buildCompanyProfileDefaults(profile, primaryAdminContact);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      siret: base.siret,
      siren: base.siren,
      establishmentNic: base.establishmentNic,
      cnaps: base.cnaps,
      vatIntracommunityNumber: base.vatIntracommunityNumber,
      eoriNumber: base.eoriNumber,
      nafApeCode: base.nafApeCode,
      naf2025Code: base.naf2025Code,
      legalFormDetailed: base.legalFormDetailed,
      shareCapitalEuros: base.shareCapitalEuros,
      rcsRegistryCity: base.rcsRegistryCity,
    },
  });

  useEffect(() => {
    const next = buildCompanyProfileDefaults(profile, primaryAdminContact);
    form.reset({
      siret: next.siret,
      siren: next.siren,
      establishmentNic: next.establishmentNic,
      cnaps: next.cnaps,
      vatIntracommunityNumber: next.vatIntracommunityNumber,
      eoriNumber: next.eoriNumber,
      nafApeCode: next.nafApeCode,
      naf2025Code: next.naf2025Code,
      legalFormDetailed: next.legalFormDetailed,
      shareCapitalEuros: next.shareCapitalEuros,
      rcsRegistryCity: next.rcsRegistryCity,
    });
  }, [profile, primaryAdminContact, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await saveProfile({ ...base, ...values });
      toast.success(t('pages.settings.legal.saveSuccess'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pages.settings.common.error'));
    }
  };

  if (isLoading) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="pb-2.5">
          <CardHeader>
            <CardTitle>{t('pages.settings.legal.title')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-2">
            <FormField control={form.control} name="siret" render={({ field }) => (
              <FormItem><FormLabel>{t('pages.settings.legal.siret')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="siren" render={({ field }) => (
              <FormItem><FormLabel>{t('pages.settings.legal.siren')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="establishmentNic" render={({ field }) => (
              <FormItem><FormLabel>{t('pages.settings.legal.establishmentNic')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="cnaps" render={({ field }) => (
              <FormItem><FormLabel>{t('pages.settings.legal.cnaps')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="vatIntracommunityNumber" render={({ field }) => (
              <FormItem><FormLabel>{t('pages.settings.legal.vatIntracommunityNumber')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="eoriNumber" render={({ field }) => (
              <FormItem><FormLabel>{t('pages.settings.legal.eoriNumber')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="nafApeCode" render={({ field }) => (
              <FormItem><FormLabel>{t('pages.settings.legal.nafApeCode')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="naf2025Code" render={({ field }) => (
              <FormItem><FormLabel>{t('pages.settings.legal.naf2025Code')}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="legalFormDetailed" render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>{t('pages.settings.legal.legalFormDetailed')}</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="shareCapitalEuros" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.settings.legal.shareCapitalEuros')}</FormLabel>
                <FormControl><Input inputMode="numeric" {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="rcsRegistryCity" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.settings.legal.rcsRegistryCity')}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
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

