'use client';

import { DashboardContent } from './components';
import { PageHeader } from '@/components/common/page-header';
import { useTranslation } from '@/hooks/useTranslation';

const AccueilDashboardPage = () => {
  const { t } = useTranslation();

  return (
    <div className="container-fluid mx-auto w-full max-w-full min-w-0 px-4 lg:px-5 space-y-5 lg:space-y-9">
      <PageHeader
        title={t('accueil.title')}
        description={t('accueil.description')}
        showBreadcrumb={false}
      />

      <DashboardContent />
</div>
  );
};

export { AccueilDashboardPage };
