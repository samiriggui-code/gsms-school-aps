'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { UserPlus, GraduationCap, CreditCard, AlertCircle, Clock } from 'lucide-react';

interface Activity {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'info';
}

const activities: Activity[] = [
  {
    icon: UserPlus,
    title: 'Nouveau Collaborateur',
    description: '12 agents recrutés ce mois',
    time: 'Il y a 1j',
    status: 'success'
  },
  {
    icon: AlertCircle,
    title: 'Cartes à Renouveler',
    description: '8 cartes professionnelles expirent bientôt',
    time: 'Il y a 2j',
    status: 'warning'
  },
  {
    icon: GraduationCap,
    title: 'Formation Complétée',
    description: 'Module Sécurité Incendie - 23 participants',
    time: 'Il y a 3j',
    status: 'success'
  },
  {
    icon: CreditCard,
    title: 'Paie Traitée',
    description: 'Salaires de janvier versés (247 employés)',
    time: 'Il y a 1 sem',
    status: 'info'
  }
];

export function RecentSubscriptionActivities() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Activités RH</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
            <div className={`p-2 rounded-lg ${
              activity.status === 'success' ? 'bg-green-100 dark:bg-green-950/30' :
              activity.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-950/30' :
              'bg-indigo-100 dark:bg-indigo-950/30'
            }`}>
              <activity.icon className={`w-5 h-5 ${
                activity.status === 'success' ? 'text-green-600' :
                activity.status === 'warning' ? 'text-yellow-600' :
                'text-indigo-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {activity.time}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
