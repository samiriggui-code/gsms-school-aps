import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { landingFontVariables } from '@/lib/landing-fonts';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: {
    template: "%s | Form'SSI",
    default: "Form'SSI — Centre de formation sécurité",
  },
};

/**
 * Police du site public uniquement — le backoffice (protected) garde la stack
 * système de config.reui.css. Portée par [data-landing] dans css/landing.css.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div
      data-landing
      className={cn(landingFontVariables, 'min-h-screen w-full bg-background text-foreground')}
    >
      {children}
    </div>
  );
}
