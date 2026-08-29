'use client';

import { cn } from '@/lib/utils';
import { DEVIS_WORKFLOW_STEPS, devisWorkflowStepIndex, type DevisWorkflowStatus } from '../lib/devis-workflow';
import { DEVIS_STATUS_LABEL_FR } from '../constants/status-labels';

export function DevisWorkflowStepper({
  status,
  className,
  compact = false,
}: {
  status: string;
  className?: string;
  /** Masque le texte d’aide sous le stepper (fiche devis). */
  compact?: boolean;
}) {
  const active = devisWorkflowStepIndex(status);
  const isTerminal = status === 'REJECTED' || status === 'EXPIRED';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1 sm:gap-2">
        {DEVIS_WORKFLOW_STEPS.map((step, i) => {
          const done = i < active || (status === 'ACCEPTED' && i <= 3);
          const current = i === active && !isTerminal;
          return (
            <div key={step.key} className="flex flex-1 items-center gap-1 min-w-0">
              <div
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold border-2 transition-colors',
                  done && 'bg-primary border-primary text-primary-foreground',
                  current && 'border-primary text-primary bg-primary/10',
                  !done && !current && 'border-border text-muted-foreground bg-muted/30',
                )}
              >
                {i + 1}
              </div>
              <div className="min-w-0 hidden sm:block">
                <p
                  className={cn(
                    'text-[11px] font-semibold truncate',
                    current ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </p>
              </div>
              {i < DEVIS_WORKFLOW_STEPS.length - 1 ? (
                <div
                  className={cn('h-0.5 flex-1 rounded-full mx-0.5', done ? 'bg-primary/60' : 'bg-border')}
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
      {!compact && isTerminal ? (
        <p className="text-xs text-destructive font-medium">
          Statut : {DEVIS_STATUS_LABEL_FR[status as DevisWorkflowStatus] ?? status} — ce devis ne poursuit pas le
          parcours standard.
        </p>
      ) : !compact ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Étape actuelle :</span>{' '}
          {DEVIS_STATUS_LABEL_FR[status as DevisWorkflowStatus] ?? status}
          {' — '}
          {DEVIS_WORKFLOW_STEPS[active]?.hint}
        </p>
      ) : null}
    </div>
  );
}
