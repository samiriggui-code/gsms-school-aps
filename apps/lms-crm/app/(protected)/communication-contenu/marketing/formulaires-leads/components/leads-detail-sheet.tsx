'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { EtudiantDetailsSheet } from './leads-details-sheet';
import type { User as Etudiant } from '@/app/models/user';
import type { LeadsHubListRow } from './leads-hub-list';

export type LeadsDetailSheetInitialTab = 'overview' | 'pipeline' | 'documents' | 'activity' | 'settings';

export function LeadsDetailSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hubUserId: string | null;
  initialCandidatureId?: string | null;
  initialTab?: LeadsDetailSheetInitialTab;
  leadRow?: LeadsHubListRow | null;
}) {
  const fallbackLeadAsEtudiant: Etudiant | null = useMemo(
    () =>
      props.leadRow
        ? {
            id: props.leadRow.raw.candidature?.userId ?? props.leadRow.raw.id,
            email: props.leadRow.raw.email,
            name:
              `${props.leadRow.raw.firstName} ${props.leadRow.raw.lastName}`.trim() ||
              props.leadRow.raw.email,
            firstName: props.leadRow.raw.firstName,
            lastName: props.leadRow.raw.lastName,
            phone: props.leadRow.raw.phone ?? null,
            jobFunction: props.leadRow.raw.formation?.name ?? null,
            roleId: 'lead',
            status: 'ACTIVE',
            createdAt: new Date(props.leadRow.raw.createdAt),
            updatedAt: new Date(props.leadRow.raw.updatedAt),
            isTrashed: false,
            isProtected: false,
            role: {
              id: 'lead',
              slug: 'candidat',
              name: 'Lead',
              isTrashed: false,
              createdAt: new Date(props.leadRow.raw.createdAt),
              isProtected: false,
              isDefault: false,
            },
          }
        : null,
    [props.leadRow],
  );

  const { data } = useQuery({
    queryKey: ['formulaires-leads', 'etudiant-detail', props.hubUserId ?? ''],
    queryFn: async () => {
      if (!props.hubUserId) return null;
      const res = await apiFetch(`/api/sections/gestion-ressources/rh/etudiants/${props.hubUserId}`);
      if (!res.ok) return null;
      return (await res.json()) as Etudiant;
    },
    enabled: props.open && !!props.hubUserId && !!props.leadRow?.raw.candidature?.userId,
  });

  const isFallbackLead = !data && !!fallbackLeadAsEtudiant;

  return (
    <EtudiantDetailsSheet
      open={props.open}
      onOpenChange={props.onOpenChange}
      Etudiant={data ?? fallbackLeadAsEtudiant}
      leadRow={props.leadRow ?? null}
      disableAutoFetch={isFallbackLead}
    />
  );
}
