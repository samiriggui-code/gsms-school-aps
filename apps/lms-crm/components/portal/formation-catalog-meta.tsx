'use client';

import { type ReactNode } from 'react';
import { Globe, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatParticipantCount,
  formatRatingScore,
  type FormationPortalDisplayMeta,
} from '@/lib/portal/formation-portal-display';
import { portalMuted } from '@/components/portal/layout/portal-ui';

type Props = {
  meta: FormationPortalDisplayMeta;
  successRateDisplay?: string;
  traineeCapacityDisplay?: string;
  className?: string;
};

function MetaItem({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1', className)}>
      {label ? <span className="sr-only">{label}</span> : null}
      {children}
    </span>
  );
}

export function FormationCatalogMetaBar({
  meta,
  successRateDisplay,
  traineeCapacityDisplay,
  className,
}: Props) {
  const ratingLabel = formatRatingScore(meta.ratingScore);
  const participantsLabel = formatParticipantCount(meta.participantCount);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Ligne type Udemy : note · participants · auteur · mise à jour · langue */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px]">
        {meta.ratingScore != null ? (
          <MetaItem label="Note">
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <Star className="size-3.5 fill-amber-500 text-amber-500" aria-hidden />
              {ratingLabel}
              <span className="font-normal text-muted-foreground">sur 5</span>
            </span>
            {meta.ratingCount != null && meta.ratingCount > 0 ? (
              <span className="text-muted-foreground">
                ({meta.ratingCount.toLocaleString('fr-FR')} avis)
              </span>
            ) : null}
          </MetaItem>
        ) : null}

        {meta.participantCount > 0 ? (
          <>
            <span className="hidden text-muted-foreground/50 sm:inline" aria-hidden>
              ·
            </span>
            <MetaItem label="Participants">
              <Users className="size-3.5 text-muted-foreground" aria-hidden />
              <span className="font-medium text-foreground">{participantsLabel}</span>
              <span className="text-muted-foreground">participants</span>
            </MetaItem>
          </>
        ) : null}

        {meta.authorLabel ? (
          <>
            <span className="hidden text-muted-foreground/50 sm:inline" aria-hidden>
              ·
            </span>
            <MetaItem label="Organisme">
              <span className="text-muted-foreground">Créé par</span>
              <span className="font-medium text-foreground">{meta.authorLabel}</span>
            </MetaItem>
          </>
        ) : null}

        {meta.lastUpdatedLabel ? (
          <>
            <span className="hidden text-muted-foreground/50 sm:inline" aria-hidden>
              ·
            </span>
            <MetaItem label="Dernière mise à jour">
              <span className="text-muted-foreground">Mise à jour</span>
              <span className="font-medium text-foreground">{meta.lastUpdatedLabel}</span>
            </MetaItem>
          </>
        ) : null}

        {meta.languageLabel ? (
          <>
            <span className="hidden text-muted-foreground/50 sm:inline" aria-hidden>
              ·
            </span>
            <MetaItem label="Langue">
              <Globe className="size-3.5 text-muted-foreground" aria-hidden />
              <span className="font-medium text-foreground">{meta.languageLabel}</span>
            </MetaItem>
          </>
        ) : null}
      </div>

      {/* KPI métier formation */}
      <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', portalMuted)}>
        {successRateDisplay ? (
          <span>
            <span className="font-medium text-foreground">{successRateDisplay}</span> de réussite
          </span>
        ) : null}
        {traineeCapacityDisplay ? (
          <span>
            <span className="font-medium text-foreground">{traineeCapacityDisplay}</span> stagiaires
            / session
          </span>
        ) : null}
        {meta.theoryPracticeLabel ? (
          <span>{meta.theoryPracticeLabel}</span>
        ) : null}
      </div>
    </div>
  );
}
