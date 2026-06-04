'use client';

import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const DEMO_LOGO_SRC = '/formations/tfp-aps.png';

export type UploadProps = {
  /** Logo organisme / formation (URL). Si absent et `allowDemoLogoFallback`, affiche le logo démo TFP. */
  logoUrl?: string | null;
  /** Par défaut `true` : conserve le comportement historique des sheets catalogue. Mettre `false` sur la fiche session pour ne pas mélanger les filières. */
  allowDemoLogoFallback?: boolean;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  sessionLabel?: string | null;
};

export function Upload({
  logoUrl,
  allowDemoLogoFallback = true,
  companyName = "Form'SSI",
  email = 'contact@form-ssi.fr',
  phone = '01 71 11 39 63',
  address = '9 AV Alexandre Maistrasse, 92500',
  sessionLabel = 'Dès le 04 Mai 2026',
}: UploadProps = {}) {
  const trimmedLogo = logoUrl?.trim();
  const resolvedSrc =
    trimmedLogo && trimmedLogo !== '' ? trimmedLogo : allowDemoLogoFallback ? DEMO_LOGO_SRC : null;
  const logoAlt = companyName?.trim() || 'Organisme de formation';

  const rows: { label: string; value: string }[] = [
    { label: 'Company', value: companyName?.trim() || "—" },
    { label: 'Email', value: email?.trim() || "—" },
    { label: 'Phone No.', value: phone?.trim() || "—" },
    { label: 'Address', value: address?.trim() || "—" },
    { label: 'Session', value: sessionLabel?.trim() || "—" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex min-h-[240px] w-full items-stretch justify-stretch overflow-hidden rounded-xl border border-border bg-accent/70">
        <div className="relative flex min-h-[240px] w-full bg-white">
          {resolvedSrc ? (
            <img
              src={resolvedSrc}
              alt={logoAlt}
              className="h-full min-h-[240px] w-full object-cover object-center"
            />
          ) : (
            <span className="m-auto px-3 text-center text-[11px] text-muted-foreground">
              Logo non renseigné
            </span>
          )}
        </div>
      </div>

      <div className="space-y-0">
        {rows.map((item, index) => (
          <div key={item.label}>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground/70">
                {item.label}
              </span>
              {item.label === 'Email' && item.value !== '—' ? (
                <Link
                  href={`mailto:${item.value}`}
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
            {index < 4 ? <Separator className="opacity-40" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
