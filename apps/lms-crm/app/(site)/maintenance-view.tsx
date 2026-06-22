'use client';

import { useCallback, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import { Engage } from '@/app/components/partials/common/engage';
import { toAbsoluteUrl } from '@/lib/helpers';
import { useTranslation } from '@/hooks/useTranslation';

const CONTACT_EMAIL = 'contact-formssi@gmail.com';
const CONTACT_PHONE_DISPLAY = '01 71 11 39 63';
const CONTACT_PHONE_HREF = 'tel:+33171113963';

function ThemeIllustration({
  lightSrc,
  darkSrc,
  alt,
  className = 'max-h-[150px]',
}: {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  className?: string;
}) {
  return (
    <>
      <img src={toAbsoluteUrl(lightSrc)} className={`dark:hidden ${className}`} alt={alt} />
      <img src={toAbsoluteUrl(darkSrc)} className={`light:hidden ${className}`} alt={alt} />
    </>
  );
}

export function MaintenanceView() {
  const { t } = useTranslation();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      const res = await fetch('/api/landing/config', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { enabled?: boolean };
        if (data.enabled) {
          window.location.href = '/';
          return;
        }
      }
    } catch {
      /* reste en maintenance */
    } finally {
      setRetrying(false);
    }
  }, []);

  const imageAlt = t('landing.maintenance.imageAlt');

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background">
      <main className="flex flex-1 flex-col">
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center lg:py-20">
          <div className="mb-8">
            <ThemeIllustration
              lightSrc="/media/illustrations/10.svg"
              darkSrc="/media/illustrations/10-dark.svg"
              alt={imageAlt}
              className="max-h-[180px] w-auto"
            />
          </div>

          <Badge variant="outline" className="mb-3 border-foreground/20 text-foreground">
            {t('landing.maintenance.badge')}
          </Badge>

          <h1 className="text-mono mb-2 max-w-lg text-2xl font-semibold text-foreground">
            {t('landing.maintenance.title')}
          </h1>

          <p className="text-secondary-foreground mb-8 max-w-md text-base">
            {t('landing.maintenance.description')}
          </p>

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={retrying}
            onClick={() => void handleRetry()}
          >
            {retrying ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="size-4" aria-hidden />
            )}
            {retrying ? t('landing.maintenance.retrying') : t('landing.maintenance.retry')}
          </Button>
        </div>

        <section
          aria-label={t('landing.maintenance.contactSectionLabel')}
          className="mt-auto border-t border-border/60 bg-muted/10 py-10 lg:py-12"
        >
          <Container>
            <div className="grid gap-5 lg:grid-cols-2 lg:gap-7.5">
              <Engage
                title={t('landing.maintenance.emailTitle')}
                description={t('landing.maintenance.emailDescription')}
                image={
                  <ThemeIllustration
                    lightSrc="/media/illustrations/2.svg"
                    darkSrc="/media/illustrations/2-dark.svg"
                    alt={imageAlt}
                  />
                }
                more={{
                  title: t('landing.maintenance.emailCta'),
                  url: `mailto:${CONTACT_EMAIL}`,
                }}
              />
              <Engage
                title={t('landing.maintenance.phoneTitle')}
                description={t('landing.maintenance.phoneDescription')}
                image={
                  <ThemeIllustration
                    lightSrc="/media/illustrations/4.svg"
                    darkSrc="/media/illustrations/4-dark.svg"
                    alt={imageAlt}
                  />
                }
                more={{
                  title: t('landing.maintenance.phoneCta', { phone: CONTACT_PHONE_DISPLAY }),
                  url: CONTACT_PHONE_HREF,
                }}
              />
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
