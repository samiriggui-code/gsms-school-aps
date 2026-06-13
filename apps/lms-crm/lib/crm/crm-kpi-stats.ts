import { CalendarDays, ClipboardList, LifeBuoy, Users } from 'lucide-react';
import type { ModuleKpiStatItem } from '@/components/common/module-kpi-stats-row';
import type { CrmDashboardStats } from '@/lib/crm/crm-dashboard-types';

export function crmDashboardKpis(stats: CrmDashboardStats): ModuleKpiStatItem[] {
  return [
    {
      label: 'Candidatures en attente',
      value: stats.candidaturesPending,
      subtitle: 'À instruire',
      icon: ClipboardList,
    },
    {
      label: 'Sessions à venir',
      value: stats.sessionsUpcoming,
      subtitle: 'Planning',
      icon: CalendarDays,
    },
    {
      label: 'Stagiaires actifs',
      value: stats.traineesActive,
      subtitle: 'Parcours',
      icon: Users,
    },
    {
      label: 'Tickets ouverts',
      value: stats.openTickets,
      subtitle: 'Support',
      icon: LifeBuoy,
    },
  ];
}
