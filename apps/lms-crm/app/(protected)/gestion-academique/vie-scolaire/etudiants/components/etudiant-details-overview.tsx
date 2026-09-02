'use client';

import { User as Etudiant } from "@/app/models/user";
import { EtudiantOverviewStats } from "./details/etudiant-overview-stats";
import { EtudiantRecentActivity } from "./details/etudiant-recent-activity";
import { EtudiantReliabilityTier } from "./details/etudiant-reliability-tier";
import { EtudiantHRInfo } from "./details/etudiant-hr-info";
import { Alert, AlertIcon, AlertTitle, AlertDescription } from "@repo/ui/alert";
import { CalendarX2 } from "lucide-react";
import { isUserCurrentlyAbsent, userAbsenceAlertPeriod } from '@/lib/rh/user-absence-ui';
import { CandidatFormationViseeCard } from "./candidat-formation-visee-card";

export function EtudiantDetailsOverview({
  Etudiant,
  hideRecentActivity = false,
  hideMetierCartePro = false,
  hideContratPoste = false,
  hideGamificationTier = false,
  hrCardTitle,
  personaCopy = 'etudiant',
}: {
  Etudiant: Etudiant;
  hideRecentActivity?: boolean;
  hideMetierCartePro?: boolean;
  hideContratPoste?: boolean;
  hideGamificationTier?: boolean;
  hrCardTitle?: string;
  /** Libellés d’alerte (fiche hub candidat vs fiche élève/apprenant). */
  personaCopy?: 'etudiant' | 'candidat';
}) {
  const isAbsent = isUserCurrentlyAbsent(Etudiant);
  const absencePeriod = userAbsenceAlertPeriod(Etudiant);
  const absentSubject = personaCopy === 'candidat' ? 'Candidat' : 'Étudiant';

  return (
    <div className="space-y-5">
      {isAbsent && (
        <Alert variant="secondary" appearance="outline" className="border-border bg-background shadow-none animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertIcon>
            <CalendarX2 className="size-4 text-foreground/70" />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle className="text-foreground font-bold uppercase text-[11px] tracking-wider">
              {absentSubject} absent
            </AlertTitle>
            <AlertDescription className="text-muted-foreground text-sm">
              Ce compte est en absence : accès plateforme et disponibilités peuvent être restreints.
              {absencePeriod ? (
                <span className="mt-1 block text-xs font-medium text-foreground/80">{absencePeriod}</span>
              ) : null}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {Etudiant.role?.slug === 'candidat' && (
        <CandidatFormationViseeCard userId={Etudiant.id} dense={personaCopy !== 'candidat'} />
      )}

      <EtudiantOverviewStats Etudiant={Etudiant} />
      
      <div className={`grid gap-5 items-stretch ${hideGamificationTier ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
        <div className={hideGamificationTier ? '' : 'lg:col-span-2'}>
          <EtudiantHRInfo
            Etudiant={Etudiant}
            hideMetierCartePro={hideMetierCartePro}
            hideContratPoste={hideContratPoste}
            cardTitle={hrCardTitle}
          />
        </div>
        {!hideGamificationTier && (
          <div>
            <EtudiantReliabilityTier Etudiant={Etudiant} />
          </div>
        )}
      </div>

      {!hideRecentActivity && (
        <div className="grid lg:grid-cols-1 gap-5">
          <EtudiantRecentActivity Etudiant={Etudiant} />
        </div>
      )}
    </div>
  );
}



