'use client';

import { SuiviSessionStagiairesDatagrid } from './suivi-session-stagiaires-datagrid';

export function SuiviStagiairesList({ sessionId }: { sessionId: string | null }) {
  return <SuiviSessionStagiairesDatagrid sessionId={sessionId} variant="page" />;
}
