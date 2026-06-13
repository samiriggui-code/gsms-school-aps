import { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: "%s | Form'SSI",
    default: "Form'SSI — Centre de formation sécurité",
  },
};

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div data-landing className="min-h-screen w-full">
      {children}
    </div>
  );
}
