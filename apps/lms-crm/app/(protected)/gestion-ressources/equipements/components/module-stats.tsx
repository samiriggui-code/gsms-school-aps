'use client';

import {
  ModuleLandingStatGradientCard,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { Package, TrendingUp, Calendar, CreditCard } from 'lucide-react';

type ModuleStat = {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  trend: string;
  tone: MetricStatTone;
};

export function ModuleStats() {
  const stats: ModuleStat[] = [
    {
      title: 'Plan Actuel',
      value: 'N/A',
      icon: Package,
      description: '-',
      trend: '0 niveaux',
      tone: 'primary',
    },
    {
      title: 'Utilisateurs',
      value: '0 / 0',
      icon: TrendingUp,
      description: '0% utilisés',
      trend: '0 disponibles',
      tone: 'success',
    },
    {
      title: 'Prochain Renouvellement',
      value: 'N/A',
      icon: Calendar,
      description: '-',
      trend: 'Statique',
      tone: 'warning',
    },
    {
      title: 'Montant Mensuel',
      value: '0€',
      icon: CreditCard,
      description: 'HT',
      trend: '0€ TTC',
      tone: 'info',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-4 gap-5">
      {stats.map((stat) => (
        <ModuleLandingStatGradientCard
          key={stat.title}
          icon={stat.icon}
          tone={stat.tone}
          label={stat.title}
          value={stat.value}
          detail={[stat.description, stat.trend].filter(Boolean).join(' · ')}
          trend="neutral"
        />
      ))}
    </div>
  );
}
