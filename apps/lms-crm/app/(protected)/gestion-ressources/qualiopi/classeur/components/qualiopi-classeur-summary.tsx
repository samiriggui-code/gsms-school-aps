import Link from 'next/link';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { cn } from '@/lib/utils';
import type { QualiopiClasseurCounts } from '../hooks/use-qualiopi-classeur';

export function QualiopiClasseurSummary({
  counts,
  globalOk,
  completenessPct,
}: {
  counts: QualiopiClasseurCounts;
  globalOk: boolean;
  completenessPct: number;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3',
        globalOk
          ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
          : counts.ko > 0
            ? 'border-destructive/30 bg-destructive/5'
            : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20',
      )}
    >
      <div className="flex items-center gap-2.5">
        {globalOk ? (
          <CheckCircle2 className="size-4 text-green-600" />
        ) : counts.ko > 0 ? (
          <ShieldAlert className="size-4 text-destructive" />
        ) : (
          <AlertCircle className="size-4 text-yellow-600" />
        )}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest">
            {counts.ok}/{counts.total} indicateurs OK
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {counts.ko > 0 ? `${counts.ko} KO · ` : ''}
            {counts.toFix > 0 ? `${counts.toFix} à réparer · ` : ''}
            {counts.na > 0 ? `${counts.na} N/A · ` : ''}
            {counts.pending} à auditer
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/gestion-ressources/qualiopi/couverture">Couverture Evidence</Link>
        </Button>
        <Badge variant="outline" className="text-xs font-bold">
          {completenessPct}% complet
        </Badge>
      </div>
    </div>
  );
}
