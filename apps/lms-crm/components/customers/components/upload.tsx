'use client';

import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { formationLogos } from '@/lib/certification-logos';
import { useTranslation } from '@/hooks/useTranslation';

type UploadProps = {
  logoSrc?: string;
  logoAlt?: string;
  sessionLabel?: string;
};

export function Upload({
  logoSrc = formationLogos.default,
  logoAlt,
  sessionLabel,
}: UploadProps) {
  const { t } = useTranslation();
  const resolvedLogoAlt = logoAlt ?? t('landing.sheets.upload.logoAlt');

  const rows = [
    { key: 'company' as const, value: "Form'SSI" },
    { key: 'email' as const, value: 'contact@form-ssi.fr' },
    { key: 'phone' as const, value: '01 71 11 39 63' },
    { key: 'address' as const, value: '9 AV Alexandre Maistrasse, 92500' },
    {
      key: 'session' as const,
      value: sessionLabel?.trim() || t('landing.sheets.upload.sessionValue'),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex h-[180px] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-accent/70">
        <div className="relative flex h-full w-full items-center justify-center bg-white">
          <img
            src={logoSrc}
            alt={resolvedLogoAlt}
            className="max-h-full max-w-full object-contain p-4"
          />
        </div>
      </div>

      <div className="space-y-0">
        {rows.map((item, index) => (
          <div key={item.key}>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground/70">
                {t(`landing.sheets.upload.${item.key}`)}
              </span>
              {item.key === 'email' ? (
                <Link
                  href="mailto:contact@form-ssi.fr"
                  className="max-w-[130px] truncate text-end text-[11px] font-medium text-foreground hover:text-primary"
                >
                  {item.value}
                </Link>
              ) : (
                <span className="max-w-[130px] truncate text-end text-[11px] font-medium text-foreground">
                  {item.value}
                </span>
              )}
            </div>
            {index < rows.length - 1 ? <Separator className="opacity-40" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
