import { SessionReadinessStatus } from '@repo/database';

/** Happy-path SD-06 WF-10. */
export const SESSION_READINESS_NEXT: Partial<
  Record<SessionReadinessStatus, SessionReadinessStatus>
> = {
  [SessionReadinessStatus.DRAFT]: SessionReadinessStatus.PLANNED,
  [SessionReadinessStatus.PLANNED]: SessionReadinessStatus.CONFIRMED,
  [SessionReadinessStatus.CONFIRMED]: SessionReadinessStatus.READY,
  [SessionReadinessStatus.READY]: SessionReadinessStatus.RUNNING,
  [SessionReadinessStatus.RUNNING]: SessionReadinessStatus.COMPLETED,
  [SessionReadinessStatus.COMPLETED]: SessionReadinessStatus.CLOSED,
  [SessionReadinessStatus.CLOSED]: SessionReadinessStatus.ARCHIVED,
};

export function nextSessionReadiness(
  current: SessionReadinessStatus,
): SessionReadinessStatus | null {
  return SESSION_READINESS_NEXT[current] ?? null;
}
