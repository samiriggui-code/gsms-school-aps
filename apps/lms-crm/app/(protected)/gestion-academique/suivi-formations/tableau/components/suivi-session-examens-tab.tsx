'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { FormationExamsPanel, ParcoursSessionExamensPanel, ExamQcmBankPanel } from './examens';
import { Alert, AlertDescription } from '@repo/ui/alert';

export function SuiviSessionExamensTab({ sessionId }: { sessionId: string | null }) {
  const { t } = useTranslation();

  if (!sessionId) {
    return (
      <Alert variant="secondary" appearance="outline">
        <AlertDescription>{t('vieScolaire.suivi.pickSessionForExams')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Tabs defaultValue="results" className="space-y-4">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="planned">{t('vieScolaire.examens.tabPlanned')}</TabsTrigger>
        <TabsTrigger value="results">{t('vieScolaire.examens.tabResults')}</TabsTrigger>
        <TabsTrigger value="qcm">{t('vieScolaire.examens.tabQcm')}</TabsTrigger>
      </TabsList>
      <TabsContent value="planned" className="mt-0">
        <FormationExamsPanel sessionId={sessionId} embedded />
      </TabsContent>
      <TabsContent value="results" className="mt-0">
        <ParcoursSessionExamensPanel sessionId={sessionId} embedded />
      </TabsContent>
      <TabsContent value="qcm" className="mt-0">
        <ExamQcmBankPanel />
      </TabsContent>
    </Tabs>
  );
}
