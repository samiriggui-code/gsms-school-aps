'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FieldErrors, useForm } from 'react-hook-form';
import { LoaderCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@repo/ui/alert';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@repo/ui/form';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { useSettings } from '../settings-context';
import {
  SocialSettingsSchema,
  SocialSettingsSchemaType,
} from '../../forms/social-settings-schema';
import { useTranslation } from '@/hooks/useTranslation';

const socialFields: {
  name: keyof SocialSettingsSchemaType;
  label: string;
  placeholder: string;
}[] = [
  {
    name: 'socialFacebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/…',
  },
  {
    name: 'socialTwitter',
    label: 'X (Twitter)',
    placeholder: 'https://x.com/…',
  },
  {
    name: 'socialInstagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/…',
  },
  {
    name: 'socialLinkedIn',
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/…',
  },
  {
    name: 'socialPinterest',
    label: 'Pinterest',
    placeholder: 'https://pinterest.com/…',
  },
  {
    name: 'socialYoutube',
    label: 'YouTube',
    placeholder: 'https://youtube.com/…',
  },
];

export function SocialSettingsSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { settings } = useSettings();

  const form = useForm<SocialSettingsSchemaType>({
    resolver: zodResolver(SocialSettingsSchema),
    defaultValues: {
      socialFacebook: settings.socialFacebook || '',
      socialTwitter: settings.socialTwitter || '',
      socialInstagram: settings.socialInstagram || '',
      socialLinkedIn: settings.socialLinkedIn || '',
      socialPinterest: settings.socialPinterest || '',
      socialYoutube: settings.socialYoutube || '',
    },
    mode: 'onSubmit',
  });

  const mutation = useMutation({
    mutationFn: async (values: SocialSettingsSchemaType) => {
      const response = await apiFetch(
        '/api/sections/securite-configuration/parametres/settings/social',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{t('pages.settings.social.saveSuccess')}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: (error: Error) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive">
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{error.message}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
    },
  });

  const isProcessing = mutation.status === 'pending';

  const handleSubmit = (values: SocialSettingsSchemaType) => {
    mutation.mutate(values);
  };

  const handleError = (errors: FieldErrors<SocialSettingsSchemaType>) => {
    const keys = Object.keys(errors) as (keyof SocialSettingsSchemaType)[];
    if (keys.length > 0) {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive">
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>
              {t('pages.settings.common.formErrors')}
            </AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
    }
  };

  return (
    <Card className="pb-2.5">
      <CardHeader>
        <CardTitle>{t('pages.settings.social.title')}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 lg:py-7.5">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit, handleError)}
            className="grid gap-5"
          >
            {socialFields.map(({ name, label, placeholder }) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-wrap items-baseline gap-2.5 lg:flex-nowrap">
                      <Label className="flex w-full max-w-56">{label}</Label>
                      <FormControl>
                        <Input placeholder={placeholder} {...field} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <div className="flex justify-end gap-2.5 pt-2.5">
              <Button
                type="reset"
                variant="outline"
                onClick={() => form.reset()}
              >
                {t('pages.settings.common.reset')}
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isDirty || isProcessing}
              >
                {isProcessing && (
                  <LoaderCircleIcon className="animate-spin" />
                )}
                {t('pages.settings.common.save')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

