'use client';

import { User as Etudiant, UserStatus } from "@/app/models/user";
import { EtudiantOverviewStats } from "./details/leads-overview-stats";
import { EtudiantRecentActivity } from "./details/leads-recent-activity";
import { EtudiantReliabilityTier } from "./details/leads-reliability-tier";
import { EtudiantHRInfo } from "./details/leads-hr-info";
import { Alert, AlertIcon, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CalendarX2 } from "lucide-react";
import { CandidatFormationViseeCard } from "./leads-formation-visee-card";
import type { LeadsHubListRow } from "./leads-hub-list";

export function EtudiantDetailsOverview({
  Etudiant,
  leadRow,
  hideRecentActivity = false,
  hideMetierCartePro = false,
  hideContratPoste = false,
  hideGamificationTier = false,
  hrCardTitle,
  personaCopy = 'etudiant',
}: {
  Etudiant: Etudiant;
  leadRow?: LeadsHubListRow | null;
  hideRecentActivity?: boolean;
  hideMetierCartePro?: boolean;
  hideContratPoste?: boolean;
  hideGamificationTier?: boolean;
  hrCardTitle?: string;
  /** Libellés d’alerte (fiche hub candidat vs fiche élève/apprenant). */
  personaCopy?: 'etudiant' | 'candidat';
}) {
  const isAbsent = Etudiant.status === UserStatus.ABSENT;
  const isLeadMode = Boolean(leadRow);
  const absentSubject = personaCopy === 'candidat' ? 'Candidat' : 'Étudiant';

  return (
    <div className="space-y-5">
      {isAbsent && !isLeadMode && (
        <Alert variant="secondary" appearance="outline" className="border-border bg-background shadow-none animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertIcon>
            <CalendarX2 className="size-4 text-foreground/70" />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle className="text-foreground font-bold uppercase text-[11px] tracking-wider">
              {absentSubject} absent
            </AlertTitle>
            <AlertDescription className="text-muted-foreground text-sm">
              Ce compte est marqué comme absent : accès plateforme et disponibilités peuvent être restreints.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {Etudiant.role?.slug === 'candidat' && !isLeadMode && (
        <CandidatFormationViseeCard userId={Etudiant.id} dense={personaCopy !== 'candidat'} />
      )}

      <EtudiantOverviewStats Etudiant={Etudiant} leadRow={leadRow} />
      
      <div className={`grid gap-5 items-stretch ${hideGamificationTier ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
        <div className={hideGamificationTier ? '' : 'lg:col-span-2'}>
          <EtudiantHRInfo
            Etudiant={Etudiant}
            leadRow={leadRow}
            hideMetierCartePro={hideMetierCartePro}
            hideContratPoste={hideContratPoste}
            cardTitle={hrCardTitle}
          />
        </div>
        {!hideGamificationTier && !isLeadMode && (
          <div>
            <EtudiantReliabilityTier Etudiant={Etudiant} />
          </div>
        )}
      </div>

      {!hideRecentActivity && !isLeadMode && (
        <div className="grid lg:grid-cols-1 gap-5">
          <EtudiantRecentActivity Etudiant={Etudiant} />
        </div>
      )}
    </div>
  );
}



