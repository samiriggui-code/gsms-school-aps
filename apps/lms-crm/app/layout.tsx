import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { Metadata } from 'next';

import { AppProviders } from './providers';

import '@/css/styles.css';

import '@/components/keenicons/assets/styles.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Form\'SSI',
    default: "Form'SSI",
  },
  icons: {
    icon: [{ url: '/brand/formssi-icon.png', type: 'image/png' }],
    apple: [{ url: '/brand/formssi-icon.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Session chargee cote client (SessionProvider) — evite blocage RSC / getServerSession en prod Docker
  return (
    <html
      lang="fr"
      className="min-h-screen font-sans"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className={cn(
          'antialiased min-h-screen w-full font-sans text-sm font-medium text-foreground bg-background',
        )}
      >
        <AppProviders session={null}>{children}</AppProviders>
      </body>
    </html>
  );
}
