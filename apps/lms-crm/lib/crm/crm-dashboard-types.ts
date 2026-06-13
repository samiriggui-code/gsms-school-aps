export type CrmDashboardStats = {
  candidaturesPending: number;
  sessionsUpcoming: number;
  traineesActive: number;
  collaboratorsActive: number;
  openTickets: number;
  leadsNew: number;
};

export type CrmDashboardAlert = {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
};

export type CrmDashboardHighlight = {
  id: string;
  label: string;
  value: string;
  href: string | null;
};

export type CrmDashboardPayload = {
  stats: CrmDashboardStats;
  alerts: CrmDashboardAlert[];
  highlights: CrmDashboardHighlight[];
  nextSession: {
    id: string;
    formationName: string;
    startDate: string | null;
    href: string;
  } | null;
};
