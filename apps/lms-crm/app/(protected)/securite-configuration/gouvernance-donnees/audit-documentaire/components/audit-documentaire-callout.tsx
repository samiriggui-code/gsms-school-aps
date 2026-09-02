'use client';

import Link from 'next/link';
import { FileSearch, FolderOpen } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Card, CardContent } from '@repo/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

export function AuditDocumentaireCallout() {
  const { t } = useTranslation();

  return (
    <Card className="border border-primary/20 bg-primary/[0.03] shadow-none">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
            <FileSearch className="size-5 text-primary" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold">
              {t('workspace.gouvernance-audit.callout.title')}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('workspace.gouvernance-audit.callout.body')}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-2" asChild>
          <Link href="/securite-configuration/gouvernance-donnees/storage">
            <FolderOpen className="size-4" />
            {t('workspace.gouvernance-audit.callout.openStorage')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
