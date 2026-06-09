'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/helpers';
import { useCompanyProfileSettings } from '../components/company-profile-context';
import { SettingsFormFooter } from '../components/settings-form-footer';
import { buildCompanyProfileDefaults } from '../lib/company-profile-form-utils';
import { SETTINGS_ANCHOR_IDS } from '../lib/settings-anchors';
import { useSettingsSubpageRedirect } from '../components/use-settings-subpage-redirect';
import { useTranslation } from '@/hooks/useTranslation';

const Schema = z.object({
  directorFullName: z.string().optional(),
  directorRole: z.string().optional(),
  directorEmail: z.string().optional(),
  directorPhone: z.string().optional(),
});

type FormValues = z.infer<typeof Schema>;

export function DirigeantSettingsSection() {
  const { t } = useTranslation();
  const { profile, primaryAdminContact, saveProfile, isSaving, isLoading } =
    useCompanyProfileSettings();
  const base = buildCompanyProfileDefaults(profile, primaryAdminContact);
  const avatarFileRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(base.directorAvatar || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const schema = useMemo(
    () =>
      Schema.extend({
        directorEmail: z
          .union([
            z.string().email(t('pages.settings.dirigeant.invalidEmail')),
            z.literal(''),
          ])
          .optional(),
      }),
    [t],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      directorFullName: base.directorFullName ?? undefined,
      directorRole: base.directorRole ?? undefined,
      directorEmail: base.directorEmail ?? undefined,
      directorPhone: base.directorPhone ?? undefined,
    },
  });

  useEffect(() => {
    const next = buildCompanyProfileDefaults(profile, primaryAdminContact);
    form.reset({
      directorFullName: next.directorFullName ?? undefined,
      directorRole: next.directorRole ?? undefined,
      directorEmail: next.directorEmail ?? undefined,
      directorPhone: next.directorPhone ?? undefined,
    });
    setAvatarPreview(next.directorAvatar || null);
    setAvatarFile(null);
  }, [profile, primaryAdminContact, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await saveProfile(
        {
          ...base,
          ...values,
          directorAvatarAction: avatarFile ? 'save' : undefined,
        },
        { directorAvatarFile: avatarFile },
      );
      toast.success(t('pages.settings.dirigeant.saveSuccess'));
      setAvatarFile(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pages.settings.common.error'));
    }
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="pb-2.5">
          <CardHeader>
            <CardTitle>{t('pages.settings.dirigeant.title')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="size-20 rounded-xl">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback className="rounded-xl">
                  {getInitials(form.watch('directorFullName') || 'D')}
                </AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" size="sm" onClick={() => avatarFileRef.current?.click()}>
                {t('pages.settings.dirigeant.changePhoto')}
              </Button>
              <input
                ref={avatarFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <FormField control={form.control} name="directorFullName" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.settings.dirigeant.fullName')}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="directorRole" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.settings.dirigeant.role')}</FormLabel>
                <FormControl><Input placeholder={t('pages.settings.dirigeant.rolePlaceholder')} {...field} /></FormControl>
              </FormItem>
            )} />
            <div className="grid gap-5 lg:grid-cols-2">
              <FormField control={form.control} name="directorEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.dirigeant.email')}</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="directorPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.settings.dirigeant.phone')}</FormLabel>
                  <FormControl><Input type="tel" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>
            <SettingsFormFooter
              onReset={() => form.reset()}
              isDirty={form.formState.isDirty || !!avatarFile}
              isSaving={isSaving}
            />
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}

export default function DirigeantSettingsPage() {
  useSettingsSubpageRedirect(SETTINGS_ANCHOR_IDS.dirigeant);
  return null;
}
