'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  ClipboardList,
  GraduationCap,
  BookMarked,
  FileCheck,
  Mail,
  ScrollText,
} from 'lucide-react';

import { User as Etudiant } from '@/app/models/user';
import type { LeadsHubListRow } from '../leads-hub-list';

/** Compteurs issus du `GET utilisateur` (jointure Prisma `_count`). */
export function EtudiantOverviewStats({
  Etudiant,
  leadRow,
}: {
  Etudiant: Etudiant;
  leadRow?: LeadsHubListRow | null;
}) {
  if (leadRow) {
    const lines = (leadRow.raw.notes ?? '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const parsed = Object.fromEntries(
      lines
        .filter((l) => l.includes(':'))
        .map((l) => {
          const i = l.indexOf(':');
          return [l.slice(0, i).trim().toLowerCase(), l.slice(i + 1).trim()];
        }),
    );
    const noteFormation =
      parsed['formation visée'] ??
      parsed['formation demandée'] ??
      parsed['libellé'] ??
      null;
    const desiredFormation = leadRow.raw.formation?.name ?? noteFormation;
    const hasCandidature = Boolean(leadRow.raw.candidature);
    const hasFormation = Boolean(desiredFormation && String(desiredFormation).trim());
    const hasPhone = Boolean(leadRow.raw.phone);
    const hasEmail = Boolean(leadRow.raw.email?.trim());
    const hasNotes = Boolean(leadRow.raw.notes?.trim());
    const items = [
      {
        total: hasCandidature ? '1' : '0',
        label: 'Dossier candidat',
        foot: hasCandidature ? 'Lead déjà converti' : 'Lead non converti',
        icon: <ClipboardList className="size-3.5" />,
      },
      {
        total: hasFormation ? '1' : '0',
        label: 'Formation ciblée',
        foot: desiredFormation ?? 'Non renseignée',
        icon: <GraduationCap className="size-3.5" />,
      },
      {
        total: hasPhone ? '1' : '0',
        label: 'Contact téléphonique',
        foot: leadRow.raw.phone ?? 'Téléphone manquant',
        icon: <BookMarked className="size-3.5" />,
      },
      {
        total: hasNotes ? '1' : '0',
        label: 'Données formulaire',
        foot: hasNotes ? 'Contexte disponible' : 'Aucune précision fournie',
        icon: <FileCheck className="size-3.5" />,
      },
      {
        total: hasEmail ? '1' : '0',
        label: 'E-mail renseigné',
        foot: leadRow.raw.email?.trim() ?? 'E-mail manquant',
        icon: <Mail className="size-3.5" />,
      },
    ];

    return (
      <div className="mb-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
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
    {
      total: String(c?.systemLog ?? 0),
      label: 'Événements journal',
      foot: 'Traces système liées au compte',
      icon: <ScrollText className="size-3.5" />,
    },
  ];

  return (
    <div className="mb-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
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

