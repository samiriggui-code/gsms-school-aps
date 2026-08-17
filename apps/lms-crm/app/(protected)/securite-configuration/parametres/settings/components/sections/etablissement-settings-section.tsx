'use client';

import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
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
import { useTranslation } from '@/hooks/useTranslation';
import { useCompanyProfileSettings } from '../company-profile-context';
import { SettingsFormFooter } from '../settings-form-footer';
import { buildCompanyProfileDefaults, type CompanyProfileSchemaType } from '@/lib/company-profile';

type FormValues = {
  companyName: string;
  industry?: string;
  companyType?: string;
  companySize?: string;
  companyRegion?: string;
  companyAddress?: string;
  companyCity?: string;
  companyPostalCode?: string;
  companyCountry: string;
  website?: string;
  directorEmail?: string;
  directorPhone?: string;
};

function pickEtablissementFormValues(src: CompanyProfileSchemaType): FormValues {
  return {
    companyName: src.companyName,
    industry: src.industry ?? undefined,
    companyType: src.companyType ?? undefined,
    companySize: src.companySize ?? undefined,
    companyRegion: src.companyRegion ?? undefined,
    companyAddress: src.companyAddress ?? undefined,
    companyCity: src.companyCity ?? undefined,
    companyPostalCode: src.companyPostalCode ?? undefined,
    companyCountry: src.companyCountry,
    website: src.website ?? undefined,
    directorEmail: src.directorEmail ?? undefined,
    directorPhone: src.directorPhone ?? undefined,
  };
}

export function EtablissementSettingsSection() {
  const { t } = useTranslation();
  const { profile, primaryAdminContact, saveProfile, isSaving, isLoading } =
    useCompanyProfileSettings();

  const base = buildCompanyProfileDefaults(profile, primaryAdminContact);

  const schema = useMemo(
    () =>
      z.object({
        companyName: z
          .string()
          .min(2, t('pages.settings.etablissement.validation.companyNameRequired')),
        industry: z.string().optional(),
        companyType: z.string().optional(),
        companySize: z.string().optional(),
        companyRegion: z.string().optional(),
        companyAddress: z.string().optional(),
        companyCity: z.string().optional(),
        companyPostalCode: z.string().optional(),
        companyCountry: z.string().min(1),
        website: z
          .union([
            z.string().url(t('pages.settings.etablissement.validation.invalidUrl')),
            z.literal(''),
          ])
          .optional(),
        directorEmail: z
          .union([
            z.string().email(t('pages.settings.etablissement.validation.invalidEmail')),
            z.literal(''),
          ])
          .optional(),
        directorPhone: z.string().optional(),
      }),
    [t],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: pickEtablissementFormValues(base),
  });

  useEffect(() => {
    form.reset(pickEtablissementFormValues(buildCompanyProfileDefaults(profile, primaryAdminContact)));
  }, [profile, primaryAdminContact, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await saveProfile({ ...base, ...values });
      toast.success(t('pages.settings.etablissement.saveSuccess'));
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
            <CardTitle>{t('pages.settings.etablissement.identityTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-2">
            <FormField control={form.control} name="companyName" render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>{t('pages.settings.etablissement.companyName')}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="industry" render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>{t('pages.settings.etablissement.industry')}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="companyType" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.settings.etablissement.companyType')}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="companySize" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.settings.etablissement.companySize')}</FormLabel>
                <FormControl><Input placeholder={t('pages.settings.etablissement.companySizePlaceholder')} {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="companyRegion" render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>{t('pages.settings.etablissement.companyRegion')}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card className="pb-2.5">
          <CardHeader>
            <CardTitle>{t('pages.settings.etablissement.contactTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <FormField control={form.control} name="companyAddress" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.settings.etablissement.address')}</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
              </FormItem>
            )} />
            <div className="grid gap-5 lg:grid-cols-3">
              <FormField control={form.control} name="companyPostalCode" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.etablissement.postalCode')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="companyCity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.etablissement.city')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="companyCountry" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.etablissement.country')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="website" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.settings.etablissement.website')}</FormLabel>
                <FormControl><Input type="url" placeholder="https://" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid gap-5 lg:grid-cols-2">
              <FormField control={form.control} name="directorEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.etablissement.supportEmail')}</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="directorPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.etablissement.supportPhone')}</FormLabel>
                  <FormControl><Input type="tel" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>
            <SettingsFormFooter
              onReset={() => form.reset()}
              isDirty={form.formState.isDirty}
              isSaving={isSaving}
            />
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
