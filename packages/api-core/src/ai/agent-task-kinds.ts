/** Kinds EVE — extensible au fil des outils proactifs (V1+). */
export const AGENT_TASK_KIND_SESSION_READINESS_SCAN = 'eve.session.readiness_scan';

export const AGENT_TASK_KINDS = [AGENT_TASK_KIND_SESSION_READINESS_SCAN] as const;
export type AgentTaskKind = (typeof AGENT_TASK_KINDS)[number];
