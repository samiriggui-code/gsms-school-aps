'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { GraduationCap, Calendar } from 'lucide-react';

interface Training {
  title: string;
  type: string;
  date: string;
  participants: number;
  status: 'completed' | 'ongoing' | 'planned';
}

const trainings: Training[] = [
  {
    title: 'Sécurité Incendie SSI',
    type: 'Obligatoire',
    date: '15 Jan 2024',
    participants: 23,
    status: 'completed'
  },
  {
    title: 'Gestion de Conflits',
    type: 'Développement',
    date: '22 Jan 2024',
    participants: 18,
    status: 'ongoing'
  },
  {
    title: 'Premiers Secours PSC1',
    type: 'Obligatoire',
    date: '28 Jan 2024',
    participants: 15,
    status: 'ongoing'
  },
  {
    title: 'Cybersécurité Niveau 1',
    type: 'Spécialisée',
    date: '05 Fév 2024',
    participants: 12,
    status: 'planned'
  },
  {
    title: 'Techniques Intervention',
    type: 'Spécialisée',
    date: '12 Fév 2024',
    participants: 20,
    status: 'planned'
  },
  {
    title: 'Management Équipe',
    type: 'Développement',
    date: '19 Fév 2024',
    participants: 8,
    status: 'planned'
  }
];

export function PlansComparisonTable() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Formations Planifiées</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trainings.map((training, index) => (
            <div 
              key={index} 
              className="p-4 rounded-lg border bg-accent/30 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                    <GraduationCap className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{training.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{training.type}</p>
                  </div>
                </div>
                <Badge 
                  variant={
                    training.status === 'completed' ? 'primary' : 
                    training.status === 'ongoing' ? 'secondary' : 
                    'outline'
                  }
                  className="text-xs"
                >
                  {training.status === 'completed' ? 'Terminée' : 
                   training.status === 'ongoing' ? 'En cours' : 
                   'Planifiée'}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{training.date}</span>
                </div>
                <span>{training.participants} participants</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}