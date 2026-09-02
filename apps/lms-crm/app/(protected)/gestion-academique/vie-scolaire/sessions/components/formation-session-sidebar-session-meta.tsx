'use client';

import { Separator } from '@repo/ui/separator';
import type { FormationSessionApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/types/formation-session-api-row';

function formatSessionDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

/** Colonne gauche : uniquement les dates session (début / fin / clôture / examen), style `Upload`. */
export function FormationSessionSidebarSessionMeta({ row }: { row: FormationSessionApiRow }) {
  const rows: { label: string; value: string }[] = [
    { label: 'Début', value: formatSessionDateTime(row.startDate) },
    { label: 'Fin', value: formatSessionDateTime(row.endDate) },
    { label: 'Salle', value: row.venueRoom?.name?.trim() || '—' },
    { label: 'Clôture inscr.', value: formatSessionDateTime(row.registrationClosesAt) },
    { label: 'Examen', value: formatSessionDateTime(row.examDate) },
  ];

  return (
    <div className="space-y-0">
      {rows.map((item, index) => (
        <div key={item.label}>
          <div className="flex items-start justify-between gap-2 py-1.5">
            <span className="shrink-0 pt-0.5 text-[10px] font-medium uppercase tracking-tight text-muted-foreground/70">
              {item.label}
            </span>
            <span className="min-w-0 flex-1 break-words text-end text-[11px] font-medium leading-snug text-foreground">
              {item.value}
            </span>
          </div>
          {index < rows.length - 1 ? <Separator className="opacity-40" /> : null}
        </div>
      ))}
    </div>
  );
}
