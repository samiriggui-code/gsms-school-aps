'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ExamensParcoursStats() {
  const { data } = useQuery({
    queryKey: ['vie-scolaire', 'examens', 'stats'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/examens/stats');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Stats indisponibles');
      return body.data as {
        pendingExams: number;
        passedExams: number;
        attestations: number;
        completed: number;
      };
    },
  });

  const stats = [
    { label: 'Examens en attente', value: data?.pendingExams ?? '—' },
    { label: 'Examens réussis', value: data?.passedExams ?? '—' },
    { label: 'Attestations', value: data?.attestations ?? '—' },
    { label: 'Dossiers terminés', value: data?.completed ?? '—' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{s.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
