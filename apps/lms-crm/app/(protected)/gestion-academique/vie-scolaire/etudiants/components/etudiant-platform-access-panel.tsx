'use client';

import { User as Etudiant } from '@/app/models/user';
import { Badge } from '@repo/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { formatDateTime } from '@/lib/helpers';
import {
  lmsAccessBadgeVariant,
  lmsAccessLabel,
  lmsAccessShortLabel,
  type LmsAccessTier,
} from '@/lib/portal/lms-access-shared';
import { Monitor, Mail, Shield } from 'lucide-react';

const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  BLOCKED: 'Bloqué',
  PENDING: 'En attente',
  BANNED: 'Banni',
  ABSENT: 'Absent',
};

export function EtudiantPlatformAccessPanel({
  etudiant,
  lmsAccessTier,
  dossierLabel,
  compact = false,
}: {
  etudiant: Etudiant;
  lmsAccessTier: LmsAccessTier;
  dossierLabel?: string | null;
  compact?: boolean;
}) {
  const loginEmail = etudiant.proEmail?.trim() || '—';
  const personalEmail = etudiant.email?.trim() || '—';
  const tierVariant = lmsAccessBadgeVariant(lmsAccessTier);

  if (compact) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/15 p-3 space-y-2.5 text-2sm">
        <div className="flex items-center gap-2">
          <Monitor className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Accès plateforme
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={tierVariant} appearance="outline" className="text-[10px]">
            {lmsAccessShortLabel(lmsAccessTier)}
          </Badge>
          <Badge variant="secondary" appearance="light" className="text-[10px]">
            {USER_STATUS_LABELS[etudiant.status] ?? etudiant.status}
          </Badge>
        </div>
        <div className="space-y-1.5 text-xs">
          <div>
            <span className="text-muted-foreground">Connexion · </span>
            <span className="font-medium break-all">{loginEmail}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Perso · </span>
            <span className="break-all">{personalEmail}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="border-b border-border/50 py-4">
        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
          <Monitor className="size-4 text-primary" />
          Accès plateforme &amp; e-formation
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 p-4 sm:p-5 sm:grid-cols-2">
        <div className="space-y-3 sm:col-span-2">
          <Badge variant={tierVariant} appearance="outline" className="text-xs">
            {lmsAccessShortLabel(lmsAccessTier)}
          </Badge>
          <p className="text-xs leading-relaxed text-muted-foreground">{lmsAccessLabel(lmsAccessTier)}</p>
        </div>

        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
            <Mail className="size-3" />
            Email de connexion (pro)
          </p>
          <p className="text-sm font-medium break-all">{loginEmail}</p>
          <p className="text-[11px] text-muted-foreground">Utilisé pour NextAuth / espace e-formation</p>
        </div>

        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
            <Mail className="size-3" />
            Email personnel
          </p>
          <p className="text-sm font-medium break-all">{personalEmail}</p>
          <p className="text-[11px] text-muted-foreground">Contact, reset mot de passe, notifications</p>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Dernière connexion</p>
          <p className="text-sm font-medium">
            {etudiant.lastSignInAt ? formatDateTime(etudiant.lastSignInAt) : 'Jamais'}
          </p>
        </div>

        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
            <Shield className="size-3" />
            Compte &amp; dossier
          </p>
          <p className="text-sm font-medium">
            {USER_STATUS_LABELS[etudiant.status] ?? etudiant.status}
            {dossierLabel ? ` · ${dossierLabel}` : ''}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Rôle : {etudiant.role?.name ?? '—'}
            {etudiant.emailVerifiedAt ? ' · email vérifié' : ''}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
