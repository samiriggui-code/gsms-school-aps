'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User as Etudiant } from '@/app/models/user';
import {
  lmsAccessBadgeVariant,
  lmsAccessShortLabel,
  type LmsAccessTier,
} from '@/lib/portal/lms-access-shared';
import { formatDateTime } from '@/lib/helpers';
import { cn } from '@/lib/utils';

export function EtudiantAccessStats({
  Etudiant,
  lmsAccessTier = 'none',
}: {
  Etudiant: Etudiant;
  lmsAccessTier?: LmsAccessTier;
}) {
  const tierVariant = lmsAccessBadgeVariant(lmsAccessTier);
  const items = [
    {
      total: Etudiant.role?.name || 'Aucun rôle',
      label: 'Rôle principal assigné',
      badge: 'Actif',
    },
    {
      total: lmsAccessShortLabel(lmsAccessTier),
      label: 'Accès e-formation',
      badge: null,
      tierVariant,
    },
    {
      total: Etudiant.proEmail?.trim() || '—',
      label: 'Login plateforme',
      badge: null,
      mono: true,
    },
    {
      total: Etudiant.lastSignInAt ? formatDateTime(Etudiant.lastSignInAt) : 'Jamais',
      label: 'Dernière connexion',
      badge: Etudiant.emailVerifiedAt ? 'Email vérifié' : null,
    },
  ];

  return (
    <Card className="mb-5 rounded-md bg-accent/70 p-1">
      <CardContent className="rounded-md border border-border bg-background p-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {items.map((item, index) => (
            <div
              key={index}
              className={cn(
                'flex w-full min-w-0 flex-col gap-2 border-border px-3 py-3 sm:px-4.5 sm:py-3',
                index > 0 ? 'border-t sm:border-t-0 sm:border-s' : '',
                index === 0 ? 'sm:flex-[2]' : 'sm:flex-1',
              )}
            >
              <div className="flex flex-wrap items-center gap-1">
                <span
                  className={`font-semibold text-foreground ${index === 0 ? 'text-xl leading-6' : 'text-sm leading-5'} ${item.mono ? 'truncate font-mono text-xs' : ''}`}
                  title={item.mono ? item.total : undefined}
                >
                  {item.total}
                </span>
                {item.badge ? (
                  <Badge variant="success" appearance="light" size="sm">
                    {item.badge}
                  </Badge>
                ) : null}
                {item.tierVariant ? (
                  <Badge variant={item.tierVariant} appearance="outline" size="sm">
                    LMS
                  </Badge>
                ) : null}
              </div>
              <span className="text-xs font-normal text-secondary-foreground/70">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
