'use client';

import Link from 'next/link';
import { UserCircle } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { portalMuted } from '@/components/portal/layout/portal-ui';
import type { WorkspaceAccountKind } from '@/config/workspace-settings.config';

const PROFILE_HINT: Record<WorkspaceAccountKind, string> = {
  'crm-user':
    'Fiche publique et données RH selon votre rôle (collaborateur, manager…). Les modifications sensibles passent par les RH.',
  formateur:
    'Fiche formateur en lecture seule dans l’espace dédié. Pièces, agréments et contrat : contactez l’administration.',
  stagiaire:
    'Coordonnées et pièces de votre dossier candidat / stagiaire. Certaines informations sont modifiables depuis le profil.',
};

export function AccountProfileLinkSection({
  kind,
  profilPath,
  profilLinkLabel,
}: {
  kind: WorkspaceAccountKind;
  profilPath: string;
  profilLinkLabel: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Fiche profil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className={`text-sm ${portalMuted}`}>{PROFILE_HINT[kind]}</p>
        <Button variant="secondary" size="sm" asChild>
          <Link href={profilPath}>
            <UserCircle className="me-2 size-4" />
            {profilLinkLabel}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
