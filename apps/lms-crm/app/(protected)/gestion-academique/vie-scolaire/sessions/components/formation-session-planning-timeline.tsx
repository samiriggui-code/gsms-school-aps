'use client';

import { CalendarClock, ClipboardList, Flag, GraduationCap, MapPin, type LucideIcon } from 'lucide-react';
import type { FormationSessionApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/types/formation-session-api-row';

function formatIsoLong(iso: string | null): string {
  if (!iso) return 'Non renseigné';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });
}

type Milestone = { id: string; title: string; at: number; label: string; detail: string; icon: LucideIcon };

export function FormationSessionPlanningTimeline({ row }: { row: FormationSessionApiRow }) {
  const milestones: Milestone[] = [];

  const push = (m: Omit<Milestone, 'at'> & { iso: string | null }) => {
    if (!m.iso) return;
    const t = new Date(m.iso).getTime();
    if (Number.isNaN(t)) return;
    milestones.push({ ...m, at: t });
  };

  push({
    id: 'close',
    title: 'Clôture des inscriptions',
    iso: row.registrationClosesAt,
    label: formatIsoLong(row.registrationClosesAt),
    detail: 'Fin des dépôts / confirmations côté apprenants selon votre process.',
    icon: ClipboardList,
  });
  push({
    id: 'start',
    title: 'Entrée en formation',
    iso: row.startDate,
    label: formatIsoLong(row.startDate),
    detail: 'Début pédagogique prévu (à ajuster avec les créneaux internes).',
    icon: CalendarClock,
  });
  push({
    id: 'end',
    title: 'Fin de session',
    iso: row.endDate,
    label: formatIsoLong(row.endDate),
    detail: 'Fin de la période de formation sur ce créneau session.',
    icon: Flag,
  });
  push({
    id: 'exam',
    title: 'Examen / certification',
    iso: row.examDate,
    label: formatIsoLong(row.examDate),
    detail: 'Évaluation ou passage jury, si prévu pour cette session.',
    icon: GraduationCap,
  });

  milestones.sort((a, b) => a.at - b.at);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Planning de la session :</span> frise des jalons connus
          (inscriptions, début / fin, examen). Les horaires détaillés par demi-journée vivent dans vos outils
          d’organisation ou le planning opérationnel.
        </p>
      </div>
      <div className="flex flex-wrap items-start gap-2 text-sm">
        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div>
          <span className="text-muted-foreground">Lieu d’exécution : </span>
          <span className="font-medium text-foreground">{row.location?.trim() || '—'}</span>
        </div>
      </div>

      {milestones.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune date horodatée n’est encore renseignée pour cette session — complétez les champs dans
          l’édition de session.
        </p>
      ) : (
        <ol className="relative ms-2 border-s border-border ps-6">
          {milestones.map((m, i) => {
            const Icon = m.icon;
            return (
              <li key={m.id} className="relative pb-8 last:pb-0">
                <span className="-start-9 absolute flex size-7 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                  <Icon className="size-3.5 text-primary" aria-hidden />
                </span>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{m.title}</p>
                <p className="text-sm font-semibold text-foreground">{m.label}</p>
                <p className="mt-1 max-w-prose text-xs text-muted-foreground">{m.detail}</p>
                {i < milestones.length - 1 ? (
                  <span className="sr-only">puis étape suivante</span>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}

      <p className="text-xs text-muted-foreground">
        Libellé vitrine affiché catalogue :{' '}
        <span className="font-medium text-foreground">{row.dateDisplayLabel || '—'}</span>
      </p>
    </div>
  );
}
