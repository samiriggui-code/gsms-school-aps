/**
 * Valeurs runtime des enums Prisma — fichier dédié pour que Turbopack résolve
 * les exports nommés (le re-export groupé depuis index.ts + client CJS échoue parfois).
 */
import {
  LandingTeamVolet as LandingTeamVoletEnum,
  RhTeamType as RhTeamTypeEnum,
  HelpArticleStatus as HelpArticleStatusEnum,
  HelpArticleAudience as HelpArticleAudienceEnum,
  QualityIncidentSeverity as QualityIncidentSeverityEnum,
  QualityIncidentStatus as QualityIncidentStatusEnum,
} from '../generated/client';

export const LandingTeamVolet = LandingTeamVoletEnum;
export type LandingTeamVolet = (typeof LandingTeamVoletEnum)[keyof typeof LandingTeamVoletEnum];

export const RhTeamType = RhTeamTypeEnum;
export type RhTeamType = (typeof RhTeamTypeEnum)[keyof typeof RhTeamTypeEnum];

export const HelpArticleStatus = HelpArticleStatusEnum;
export type HelpArticleStatus = (typeof HelpArticleStatusEnum)[keyof typeof HelpArticleStatusEnum];

export const HelpArticleAudience = HelpArticleAudienceEnum;
export type HelpArticleAudience = (typeof HelpArticleAudienceEnum)[keyof typeof HelpArticleAudienceEnum];

export const QualityIncidentSeverity = QualityIncidentSeverityEnum;
export type QualityIncidentSeverity =
  (typeof QualityIncidentSeverityEnum)[keyof typeof QualityIncidentSeverityEnum];

export const QualityIncidentStatus = QualityIncidentStatusEnum;
export type QualityIncidentStatus =
  (typeof QualityIncidentStatusEnum)[keyof typeof QualityIncidentStatusEnum];
