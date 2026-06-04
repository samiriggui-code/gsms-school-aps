'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  ClipboardList,
  GraduationCap,
  BookMarked,
  FileCheck,
} from 'lucide-react';

import { User as Etudiant } from '@/app/models/user';

/** Compteurs issus du `GET utilisateur` (jointure Prisma `_count`). */
export function EtudiantOverviewStats({ Etudiant }: { Etudiant: Etudiant }) {
  const c = Etudiant._count;
  const items = [
    {
      total: String(c?.candidatures ?? 0),
      label: 'Dossiers candidature',
      foot: 'Candidatures catalogue (CRM)',
      icon: <ClipboardList className="size-3.5" />,
    },
    {
      total: String(c?.formationSessionParticipants ?? 0),
      label: 'Inscriptions sessions',
      foot: 'Inscriptions aux sessions de formation',
      icon: <GraduationCap className="size-3.5" />,
    },
    {
      total: String(c?.enrollments ?? 0),
      label: 'Inscriptions LMS',
      foot: 'Inscriptions aux parcours LMS',
      icon: <BookMarked className="size-3.5" />,
    },
    {
      total: String(c?.submissions ?? 0),
      label: 'Devoirs remis',
      foot: 'Devoirs rendus dans le LMS',
      icon: <FileCheck className="size-3.5" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
      {items.map((item, index) => (
        <Card
          key={index}
          className="shadow-none border border-border/50 bg-background group hover:border-border transition-all duration-300"
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1.5 min-w-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {item.label}
                </span>
                <span className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                  {item.total}
                </span>
              </div>
              <div className="p-2 rounded-lg border border-border/50 bg-background text-foreground/70 shrink-0">
                {item.icon}
              </div>
            </div>

            <p className="text-[11px] font-medium text-muted-foreground mt-auto pt-3 border-t border-border/40 leading-snug">
              {item.foot}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

