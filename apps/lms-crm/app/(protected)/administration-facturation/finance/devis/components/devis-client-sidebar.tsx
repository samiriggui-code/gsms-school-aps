'use client';

import { Building2, GraduationCap, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinanceDevisDetail } from '../hooks/use-finance-devis-detail-query';

function strSnap(s: Record<string, unknown>, key: string): string | undefined {
  const v = s[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

export function DevisClientSidebar({ detail }: { detail: FinanceDevisDetail }) {
  const snapshot = (detail.clientSnapshot ?? {}) as Record<string, unknown>;
  const company =
    strSnap(snapshot, 'company') ??
    (detail.lead ? `${detail.lead.firstName} ${detail.lead.lastName}`.trim() : 'Client non renseigné');
  const email = strSnap(snapshot, 'email') ?? detail.lead?.email;
  const phone = strSnap(snapshot, 'phone') ?? detail.lead?.phone;
  const address = [
    strSnap(snapshot, 'address'),
    [strSnap(snapshot, 'postalCode'), strSnap(snapshot, 'city')].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card className="shadow-none border border-border/60">
      <CardHeader className="py-3 px-4 pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Building2 className="size-3.5" />
          Destinataire
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3 text-sm">
        <div>
          <p className="font-semibold text-foreground leading-snug">{company}</p>
          {detail.lead ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <UserRound className="size-3 shrink-0" />
              {detail.lead.firstName} {detail.lead.lastName}
            </p>
          ) : null}
        </div>
        {email ? (
          <p className="text-xs flex items-start gap-2 text-muted-foreground break-all">
            <Mail className="size-3.5 shrink-0 mt-0.5" />
            {email}
          </p>
        ) : null}
        {phone ? (
          <p className="text-xs flex items-center gap-2 text-muted-foreground">
            <Phone className="size-3.5 shrink-0" />
            {phone}
          </p>
        ) : null}
        {address ? (
          <p className="text-xs flex items-start gap-2 text-muted-foreground">
            <MapPin className="size-3.5 shrink-0 mt-0.5" />
            {address}
          </p>
        ) : null}
        {detail.formation ? (
          <div className="pt-2 border-t border-dashed border-border/60">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
              <GraduationCap className="size-3" />
              Formation proposée
            </p>
            <p className="text-xs font-medium text-foreground leading-snug">{detail.formation.name}</p>
          </div>
        ) : (
          <p className="text-xs text-amber-700 dark:text-amber-400 pt-2 border-t border-dashed">
            Aucune formation liée — ajoutez des lignes depuis le catalogue ou liez un lead avec formation.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
