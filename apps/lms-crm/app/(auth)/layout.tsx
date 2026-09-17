import { ReactNode } from 'react';
import { landingFontVariables } from '@/lib/landing-fonts';
import { cn } from '@/lib/utils';

/**
 * Police + palette du site public, portées sur l'auth — même identité que la
 * landing (voir apps/lms-crm/app/(site)/layout.tsx). Scopé à [data-landing]
 * dans css/landing.css, sans toucher aux tokens du backoffice (protected).
 */

/** Pas de force-dynamic : pages auth = UI client + i18n, zéro data serveur. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      data-landing
      className={cn(landingFontVariables, 'flex min-h-screen w-full bg-background text-foreground')}
    >
      {children}
    </div>
  );
}
