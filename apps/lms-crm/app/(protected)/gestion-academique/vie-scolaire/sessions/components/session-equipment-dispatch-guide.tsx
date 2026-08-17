'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import {
  EquipmentDispatchGuidePanel,
  type EquipmentDispatchGuideData,
} from '@/components/equipment/equipment-dispatch-guide-panel';

export function SessionEquipmentDispatchGuide({
  formationId,
  venueRoomId,
  traineesMax,
  sessionKind,
  startAt,
  endAt,
  selectedEquipmentIds,
  examVenueRoomId,
  hasExamDate,
}: {
  formationId: string | null | undefined;
  venueRoomId?: string | null;
  traineesMax?: number | null;
  sessionKind?: string | null;
  startAt?: Date | null;
  endAt?: Date | null;
  selectedEquipmentIds?: string[];
  examVenueRoomId?: string | null;
  hasExamDate?: boolean;
}) {
  const enabled = Boolean(formationId?.trim());

  const { data, isLoading } = useQuery({
    queryKey: [
      'session-dispatch-guide',
      formationId,
      venueRoomId,
      traineesMax,
      sessionKind,
      startAt?.toISOString(),
      endAt?.toISOString(),
      selectedEquipmentIds?.join(','),
      examVenueRoomId,
      hasExamDate,
    ],
    enabled,
    queryFn: async () => {
      const params = new URLSearchParams({ formationId: formationId! });
      if (venueRoomId) params.set('venueRoomId', venueRoomId);
      if (traineesMax) params.set('traineesMax', String(traineesMax));
      if (sessionKind) params.set('sessionKind', sessionKind);
      if (hasExamDate) params.set('hasExamDate', '1');
      if (examVenueRoomId) params.set('examVenueRoomId', examVenueRoomId);
      if (startAt) params.set('startAt', startAt.toISOString());
      if (endAt) params.set('endAt', endAt.toISOString());
      if (selectedEquipmentIds?.length) {
        params.set('selectedEquipmentIds', selectedEquipmentIds.join(','));
      }
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/sessions/dispatch-guide?${params}`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('Guide indisponible');
      return unwrapSectionApiData<EquipmentDispatchGuideData & { periodLabel?: string; helpText?: string }>(json)!;
    },
  });

  if (!enabled) return null;

  return (
    <EquipmentDispatchGuidePanel
      title="Matériel mobile (session + examen)"
      data={data}
      isLoading={isLoading}
      compact
    />
  );
}
