'use client';

import Link from 'next/link';
import { FileText, ExternalLink } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { Skeleton } from '@repo/ui/skeleton';
import { useFinanceDevisQuery } from '@/app/(protected)/administration-facturation/finance/devis/hooks/use-finance-devis-query';
import { DEVIS_STATUS_LABEL_FR } from '@/app/(protected)/administration-facturation/finance/devis/constants/status-labels';
import { CRM_FINANCE_DEVIS_PATH } from '../constants/crm-paths';

export function LeadLinkedDevisSection({
  leadId,
  enabled,
  onOpenDevis,
}: {
  leadId: string | null;
  enabled: boolean;
  onOpenDevis: (devisId: string) => void;
}) {
  const { data, isLoading } = useFinanceDevisQuery({
    leadId: leadId ?? null,
    page: 1,
    limit: 50,
    status: 'all',
    sort: 'updatedAt',
    dir: 'desc',
  });

  if (!leadId) return null;

  return (
    <Card className="shadow-none border border-border/60 bg-background">
      <CardHeader className="pb-2 border-b border-border/50 flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          Devis liés à ce lead
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" asChild>
          <Link href={`${CRM_FINANCE_DEVIS_PATH}?leadId=${encodeURIComponent(leadId)}`}>
            <ExternalLink className="size-3.5" />
            Liste devis du lead
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {!enabled ? null : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (data?.items?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun devis pour l’instant. Utilisez <span className="font-medium text-foreground">Traiter le lead</span>{' '}
            → <span className="font-medium text-foreground">Créer un devis</span>.
          </p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60 overflow-hidden">
            {(data?.items ?? []).map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-background hover:bg-muted/20">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {d.referenceCode}{' '}
                    <span className="font-normal text-muted-foreground">— {d.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MAJ {new Date(d.updatedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px]">
                    {DEVIS_STATUS_LABEL_FR[d.status] ?? d.status}
                  </Badge>
                  <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                    <Link href={`${CRM_FINANCE_DEVIS_PATH}?devisId=${encodeURIComponent(d.id)}`}>
                      Ouvrir dans Facturation
                    </Link>
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => onOpenDevis(d.id)}>
                    Ouvrir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
