'use client';

import { useCallback } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { ModuleWorkspacePage } from '@/components/workspace/module-workspace-page';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import {
  FinanceDistributionChart,
  FinanceEvolutionChart,
} from '../components';

export default function Page() {
  const { t } = useTranslation();

  const exportCsv = useCallback(async () => {
    try {
      const res = await apiFetch('/api/sections/administration-facturation/finance/rapports/export');
      if (!res.ok) {
        toast.error(t('governance.exportFailed'));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rapports-finance.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('financeReports.exportedSuccess'));
    } catch {
      toast.error(t('governance.exportFailed'));
    }
  }, [t]);

  return (
    <ModuleWorkspacePage
      viewKey="finance-rapports"
      beforeContent={
        <Container className="pb-0">
          <div className="mb-4 flex justify-end">
            <Button variant="outline" onClick={exportCsv}>
              <Download className="size-4" />
              {t('financeReports.exportButton')}
            </Button>
          </div>
        </Container>
      }
      charts={
        <>
          <FinanceDistributionChart />
          <FinanceEvolutionChart />
        </>
      }
    />
  );
}
