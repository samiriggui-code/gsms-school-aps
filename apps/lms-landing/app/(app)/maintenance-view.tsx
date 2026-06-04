'use client';

import Footer from '@/components/footer';
import Header from '@/components/header';
import { useTranslation } from '@/hooks/useTranslation';

export function MaintenanceView() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {t('landing.maintenance.badge')}
        </p>
        <h1 className="mt-3 text-2xl font-semibold">{t('landing.maintenance.title')}</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{t('landing.maintenance.description')}</p>
      </main>
      <Footer />
    </div>
  );
}
