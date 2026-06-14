'use client';

import { User as Collaborateur } from '@/app/models/user';
import { CollaborateurOverviewStats } from './details/collaborateur-overview-stats';
import { CollaborateurRecentActivity } from './details/collaborateur-recent-activity';
import { CollaborateurReliabilityTier } from './details/collaborateur-reliability-tier';
import { CollaborateurHRInfo } from './details/collaborateur-hr-info';
import { FormateurOverviewStats } from '../../formateurs/components/details/formateur-overview-stats';
import { FormateurRecentActivity } from '../../formateurs/components/details/formateur-recent-activity';
import { FormateurReliabilityTier } from '../../formateurs/components/details/formateur-reliability-tier';
import { FormateurHRInfo } from '../../formateurs/components/details/formateur-hr-info';
import { Alert, AlertIcon, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CalendarX2 } from 'lucide-react';
import { isUserCurrentlyAbsent, userAbsenceAlertPeriod } from '@/lib/rh/user-absence-ui';

export type RhOverviewVariant = 'collaborateur' | 'formateur';

export function CollaborateurDetailsOverview({
  collaborateur,
  overviewVariant,
  showRecentActivity = true,
}: {
  collaborateur: Collaborateur;
  /** Sinon déduit du rôle `formateur`. */
  overviewVariant?: RhOverviewVariant;
  /** Désactivé sur l’espace formateur (API historique réservée aux RH). */
  showRecentActivity?: boolean;
}) {
  const mode: RhOverviewVariant =
    overviewVariant ??
    (collaborateur.role?.slug === 'formateur' ? 'formateur' : 'collaborateur');

  const isAbsent = isUserCurrentlyAbsent(collaborateur);
  const absencePeriod = userAbsenceAlertPeriod(collaborateur);

  return (
    <div className="space-y-5">
      {isAbsent ?
        <Alert variant="secondary" appearance="outline" className="border-border bg-background shadow-none animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertIcon>
            <CalendarX2 className="size-4 text-foreground/70" />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle className="text-foreground font-bold uppercase text-[11px] tracking-wider">
              {mode === 'formateur' ? 'Formateur absent' : 'Collaborateur absent'}
            </AlertTitle>
            <AlertDescription className="text-muted-foreground text-sm">
              {mode === 'formateur' ?
                'Ce formateur est actuellement en absence. Ses accès et sa disponibilité pour animer les sessions sont limités.'
              : 'Ce collaborateur est actuellement en absence. Ses accès et sa disponibilité dans le planning sont limités.'}
              {absencePeriod ? (
                <span className="mt-1 block text-xs font-medium text-foreground/80">{absencePeriod}</span>
              ) : null}
            </AlertDescription>
          </div>
        </Alert>
      : null}

      {mode === 'formateur' ?
        <FormateurOverviewStats collaborateur={collaborateur} />
      : <CollaborateurOverviewStats collaborateur={collaborateur} />}

      <div className="grid lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2">
          {mode === 'formateur' ?
            <FormateurHRInfo collaborateur={collaborateur} />
          : <CollaborateurHRInfo collaborateur={collaborateur} />}
        </div>
        <div>
          {mode === 'formateur' ?
            <FormateurReliabilityTier collaborateur={collaborateur} />
          : <CollaborateurReliabilityTier collaborateur={collaborateur} />}
        </div>
      </div>

      {showRecentActivity ? (
        <div className="grid lg:grid-cols-1 gap-5">
          {mode === 'formateur' ?
            <FormateurRecentActivity collaborateur={collaborateur} />
          : <CollaborateurRecentActivity collaborateur={collaborateur} />}
        </div>
      ) : null}
    </div>
  );
}
