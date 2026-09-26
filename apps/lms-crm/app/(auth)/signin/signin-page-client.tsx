'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiErrorWarningFill } from '@remixicon/react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { fetchSessionRoleSlug, resolvePostLoginDestination } from '@/lib/auth/app-routing';
import { useForm } from 'react-hook-form';
import { Alert, AlertIcon, AlertTitle } from '@repo/ui/alert';
import { Button } from '@repo/ui/button';
import { Checkbox } from '@repo/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/form';
import { Input } from '@repo/ui/input';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { getSigninSchema, SigninSchemaType } from '../forms/signin-schema';
import { AccountAccessBlockedShell } from '@/components/auth/account-access-blocked-dialog';
import type { AccountBlockReason } from '@/lib/auth/account-access';

// Comptes de démo — jamais exposés en production. Contrôlé par NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS,
// qui ne doit être défini à "1" que dans les environnements de dev/staging (jamais dans deploy/gsms/.env prod).
const SHOW_DEMO_ACCOUNTS =
  process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === '1' && process.env.NODE_ENV !== 'production';

const DEV_ACCOUNTS = SHOW_DEMO_ACCOUNTS
  ? ([
      { label: 'Super Admin (Samir)', email: 'samir.iggui@ecole.local', password: 'demo1234' },
      { label: 'Admin', email: 'john.doe@ecole.local', password: 'demo1234' },
      { label: 'Collaborateur', email: 'michael.brown@ecole.local', password: 'demo1234' },
      { label: 'Formateur', email: 'david.miller@ecole.local', password: 'demo1234' },
      { label: 'Stagiaire', email: 'stagiaire.dev.1@ecole.local', password: 'demo1234' },
    ] as const)
  : ([] as const);

const VALID_BLOCK_REASONS = new Set<AccountBlockReason>([
  'pending',
  'inactive',
  'blocked',
  'banned',
  'archived',
]);

function parseBlockReason(raw: string | null): AccountBlockReason | null {
  if (!raw || !VALID_BLOCK_REASONS.has(raw as AccountBlockReason)) return null;
  return raw as AccountBlockReason;
}

export default function SigninPageClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedReason, setBlockedReason] = useState<AccountBlockReason | null>(null);

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
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  function prefillAccount(email: string, password: string) {
    form.setValue('email', email, { shouldValidate: true, shouldDirty: true });
    form.setValue('password', password, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromLogout = parseBlockReason(params.get('accountBlocked'));
    if (fromLogout) {
      setBlockedReason(fromLogout);
    }
    if (SHOW_DEMO_ACCOUNTS) {
      const intent = params.get('intent');
      if (intent === 'stagiaire') {
        prefillAccount('stagiaire.dev.1@ecole.local', 'demo1234');
      } else if (intent === 'admin') {
        prefillAccount('samir.iggui@ecole.local', 'demo1234');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intent URL uniquement au montage
  }, []);

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
        try {
          const errorData = JSON.parse(response.error) as {
            code?: string;
            reason?: string;
            message?: string;
          };
          if (errorData.code === 'ACCOUNT_DEACTIVATED') {
            const reason = parseBlockReason(errorData.reason ?? null) ?? 'inactive';
            setBlockedReason(reason);
            return;
          }
          setError(errorData.message ?? t('auth.unexpectedError'));
        } catch {
          setError(response.error);
        }
      } else {
        const roleSlug = await fetchSessionRoleSlug();
        const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
        router.push(resolvePostLoginDestination(roleSlug, callbackUrl));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.unexpectedError'));
    } finally {
      setIsProcessing(false);
    }
  }

  const handleBlockedAcknowledge = () => {
    setBlockedReason(null);
    router.replace('/signin');
  };

  return (
    <AccountAccessBlockedShell
      blocked={blockedReason !== null}
      reason={blockedReason ?? 'inactive'}
      onAcknowledge={handleBlockedAcknowledge}
    >
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="block w-full space-y-5">
        <div className="space-y-1.5 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight text-center">
            {t('auth.signInTitle')}
          </h1>
        </div>

        {SHOW_DEMO_ACCOUNTS && (
          <>
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
              <p className="text-xs text-muted-foreground">
                Connexion : e-mail professionnel <span className="font-mono text-foreground">prenom.nom@ecole.local</span> — pas l&apos;e-mail personnel (Gmail, etc.).
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Même page de connexion : le rôle en base décide de la destination — stagiaire →{' '}
                <span className="font-medium text-foreground">/mon-dossier</span>, équipe →{' '}
                <span className="font-medium text-foreground">/accueil</span> (CRM), formateur →{' '}
                <span className="font-medium text-foreground">/formateur</span>.
              </p>
            </div>
          </>
        )}

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
                  aria-label={passwordVisible ? t('auth.hidePassword') : t('auth.showPassword')}
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
    </AccountAccessBlockedShell>
  );
}
