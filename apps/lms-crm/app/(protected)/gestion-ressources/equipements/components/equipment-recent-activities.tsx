'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Wrench, ArrowLeftRight, ShieldCheck } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'acquisition',
    title: 'Nouvel équipement',
    description: 'Une nouvelle station de travail HP Z4 a été ajoutée.',
    time: 'Il y a 2 heures',
    icon: Package,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 2,
    type: 'maintenance',
    title: 'Maintenance effectuée',
    description: 'Le projecteur Salle A a été révisé avec succès.',
    time: 'Il y a 4 heures',
    icon: Wrench,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    id: 3,
    type: 'movement',
    title: 'Mouvement de stock',
    description: '5 tablettes ont été transférées vers le site Lyon.',
    time: 'Hier',
    icon: ArrowLeftRight,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    id: 4,
    type: 'check',
    title: 'Contrôle conformité',
    description: 'Inspection annuelle du parc terminée.',
    time: 'Hier',
    icon: ShieldCheck,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
];

export function EquipmentRecentActivities() {
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
