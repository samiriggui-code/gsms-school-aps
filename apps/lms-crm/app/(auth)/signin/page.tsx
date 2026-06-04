'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiErrorWarningFill } from '@remixicon/react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { getSigninSchema, SigninSchemaType } from '../forms/signin-schema';

const DEV_ACCOUNTS = [
  { label: 'Super Admin (Samir)', email: 'samir.iggui@ecole.local', password: 'demo1234' },
  { label: 'Admin', email: 'john.doe@ecole.local', password: 'demo1234' },
  { label: 'Collaborateur', email: 'michael.brown@ecole.local', password: 'demo1234' },
  { label: 'Formateur', email: 'david.miller@ecole.local', password: 'demo1234' },
] as const;

export default function Page() {
  const { t } = useTranslation();
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SigninSchemaType>({
    resolver: zodResolver(
      getSigninSchema({
        emailRequired: t('auth.validation.emailRequired'),
        emailInvalid: t('auth.validation.emailInvalid'),
        passwordRequired: t('auth.validation.passwordRequired'),
        passwordMin: t('auth.validation.passwordMin'),
      }),
    ),
    defaultValues: {
      email: 'samir.iggui@ecole.local',
      password: 'demo1234',
      rememberMe: false,
    },
  });

  async function onSubmit(values: SigninSchemaType) {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      });

      if (response?.error) {
        const errorData = JSON.parse(response.error);
        setError(errorData.message);
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('auth.unexpectedError'),
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function prefillAccount(email: string, password: string) {
    form.setValue('email', email, { shouldValidate: true, shouldDirty: true });
    form.setValue('password', password, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="block w-full space-y-5"
      >
        <div className="space-y-1.5 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight text-center">
            {t('auth.signInTitle')}
          </h1>
        </div>

        <Alert size="sm" close={false}>
          <AlertIcon>
            <RiErrorWarningFill className="text-primary" />
          </AlertIcon>
          <AlertTitle className="text-accent-foreground">{t('auth.devAlert')}</AlertTitle>
        </Alert>

        <div className="rounded-md border p-3 text-sm">
          <p className="font-semibold mb-2">{t('auth.devAccountsTitle')}</p>
          <p className="text-muted-foreground mb-3">{t('auth.devAccountsHint')}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {DEV_ACCOUNTS.map((account) => (
              <Button
                key={account.email}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => prefillAccount(account.email, account.password)}
              >
                {account.label}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.email')}</FormLabel>
              <FormControl>
                <Input placeholder={t('auth.emailPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center gap-2.5">
                <FormLabel>{t('auth.password')}</FormLabel>
                <Link
                  href="/reset-password"
                  className="text-sm font-semibold text-foreground hover:text-primary"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Input
                  placeholder={t('auth.passwordPlaceholder')}
                  type={passwordVisible ? 'text' : 'password'}
                  {...field}
                />
                <Button
                  type="button"
                  variant="ghost"
                  mode="icon"
                  size="sm"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute end-0 top-1/2 -translate-y-1/2 h-7 w-7 me-1.5 bg-transparent!"
                  aria-label={
                    passwordVisible ? t('auth.hidePassword') : t('auth.showPassword')
                  }
                >
                  {passwordVisible ? (
                    <EyeOff className="text-muted-foreground" />
                  ) : (
                    <Eye className="text-muted-foreground" />
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center space-x-2">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <>
                <Checkbox
                  id="remember-me"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(!!checked)}
                />
                <label
                  htmlFor="remember-me"
                  className="text-sm leading-none text-muted-foreground"
                >
                  {t('auth.rememberMe')}
                </label>
              </>
            )}
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
            {t('auth.signIn')}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">{t('auth.signupDisabled')}</p>
      </form>
    </Form>
  );
}
