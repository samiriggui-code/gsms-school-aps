'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@repo/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

export function BrandedLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="grid min-h-screen w-full flex-1 lg:grid-cols-2">
      <div className="order-2 flex items-center justify-center p-8 lg:order-1 lg:p-10">
        <Card className="w-full max-w-[400px]">
          <CardContent className="p-6">{children}</CardContent>
        </Card>
      </div>

      <div className="relative order-1 overflow-hidden bg-muted lg:order-2 lg:m-5 lg:rounded-xl lg:border lg:border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_85%),transparent_70%)]"
        />
        <div className="relative flex h-full flex-col justify-between gap-8 p-8 lg:p-16">
          <Link href="/" className="w-fit">
            <img
              src={toAbsoluteUrl('/brand/formssi-icon.png')}
              className="h-10 w-auto max-w-none object-contain object-left"
              alt="FORM'SSI"
            />
          </Link>

          <div className="flex flex-col gap-3">
            <h3 className="text-[clamp(24px,3vw,34px)]/[1.1] font-[650] tracking-[-0.02em] text-foreground">
              {t('auth.secureAccess')}
            </h3>
            <div className="max-w-sm text-base text-muted-foreground">
              {t('auth.brandedSubtitle')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
