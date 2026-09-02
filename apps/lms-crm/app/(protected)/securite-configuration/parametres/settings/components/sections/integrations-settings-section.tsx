'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ExternalLink, LoaderCircleIcon } from 'lucide-react';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Badge } from '@repo/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Switch } from '@repo/ui/switch';
import { Button } from '@repo/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

type IntegrationItem = {
  id: string;
  label: string;
  description: string;
  connected: boolean;
  detail?: string;
  href?: string;
};

export function IntegrationsSettingsSection() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['parametres-integrations'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/securite-configuration/parametres/integrations');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: { message?: string } }).error?.message ?? t('pages.settings.common.error'));
      }
      return unwrapSectionApiData<{ items: IntegrationItem[] }>(json);
    },
  });

  const items = data?.items ?? [];

  return (
    <Card className="pb-2.5">
      <CardHeader>
        <CardTitle>{t('pages.settings.integrations.title')}</CardTitle>
        <CardDescription>
          {t('pages.settings.integrations.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
            <LoaderCircleIcon className="size-4 animate-spin" />
            {t('pages.settings.common.loading')}
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border/70 bg-muted/10 px-4 py-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <Badge variant={item.connected ? 'success' : 'secondary'}>
                    {item.connected
                      ? t('pages.settings.common.active')
                      : t('pages.settings.common.notConfigured')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                {item.detail ? (
                  <p className="text-xs text-muted-foreground/80">{item.detail}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {item.href ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={item.href} target="_blank" rel="noopener noreferrer">
                      {t('pages.settings.common.open')}
                      <ExternalLink className="ms-1 size-3" />
                    </Link>
                  </Button>
                ) : null}
                <Switch checked={item.connected} disabled aria-label={item.label} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

