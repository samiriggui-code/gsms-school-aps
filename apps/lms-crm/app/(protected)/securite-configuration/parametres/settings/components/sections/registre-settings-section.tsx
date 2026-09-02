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
  mainActivityDescription: z.string().optional(),
  companyCreationDate: z.string().optional(),
  establishmentCreationDate: z.string().optional(),
  inseeRegistrationDate: z.string().optional(),
  rneExtractDate: z.string().optional(),
  employeeSituationNote: z.string().optional(),
  companySizeCategoryNote: z.string().optional(),
  collectiveAgreementNote: z.string().optional(),
  inpiCompanySummary: z.string().optional(),
});

type FormValues = z.infer<typeof Schema>;

export function RegistreSettingsSection() {
  const { t } = useTranslation();
  const { profile, primaryAdminContact, saveProfile, isSaving, isLoading } =
    useCompanyProfileSettings();
  const base = buildCompanyProfileDefaults(profile, primaryAdminContact);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      mainActivityDescription: base.mainActivityDescription,
      companyCreationDate: base.companyCreationDate,
      establishmentCreationDate: base.establishmentCreationDate,
      inseeRegistrationDate: base.inseeRegistrationDate,
      rneExtractDate: base.rneExtractDate,
      employeeSituationNote: base.employeeSituationNote,
      companySizeCategoryNote: base.companySizeCategoryNote,
      collectiveAgreementNote: base.collectiveAgreementNote,
      inpiCompanySummary: base.inpiCompanySummary,
    },
  });

  useEffect(() => {
    const next = buildCompanyProfileDefaults(profile, primaryAdminContact);
    form.reset({
      mainActivityDescription: next.mainActivityDescription,
      companyCreationDate: next.companyCreationDate,
      establishmentCreationDate: next.establishmentCreationDate,
      inseeRegistrationDate: next.inseeRegistrationDate,
      rneExtractDate: next.rneExtractDate,
      employeeSituationNote: next.employeeSituationNote,
      companySizeCategoryNote: next.companySizeCategoryNote,
      collectiveAgreementNote: next.collectiveAgreementNote,
      inpiCompanySummary: next.inpiCompanySummary,
    });
  }, [profile, primaryAdminContact, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await saveProfile({ ...base, ...values });
      toast.success(t('pages.settings.registre.saveSuccess'));
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
            <CardTitle>{t('pages.settings.registre.title')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <FormField control={form.control} name="mainActivityDescription" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.settings.registre.mainActivityDescription')}</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
              </FormItem>
            )} />
            <div className="grid gap-5 lg:grid-cols-2">
              <FormField control={form.control} name="companyCreationDate" render={({ field }) => (
                <FormItem><FormLabel>{t('pages.settings.registre.companyCreationDate')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="establishmentCreationDate" render={({ field }) => (
                <FormItem><FormLabel>{t('pages.settings.registre.establishmentCreationDate')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="inseeRegistrationDate" render={({ field }) => (
                <FormItem><FormLabel>{t('pages.settings.registre.inseeRegistrationDate')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="rneExtractDate" render={({ field }) => (
                <FormItem><FormLabel>{t('pages.settings.registre.rneExtractDate')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="employeeSituationNote" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.settings.registre.employeeSituationNote')}</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="companySizeCategoryNote" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.settings.registre.companySizeCategoryNote')}</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="collectiveAgreementNote" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.settings.registre.collectiveAgreementNote')}</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="inpiCompanySummary" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.settings.registre.inpiCompanySummary')}</FormLabel>
                <FormControl><Textarea rows={4} {...field} /></FormControl>
              </FormItem>
            )} />
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

