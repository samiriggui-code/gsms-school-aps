'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import {
  EquipmentDispatchGuidePanel,
  type EquipmentDispatchGuideData,
} from '@/components/equipment/equipment-dispatch-guide-panel';

export function RoomEquipmentDispatchGuide({
  roomId,
  onAssignCategory,
}: {
  roomId: string;
  onAssignCategory?: (catalogKey: string, catalogLabel: string) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['room-dispatch-guide', roomId],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/gestion-ressources/equipements/salles/${encodeURIComponent(roomId)}/dispatch-guide`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('Guide indisponible');
      return unwrapSectionApiData<EquipmentDispatchGuideData & { profileLabel?: string; helpText?: string }>(json)!;
    },
  });

  return (
    <EquipmentDispatchGuidePanel
      title="Mobilier fixe recommandé pour cette salle"
      data={data}
      isLoading={isLoading}
      onAssignCategory={onAssignCategory}
    />
  );
}
