'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type SurveyRow = {
  id: string;
  timing: string;
  status: string;
  sentAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  sessionId: string;
  sessionLabel: string;
  formationName: string;
  participantName: string;
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  SENT: 'Envoyée',
  COMPLETED: 'Complétée',
  EXPIRED: 'Expirée',
};

const TIMING_LABEL: Record<string, string> = {
  HOT: 'À chaud (J0)',
  COLD: 'À froid (J+45)',
};

export default function SatisfactionSurveysPage() {
  const { title, description } = usePageToolbarMeta('/support-qualite/docs-circuits/satisfaction');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['support-qualite', 'docs-circuits', 'satisfaction'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/support-qualite/docs-circuits/satisfaction');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<{ items: SurveyRow[] }>(await res.json());
    },
    staleTime: 30_000,
  });

  const items = data?.items ?? [];

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>
      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <Card className="border-border/70 shadow-none">
          <CardHeader className="flex-row items-center justify-between space-y-0 py-4">
            <CardTitle className="text-base">Enquêtes récentes</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/support-qualite/docs-circuits">Retour hub</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Chargement…
              </div>
            ) : null}
            {isError ? (
              <p className="text-sm text-destructive">Impossible de charger les enquêtes.</p>
            ) : null}
            {!isLoading && !isError && items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune enquête pour l&apos;instant. Déclenchement depuis la fiche session (HOT) ou
                cron J+45 (COLD).
              </p>
            ) : null}
            {items.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="font-medium truncate">
                    {row.formationName} · {row.participantName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.sessionLabel} · {formatDateTime(row.createdAt)}
                    {row.sentAt ? ` · envoyée ${formatDateTime(row.sentAt)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" appearance="outline">
                    {TIMING_LABEL[row.timing] ?? row.timing}
                  </Badge>
                  <Badge
                    variant={row.status === 'COMPLETED' ? 'success' : 'secondary'}
                    appearance="light"
                  >
                    {STATUS_LABEL[row.status] ?? row.status}
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      href={`/gestion-academique/vie-scolaire/suivi-formations?sessionId=${row.sessionId}`}
                    >
                      Session
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
