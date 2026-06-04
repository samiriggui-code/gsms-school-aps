import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth/next';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { AppProviders } from './providers';

const inter = Inter({ subsets: ['latin'] });

import '@/css/styles.css';
import '@/components/keenicons/assets/styles.css';

export const metadata: Metadata = {
  title: {
    template: '%s | CRM Form\'SSI',
    default: "CRM Form'SSI",
  },
  icons: {
    icon: [{ url: '/brand/formssi-icon.png', type: 'image/png' }],
    apple: [{ url: '/brand/formssi-icon.png' }],
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html className="h-full" suppressHydrationWarning>
      <body
        className={cn(
          'antialiased flex h-full text-base text-foreground bg-background',
          inter.className,
        )}
      >
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}
