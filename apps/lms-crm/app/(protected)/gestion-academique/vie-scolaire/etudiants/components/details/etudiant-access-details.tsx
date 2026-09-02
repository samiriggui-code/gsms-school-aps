'use client';

import { Card, CardContent } from '@repo/ui/card';
import { User as Etudiant } from '@/app/models/user';

export function EtudiantAccessDetails({ Etudiant }: { Etudiant: Etudiant }) {
  const item = [
    {
      label: 'Identifiant',
      info: Etudiant.id.substring(0, 8),
    },
    {
      label: 'Catégorie',
      info: Etudiant.userCategory,
    },
    {
      label: 'Fonction',
      info: Etudiant.jobFunction || '—',
    },
    {
      label: 'Permissions',
      info: `Héritées du rôle ${Etudiant.role?.name || 'Standard'}`,
    },
  ];

  return (
    <Card className="bg-accent/70 rounded-md shadow-none h-full flex flex-col min-w-0">
      <CardContent className="p-0 flex flex-col h-full min-w-0">
        <h3 className="text-sm font-medium text-foreground py-2.5 ps-2">Détails de l&apos;accès</h3>
        <div className="bg-background rounded-md m-1 mt-0 border border-input py-4 px-3 sm:py-6 sm:px-3.5 space-y-4 sm:space-y-5 h-full min-w-0">
          {item.map((row, index) => (
            <div key={index} className="flex flex-col gap-1 sm:flex-row sm:gap-2 lg:gap-10 min-w-0">
              <span className="sm:basis-1/4 text-xs font-normal text-secondary-foreground/80 leading-6 shrink-0">
                {row.label}
              </span>
              <span className="sm:basis-2/4 text-2sm font-semibold text-foreground leading-6 break-words min-w-0">
                {row.info}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
