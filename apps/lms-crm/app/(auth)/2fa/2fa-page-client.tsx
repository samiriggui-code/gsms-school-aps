'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, LoaderCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useTranslation } from '@/hooks/useTranslation';

const RESEND_SECONDS = 37;
const OTP_LENGTH = 6;

type TwoFactorChannel = 'email' | 'sms' | 'whatsapp';

function maskDestination(value: string, channel: TwoFactorChannel): string {
  const trimmed = value.trim();
  if (!trimmed) return '••••••••••';

  if (channel === 'email') {
    const [local, domain] = trimmed.split('@');
    if (!domain) return '••••••••••';
    const visible = local.slice(-2);
    return `••••••${visible}@${domain}`;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 4) return '•••• ••••';
  return `••••• ${digits.slice(-4)}`;
}

export default function TwoFactorPageClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const channel = (searchParams?.get('channel') as TwoFactorChannel) || 'email';
  const destination = searchParams?.get('to') ?? '';
  const callbackUrl = searchParams?.get('callbackUrl') ?? '/accueil';

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  const maskedDestination = useMemo(
    () => maskDestination(destination, channel),
    [destination, channel],
  );

  const channelLabel = useMemo(() => {
    switch (channel) {
      case 'sms':
        return t('auth.twoFactor.channelSms');
      case 'whatsapp':
        return t('auth.twoFactor.channelWhatsapp');
      default:
        return t('auth.twoFactor.channelEmail');
    }
  }, [channel, t]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const handleResend = useCallback(async () => {
    if (resendIn > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    try {
      const res = await apiFetch('/api/auth/2fa/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, destination }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('auth.twoFactor.resendFailed'));
      toast.success(t('auth.twoFactor.resendSuccess'));
      setResendIn(RESEND_SECONDS);
      setCode('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('auth.twoFactor.resendFailed'));
    } finally {
      setIsResending(false);
    }
  }, [channel, destination, isResending, resendIn, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== OTP_LENGTH) {
      setError(t('auth.twoFactor.codeIncomplete'));
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const res = await apiFetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, channel, destination }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('auth.twoFactor.verifyFailed'));
      toast.success(t('auth.twoFactor.verifySuccess'));
      router.push(callbackUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.twoFactor.verifyFailed'));
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
      <img
        src={toAbsoluteUrl('/media/illustrations/34.svg')}
        className="mx-auto mb-1 h-20 dark:hidden"
        alt=""
      />
      <img
        src={toAbsoluteUrl('/media/illustrations/34-dark.svg')}
        className="mx-auto mb-1 hidden h-20 dark:block"
        alt=""
      />

      <div className="mb-1 text-center">
        <h3 className="mb-4 text-lg font-medium text-foreground">
          {t('auth.twoFactor.title')}
        </h3>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">
            {t('auth.twoFactor.subtitle', { channel: channelLabel })}
          </span>
          <span className="text-sm font-medium text-foreground">{maskedDestination}</span>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      ) : null}

      <div className="flex justify-center">
        <InputOTP
          maxLength={OTP_LENGTH}
          value={code}
          onChange={(value) => {
            setCode(value);
            setError(null);
          }}
          containerClassName="gap-2.5"
        >
          <InputOTPGroup className="gap-2.5">
            {Array.from({ length: OTP_LENGTH }).map((_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="size-10 rounded-md border border-input text-base shadow-none first:rounded-md first:border-l last:rounded-md"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="mb-1 flex flex-wrap items-center justify-center gap-1 text-center">
        <span className="text-xs text-muted-foreground">
          {resendIn > 0
            ? t('auth.twoFactor.resendCountdown', { seconds: resendIn })
            : t('auth.twoFactor.resendPrompt')}
        </span>
        <button
          type="button"
          className="text-xs font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
          disabled={resendIn > 0 || isResending}
          onClick={() => void handleResend()}
        >
          {isResending ? t('auth.twoFactor.resending') : t('auth.twoFactor.resend')}
        </button>
      </div>

      <Button type="submit" className="w-full" disabled={isVerifying || code.length !== OTP_LENGTH}>
        {isVerifying ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
        {t('auth.twoFactor.continue')}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/signin" className="text-primary hover:underline">
          {t('auth.twoFactor.backToSignIn')}
        </Link>
      </p>
    </form>
  );
}
