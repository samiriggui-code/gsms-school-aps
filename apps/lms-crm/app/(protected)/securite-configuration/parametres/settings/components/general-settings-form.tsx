'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ControllerRenderProps, FieldErrors, useForm } from 'react-hook-form';
import { LoaderCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from './settings-context';
import TimezoneSelect from './timezone-select';
import { I18N_LANGUAGES } from '@/i18n/config';
import { useTranslation } from '@/hooks/useTranslation';
import {
  GeneralSettingsSchema,
  GeneralSettingsSchemaType,
} from '../forms/general-settings-schema';

export function GeneralSettingsForm() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const queryClient = useQueryClient();
  const [logoExistingPreview, setLogoExistingPreview] = useState<string | null>(
    '',
  );
  const [logoAttachedPreview, setLogoAttachedPreview] = useState<string | null>(
    '',
  );
  const logoFileRef = useRef<HTMLInputElement | null>(null);

  const transformedSettings: GeneralSettingsSchemaType = {
    ...settings,
    logoFile: null,
    logoAction: '',
    name: settings?.name || '',
    active: settings?.active ?? true,
    address: settings?.address || '',
    websiteURL: settings?.websiteURL || '',
    language: settings?.language || 'fr',
    supportEmail: settings?.supportEmail || '',
    supportPhone: settings?.supportPhone || '',
    currency: settings?.currency || 'EUR',
    currencyFormat: settings?.currencyFormat || '{value} €',
    timezone: settings?.timezone || 'Europe/Paris',
  };

  useEffect(() => {
    if (settings?.logo) {
      setLogoExistingPreview(settings.logo);
      setLogoAttachedPreview(null);
    }
  }, [settings]);

  const form = useForm<GeneralSettingsSchemaType>({
    resolver: zodResolver(GeneralSettingsSchema),
    defaultValues: transformedSettings,
    mode: 'onSubmit',
  });

  const mutation = useMutation({
    mutationFn: async (values: GeneralSettingsSchemaType) => {
      const formData = new FormData();

      Object.keys(values).forEach((key) => {
        if (key === 'logoFile' && values.logoFile instanceof File) {
          formData.append('logoFile', values.logoFile);
        } else if (key !== 'logoFile') {
          formData.append(
            key,
            values[key as keyof GeneralSettingsSchemaType] as string,
          );
        }
      });

      const response = await apiFetch(
        '/api/sections/securite-configuration/parametres/settings/general',
        {
          method: 'POST',
          body: formData,
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
            <AlertTitle>{t('pages.settings.general.saveSuccess')}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: (error: Error) => {
      toast.custom(
        (toastId) => (
          <Alert
            variant="mono"
            icon="destructive"
            close={true}
            onClose={() => toast.dismiss(toastId)}
          >
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

  const handleRemoveLogo = () => {
    setLogoExistingPreview(null);
    form.trigger('logoFile');
    form.setValue('logoFile', null);
    form.setValue('logoAction', 'remove', { shouldDirty: true });
  };

  const handleCancelLogo = () => {
    setLogoAttachedPreview(null);
    if (settings.logo) {
      setLogoExistingPreview(settings.logo);
    }
    form.setValue('logoFile', null);
    form.setValue('logoAction', '', { shouldDirty: true });
  };

  const handleChangeLogo = (
    e: ChangeEvent<HTMLInputElement>,
    field: ControllerRenderProps<GeneralSettingsSchemaType, 'logoFile'>,
  ) => {
    const file = e.target.files?.[0] || null;
    field.onChange(file);
    form.trigger('logoFile');
    form.setValue('logoFile', file);
    form.setValue('logoAction', 'save', { shouldDirty: true });

    if (file) {
      const reader = new FileReader();
      reader.onload = () => setLogoAttachedPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoAttachedPreview(null);
    }
  };

  const handleFormReset = () => {
    form.reset(transformedSettings);
    if (settings?.logo) {
      setLogoExistingPreview(settings.logo);
    } else {
      setLogoExistingPreview(null);
    }
    setLogoAttachedPreview(null);
  };

  const handleSubmit = (values: GeneralSettingsSchemaType) => {
    mutation.mutate(values);
  };

  const handleError = (errors: FieldErrors<GeneralSettingsSchemaType>) => {
    const keys = Object.keys(errors) as (keyof GeneralSettingsSchemaType)[];
    const firstErrorKey = keys[0];
    const firstErrorMessage = errors[firstErrorKey]?.message;

    if (firstErrorMessage) {
      toast.custom(
        (toastId) => (
          <Alert
            variant="mono"
            icon="destructive"
            close={true}
            onClose={() => toast.dismiss(toastId)}
          >
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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit, handleError)}
        className="flex flex-col gap-5 lg:gap-7.5"
      >
        <Card className="pb-2.5">
          <CardHeader id="basic_settings">
            <CardTitle>{t('pages.settings.general.basicTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <FormField
              control={form.control}
              name="logoFile"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Label className="flex w-full max-w-56">{t('pages.settings.general.logo')}</Label>
                    <div className="flex grow flex-wrap items-center justify-between gap-2.5">
                      <div className="relative size-16 overflow-hidden rounded-lg border">
                        <img
                          src={
                            logoAttachedPreview ||
                            logoExistingPreview ||
                            '/media/ui/empty-image.svg'
                          }
                          alt="Logo"
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => logoFileRef.current?.click()}
                          >
                            {t('pages.settings.general.chooseImage')}
                          </Button>
                          {(logoAttachedPreview ||
                            (!logoAttachedPreview &&
                              !logoExistingPreview &&
                              settings?.logo)) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCancelLogo}
                            >
                              {t('common.buttons.cancel')}
                            </Button>
                          )}
                          {settings?.logo &&
                            logoExistingPreview &&
                            !logoAttachedPreview && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRemoveLogo}
                              >
                                {t('common.buttons.delete')}
                              </Button>
                            )}
                        </div>
                        <span className="text-sm text-secondary-foreground">
                          {t('pages.settings.general.logoHint')}
                        </span>
                        <input
                          ref={logoFileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleChangeLogo(e, field)}
                        />
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-wrap items-baseline gap-2.5 lg:flex-nowrap">
                    <Label className="flex w-full max-w-56 items-center">
                      {t('pages.settings.general.establishmentName')}
                    </Label>
                    <FormControl>
                      <Input
                        placeholder={t('pages.settings.general.establishmentNamePlaceholder')}
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Label className="flex w-full max-w-56">
                      {t('pages.settings.general.platformStatus')}
                    </Label>
                    <div className="flex grow items-center gap-2">
                      <Label htmlFor="active" className="text-sm font-normal">
                        {t('pages.settings.general.platformActive')}
                      </Label>
                      <Switch
                        id="active"
                        size="sm"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="pb-2.5">
          <CardHeader id="regional_settings">
            <CardTitle>{t('pages.settings.general.regionalTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 lg:py-7.5">
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Label className="flex w-full max-w-56">{t('pages.settings.general.language')}</Label>
                    <div className="grow">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('pages.settings.general.chooseLanguage')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {I18N_LANGUAGES.map((language) => (
                              <SelectItem
                                key={language.code}
                                value={language.code}
                              >
                                <span className="flex w-full items-center gap-2.5">
                                  <img
                                    src={language.flag}
                                    alt=""
                                    className="size-4 rounded-full"
                                  />
                                  {language.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Label className="flex w-full max-w-56">{t('pages.settings.general.currency')}</Label>
                    <div className="grow">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('pages.settings.general.chooseCurrency')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="EUR">{t('pages.settings.general.currencies.EUR')}</SelectItem>
                            <SelectItem value="USD">{t('pages.settings.general.currencies.USD')}</SelectItem>
                            <SelectItem value="GBP">{t('pages.settings.general.currencies.GBP')}</SelectItem>
                            <SelectItem value="CHF">{t('pages.settings.general.currencies.CHF')}</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <FormDescription>
                    {t('pages.settings.general.currencyHint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currencyFormat"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Label className="flex w-full max-w-56">
                      {t('pages.settings.general.currencyFormat')}
                    </Label>
                    <div className="grow">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('pages.settings.general.chooseFormat')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="{value} €">
                              {`{value}`} €
                            </SelectItem>
                            <SelectItem value="$ {value}">
                              $ {`{value}`}
                            </SelectItem>
                            <SelectItem value="£ {value}">
                              £ {`{value}`}
                            </SelectItem>
                            <SelectItem value="CHF {value}">
                              CHF {`{value}`}
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Label className="flex w-full max-w-56">{t('pages.settings.general.timezone')}</Label>
                    <div className="grow">
                      <FormControl>
                        <TimezoneSelect
                          defaultValue={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2.5 pt-2.5">
              <Button type="button" variant="outline" onClick={handleFormReset}>
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
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
