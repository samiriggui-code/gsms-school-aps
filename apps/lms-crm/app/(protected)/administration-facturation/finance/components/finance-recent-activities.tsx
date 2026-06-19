'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, UserMinus, Calendar, Award } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'recruitment',
    title: 'Nouveau collaborateur',
    description: 'Jean Dupont a rejoint l\'équipe technique.',
    time: 'Il y a 2 heures',
    icon: UserPlus,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 2,
    type: 'absence',
    title: 'Demande d\'absence',
    description: 'Marie Martin a déposé une demande de congés.',
    time: 'Il y a 4 heures',
    icon: Calendar,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
  },
  {
    id: 3,
    type: 'training',
    title: 'Formation terminée',
    description: 'L\'équipe de nuit a validé la formation incendie.',
    time: 'Hier',
    icon: Award,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    id: 4,
    type: 'departure',
    title: 'Fin de contrat',
    description: 'Le contrat de Thomas Leroy se termine le 31/01.',
    time: 'Hier',
    icon: UserMinus,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
];

export function FinanceRecentActivities() {
  return (
    <Card className="h-full border-dashed">
      <CardHeader className="border-b border-dashed">
        <CardTitle className="text-base font-bold uppercase text-foreground">Activités Récentes</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-4 relative">
              <div className={`mt-1 p-2 rounded-lg ${activity.bg} shrink-0`}>
                <activity.icon className={`w-4 h-4 ${activity.color}`} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-foreground">{activity.title}</span>
                <p className="text-2sm text-muted-foreground leading-tight">{activity.description}</p>
                <span className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
