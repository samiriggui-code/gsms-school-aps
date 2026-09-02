'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import type { FormationCatalogApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/types/catalog-api';
import {
  FORMATION_PARCOURS_LABELS,
  FORMATION_TRACK_LABELS,
} from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';
import {
  formationsCatalogQueryKey,
  formationsCatalogQueryRoot,
} from '@/app/(protected)/gestion-academique/vie-scolaire/formations/hooks/use-formations-catalog-query';
import { buildFormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';
import type { FormationSessionApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/types/formation-session-api-row';
import { sessionsListQueryKey } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/sessions-manager';
import { indexVenueRoomConflictsForRange } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/lib/session-room-availability';
import { sessionKindDerivedFromFormationParcours } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/lib/session-parcours-exam';

const formateursQueryKey = ['gestion-academique', 'vie-scolaire', 'sessions', 'formateurs'] as const;
const equipmentPickQueryKey = ['gestion-academique', 'vie-scolaire', 'sessions', 'equipment-pick'] as const;
const venueRoomsQueryKey = ['gestion-academique', 'vie-scolaire', 'sessions', 'venue-rooms'] as const;

type VenueRoomOption = {
  id: string;
  name: string;
  shortCode?: string | null;
};

/** Clé distincte de `sessionsListQueryKey` : le manager met en cache `{ items }`, pas un tableau brut. */
const sessionsForEquipmentPickQueryKey = [...sessionsListQueryKey, 'equipment-pick'] as const;

const EMPTY_CATALOG_ITEMS: FormationCatalogApiRow[] = [];

export type EquipmentPickInventoryRow = {
  id: string;
  label: string;
  serialNumber: string;
  status: string;
};
export const EMPTY_EQUIPMENT_INVENTORY: EquipmentPickInventoryRow[] = [];

const EMPTY_VENUE_ROOM_PICK_META = new Map<
  string,
  { occupied: boolean; conflictLabel: string | null }
>();

const formSchema = z
  .object({
    formationId: z.string().uuid({ message: 'Choisissez une formation catalogue active.' }),
    dateDisplayLabel: z.string().min(1, 'Libellé dates obligatoire.'),
    location: z.string().min(1, 'Lieu obligatoire.'),
    startLocal: z.string(),
    endLocal: z.string(),
    registrationClosesLocal: z.string(),
    examLocal: z.string(),
    examVenueRoomId: z.string(),
    traineesMin: z.string(),
    traineesMax: z.string(),
    trainerUserId: z.string(),
    venueRoomId: z.string(),
  })
  .superRefine((data, ctx) => {
    const parsePos = (s: string, path: 'traineesMin' | 'traineesMax') => {
      const t = s.trim();
      if (!t) return null as number | null;
      const n = Number(t);
      if (!Number.isInteger(n) || n < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Entier ≥ 1 ou laisser vide.',
          path: [path],
        });
        return null;
      }
      return n;
    };
    const min = parsePos(data.traineesMin, 'traineesMin');
    const max = parsePos(data.traineesMax, 'traineesMax');
    if (min != null && max != null && min > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le minimum ne peut pas dépasser le maximum.',
        path: ['traineesMax'],
      });
    }
  });

export type FormationSessionAddSheetValues = z.infer<typeof formSchema>;

function isoOrNull(dtLocal: string): string | null {
  if (!dtLocal?.trim()) return null;
  const d = new Date(dtLocal);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function parseOptionalTrainees(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function buildSessionExtrasPayload(
  values: FormationSessionAddSheetValues,
  equipmentIds: Set<string>,
  examEquipmentIds: Set<string>,
) {
  const traineesMin = parseOptionalTrainees(values.traineesMin);
  const traineesMax = parseOptionalTrainees(values.traineesMax);
  if (values.traineesMin.trim() && traineesMin === null) {
    throw new Error('Effectif minimum : nombre entier positif ou vide.');
  }
  if (values.traineesMax.trim() && traineesMax === null) {
    throw new Error('Effectif maximum : nombre entier positif ou vide.');
  }
  if (traineesMin != null && traineesMax != null && traineesMin > traineesMax) {
    throw new Error("L'effectif minimum dépasse le maximum.");
  }
  const trainer = values.trainerUserId.trim();
  const room = values.venueRoomId.trim();
  const examRoom = values.examVenueRoomId.trim();
  return {
    registrationClosesAt: isoOrNull(values.registrationClosesLocal),
    examDate: isoOrNull(values.examLocal),
    examVenueRoomId: examRoom ? examRoom : null,
    traineesMin,
    traineesMax,
    trainerUserId: trainer ? trainer : null,
    venueRoomId: room ? room : null,
    reservedEquipmentIds: Array.from(equipmentIds),
    examReservedEquipmentIds: Array.from(examEquipmentIds),
  };
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatEffectifFourchette(row: FormationCatalogApiRow | null): string {
  if (!row) return '—';
  const rawMin = row.traineesMin;
  const rawMax = row.traineesMax;
  if (rawMin == null || rawMax == null) return '—';
  const nMin = Number(rawMin);
  const nMax = Number(rawMax);
  if (!Number.isFinite(nMin) || !Number.isFinite(nMax)) return '—';
  if (nMin < 1 || nMax < 1) return '—';
  const lo = Math.min(nMin, nMax);
  const hi = Math.max(nMin, nMax);
  return `${lo}-${hi}`;
}

const EMPTY_FORM_VALUES: FormationSessionAddSheetValues = {
  formationId: '',
  dateDisplayLabel: '',
  location: '',
  startLocal: '',
  endLocal: '',
  registrationClosesLocal: '',
  examLocal: '',
  examVenueRoomId: '',
  traineesMin: '',
  traineesMax: '',
  trainerUserId: '',
  venueRoomId: '',
};

type UseFormationSessionAddSheetArgs = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: FormationSessionApiRow | null;
};

export function useFormationSessionAddSheet({
  open,
  onOpenChange,
  draft,
}: UseFormationSessionAddSheetArgs) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const editingId = draft?.id ?? null;
  const [activeTab, setActiveTab] = useState('overview');
  const [participantIds, setParticipantIds] = useState<Set<string>>(new Set());
  const [equipmentIds, setEquipmentIds] = useState<Set<string>>(new Set());
  const [examEquipmentIds, setExamEquipmentIds] = useState<Set<string>>(new Set());

  const form = useForm<FormationSessionAddSheetValues>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY_FORM_VALUES,
    mode: 'onChange',
  });

  const formationId = form.watch('formationId');

  const catalogQuery = useQuery({
    queryKey: formationsCatalogQueryKey('visible'),
    queryFn: async (): Promise<{ items: FormationCatalogApiRow[] }> => {
      const qs = new URLSearchParams({ scope: 'visible' });
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/formations?${qs.toString()}`,
      );
      if (!res.ok) throw new Error('Catalogue indisponible.');
      const j = await res.json();
      if (!j?.success || !Array.isArray(j?.data?.items)) throw new Error('Réponse catalogue invalide.');
      return { items: j.data.items };
    },
    staleTime: 60_000,
    enabled: open,
  });

  const elevesIncludeUserIds = useMemo(
    () => (draft?.participants ?? []).map((p) => p.userId).filter(Boolean),
    [draft?.id, draft?.participants],
  );

  const elevesQuery = useQuery({
    queryKey: [
      'gestion-academique',
      'vie-scolaire',
      'sessions',
      'eleves',
      formationId,
      elevesIncludeUserIds.join(','),
    ],
    queryFn: async () => {
      const qs = new URLSearchParams({ formationId: formationId.trim() });
      if (elevesIncludeUserIds.length > 0) {
        qs.set('includeUserIds', elevesIncludeUserIds.join(','));
      }
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/sessions/eleves?${qs.toString()}`,
      );
      if (!res.ok) throw new Error('Élèves indisponibles.');
      const j = await res.json();
      if (!j?.success || !Array.isArray(j?.data?.items)) throw new Error('Réponse élèves invalide.');
      return j.data.items as {
        id: string;
        name: string | null;
        email: string;
        avatar?: string | null;
      }[];
    },
    staleTime: 120_000,
    enabled: open && Boolean(formationId?.trim()),
  });

  const formateursQuery = useQuery({
    queryKey: formateursQueryKey,
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/sessions/formateurs');
      if (!res.ok) throw new Error('Formateurs indisponibles.');
      const j = await res.json();
      if (!j?.success || !Array.isArray(j?.data?.items)) throw new Error('Réponse formateurs invalide.');
      return j.data.items as {
        id: string;
        name: string | null;
        email: string;
        avatar?: string | null;
      }[];
    },
    staleTime: 120_000,
    enabled: open,
  });

  const equipmentQuery = useQuery({
    queryKey: equipmentPickQueryKey,
    queryFn: async (): Promise<EquipmentPickInventoryRow[]> => {
      const qs = new URLSearchParams({ limit: '500', page: '1' });
      const res = await apiFetch(`/api/sections/gestion-ressources/equipements/inventaire?${qs}`);
      if (!res.ok) throw new Error('Équipements indisponibles.');
      const j = await res.json();
      const items = j?.data?.data;
      if (!j?.success || !Array.isArray(items)) throw new Error('Réponse inventaire invalide.');
      return items;
    },
    staleTime: 60_000,
    enabled: open,
  });

  const venueRoomsQuery = useQuery({
    queryKey: venueRoomsQueryKey,
    queryFn: async (): Promise<VenueRoomOption[]> => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/sessions/venue-rooms');
      if (!res.ok) throw new Error('Salles indisponibles.');
      const j = await res.json();
      if (!j?.success || !Array.isArray(j?.data?.items)) throw new Error('Réponse salles invalide.');
      return j.data.items as VenueRoomOption[];
    },
    staleTime: 120_000,
    enabled: open,
  });

  const sessionsForEquipmentQuery = useQuery({
    queryKey: sessionsForEquipmentPickQueryKey,
    queryFn: async (): Promise<FormationSessionApiRow[]> => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/sessions');
      if (!res.ok) throw new Error('Sessions indisponibles.');
      const j = await res.json();
      if (!j?.success || !Array.isArray(j?.data?.items)) throw new Error('Réponse sessions invalide.');
      return j.data.items as FormationSessionApiRow[];
    },
    staleTime: 30_000,
    enabled: open,
  });

  const catalogRows = catalogQuery.data?.items ?? EMPTY_CATALOG_ITEMS;
  const catalogActive = useMemo(
    () => catalogRows.filter((r) => r.status === 'ACTIVE'),
    [catalogRows],
  );
  const selectedFormation = useMemo(
    () => catalogRows.find((f) => f.formationId === formationId) ?? null,
    [catalogRows, formationId],
  );

  const sessionAddOverviewModel = useMemo(
    () => buildFormationSheetViewModel(undefined, selectedFormation),
    [selectedFormation],
  );

  const resetAll = () => {
    form.reset(EMPTY_FORM_VALUES);
    setParticipantIds(new Set());
    setEquipmentIds(new Set());
    setExamEquipmentIds(new Set());
    setActiveTab('overview');
  };

  const applyDraft = (row: FormationSessionApiRow) => {
    form.reset({
      formationId: row.formationId,
      dateDisplayLabel: row.dateDisplayLabel,
      location: row.location,
      startLocal: toDatetimeLocal(row.startDate),
      endLocal: toDatetimeLocal(row.endDate),
      registrationClosesLocal: toDatetimeLocal(row.registrationClosesAt),
      examLocal: toDatetimeLocal(row.examDate),
      examVenueRoomId: row.examVenueRoomId ?? '',
      traineesMin: row.traineesMin != null ? String(row.traineesMin) : '',
      traineesMax: row.traineesMax != null ? String(row.traineesMax) : '',
      trainerUserId: row.trainerUserId ?? '',
      venueRoomId: row.venueRoomId ?? '',
    });
    setParticipantIds(new Set(row.participants.map((p) => p.userId)));
    setEquipmentIds(new Set(row.reservedEquipmentIds ?? []));
    setExamEquipmentIds(new Set(row.examReservedEquipmentIds ?? []));
    setActiveTab('overview');
  };

  useEffect(() => {
    if (!open) return;
    setActiveTab('overview');
    if (draft) applyDraft(draft);
    else resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draft identity drives reopen
  }, [open, draft?.id]);

  useEffect(() => {
    if (!open || editingId || formationId || catalogActive.length !== 1) return;
    form.setValue('formationId', catalogActive[0].formationId);
  }, [open, editingId, formationId, catalogActive, form]);

  useEffect(() => {
    if (!open || !formationId?.trim() || !elevesQuery.data) return;
    const allowed = new Set(elevesQuery.data.map((l) => l.id));
    setParticipantIds((prev) => {
      const next = new Set([...prev].filter((id) => allowed.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [open, formationId, elevesQuery.data]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['gestion-academique', 'vie-scolaire', 'sessions'] });
    queryClient.invalidateQueries({ queryKey: [...formationsCatalogQueryRoot] });
  };

  const traineesMinWatch = form.watch('traineesMin');
  const traineesMaxWatch = form.watch('traineesMax');
  const trainerWatch = form.watch('trainerUserId');
  const venueRoomWatch = form.watch('venueRoomId');
  const examVenueRoomWatch = form.watch('examVenueRoomId');
  const examLocalWatch = form.watch('examLocal');
  const startLocalWatch = form.watch('startLocal');
  const endLocalWatch = form.watch('endLocal');

  const equipmentSessionRange = useMemo(() => {
    if (!startLocalWatch?.trim() || !endLocalWatch?.trim()) {
      return { start: null as Date | null, end: null as Date | null };
    }
    const start = new Date(startLocalWatch);
    const end = new Date(endLocalWatch);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { start: null, end: null };
    }
    return { start, end };
  }, [startLocalWatch, endLocalWatch]);

  const venueRoomConflictIndex = useMemo(() => {
    if (!open || activeTab !== 'moyens') return null;
    const start = equipmentSessionRange.start;
    const end = equipmentSessionRange.end;
    if (start == null || end == null) return null;
    return indexVenueRoomConflictsForRange(
      sessionsForEquipmentQuery.data ?? [],
      { start, end },
      editingId,
    );
  }, [
    open,
    activeTab,
    equipmentSessionRange.start,
    equipmentSessionRange.end,
    sessionsForEquipmentQuery.data,
    editingId,
  ]);

  const selectedVenueRoomConflicts = useMemo(() => {
    if (!open || activeTab !== 'moyens') return [];
    const rid = venueRoomWatch?.trim() ?? '';
    if (!rid || !venueRoomConflictIndex) return [];
    return venueRoomConflictIndex.get(rid) ?? [];
  }, [open, activeTab, venueRoomWatch, venueRoomConflictIndex]);

  const venueRoomPickMeta = useMemo(() => {
    if (!open || activeTab !== 'moyens') return EMPTY_VENUE_ROOM_PICK_META;
    const rooms = venueRoomsQuery.data ?? [];
    const map = new Map<string, { occupied: boolean; conflictLabel: string | null }>();
    for (const room of rooms) {
      if (!venueRoomConflictIndex) {
        map.set(room.id, { occupied: false, conflictLabel: null });
        continue;
      }
      const conflicts = venueRoomConflictIndex.get(room.id) ?? [];
      map.set(room.id, {
        occupied: conflicts.length > 0,
        conflictLabel: conflicts[0]?.formationName ?? null,
      });
    }
    return map;
  }, [open, activeTab, venueRoomsQuery.data, venueRoomConflictIndex]);

  const onEquipmentPickToggle = useCallback((id: string, checked: boolean) => {
    setEquipmentIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const onExamEquipmentToggle = useCallback((id: string, _checked?: boolean) => {
    setExamEquipmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onParticipantToggle = useCallback((userId: string, checked: boolean) => {
    setParticipantIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(userId);
      else next.delete(userId);
      return next;
    });
  }, []);

  const createMutation = useMutation({
    mutationFn: async (values: FormationSessionAddSheetValues) => {
      const formationRow = catalogActive.find((f) => f.formationId === values.formationId);
      if (!formationRow) throw new Error('Formation catalogue introuvable.');
      let extras: ReturnType<typeof buildSessionExtrasPayload>;
      try {
        extras = buildSessionExtrasPayload(values, equipmentIds, examEquipmentIds);
      } catch (e) {
        throw new Error((e as Error).message);
      }
      const body = {
        formationId: values.formationId,
        dateDisplayLabel: values.dateDisplayLabel.trim(),
        location: values.location.trim(),
        startDate: values.startLocal ? new Date(values.startLocal).toISOString() : null,
        endDate: values.endLocal ? new Date(values.endLocal).toISOString() : null,
        registrationClosesAt: extras.registrationClosesAt,
        examDate: extras.examDate,
        examVenueRoomId: extras.examVenueRoomId,
        examReservedEquipmentIds: extras.examReservedEquipmentIds,
        traineesMin: extras.traineesMin,
        traineesMax: extras.traineesMax,
        trainerUserId: extras.trainerUserId,
        venueRoomId: extras.venueRoomId,
        reservedEquipmentIds: extras.reservedEquipmentIds,
        sessionKind: sessionKindDerivedFromFormationParcours(formationRow.parcoursSpecialite),
        participantUserIds: Array.from(participantIds),
      };
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error?.message ?? 'Création impossible.');
      return j;
    },
    onSuccess: () => {
      toast.success(t('sessions.created'), { description: t('sessions.createdDescription') });
      invalidateAll();
      onOpenChange(false);
      resetAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: FormationSessionAddSheetValues) => {
      if (!editingId) throw new Error('Session non sélectionnée.');
      const formationRow = catalogActive.find((f) => f.formationId === values.formationId);
      if (!formationRow) throw new Error('Formation catalogue introuvable.');
      let extras: ReturnType<typeof buildSessionExtrasPayload>;
      try {
        extras = buildSessionExtrasPayload(values, equipmentIds, examEquipmentIds);
      } catch (e) {
        throw new Error((e as Error).message);
      }
      const body = {
        dateDisplayLabel: values.dateDisplayLabel.trim(),
        location: values.location.trim(),
        startDate: values.startLocal ? new Date(values.startLocal).toISOString() : null,
        endDate: values.endLocal ? new Date(values.endLocal).toISOString() : null,
        registrationClosesAt: extras.registrationClosesAt,
        examDate: extras.examDate,
        examVenueRoomId: extras.examVenueRoomId,
        examReservedEquipmentIds: extras.examReservedEquipmentIds,
        traineesMin: extras.traineesMin,
        traineesMax: extras.traineesMax,
        trainerUserId: extras.trainerUserId,
        venueRoomId: extras.venueRoomId,
        reservedEquipmentIds: extras.reservedEquipmentIds,
        sessionKind: sessionKindDerivedFromFormationParcours(formationRow.parcoursSpecialite),
        participantUserIds: Array.from(participantIds),
      };
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/sessions/${encodeURIComponent(editingId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const details = j?.error?.details;
        const detailMsg =
          details && typeof details === 'object' && 'fieldErrors' in details
            ? Object.values(details.fieldErrors as Record<string, string[]>)
                .flat()
                .filter(Boolean)
                .join(' ')
            : '';
        throw new Error(
          [j?.error?.message, detailMsg].filter(Boolean).join(' — ') || 'Mise à jour impossible.',
        );
      }
      return j;
    },
    onSuccess: (j) => {
      const warnings = j?.data?.warnings;
      if (Array.isArray(warnings) && warnings.length > 0) {
        toast.warning('Session enregistrée avec avertissements', {
          description: warnings.join(' · '),
        });
      } else {
        toast.success(t('sessions.updated'));
      }
      invalidateAll();
      onOpenChange(false);
      resetAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const busy = createMutation.isPending || updateMutation.isPending;

  const sheetTitle =
    editingId && draft?.formationName
      ? draft.formationName
      : (selectedFormation?.name ?? 'Nouvelle session');

  const voletLabel = selectedFormation ? FORMATION_TRACK_LABELS[selectedFormation.track] : '—';
  const typeLabel = selectedFormation?.tag ?? '—';
  const durationLabel = selectedFormation?.duration ?? draft?.formationDuration ?? '—';

  const sessionOverviewMetrics = useMemo(() => {
    const trainerId = trainerWatch.trim();
    const trainerRow = trainerId ? formateursQuery.data?.find((f) => f.id === trainerId) : null;
    const roomId = venueRoomWatch.trim();
    const roomName = roomId
      ? (venueRoomsQuery.data?.find((r) => r.id === roomId)?.name ?? null)
      : null;
    const tmn = traineesMinWatch.trim();
    const tmx = traineesMaxWatch.trim();
    let capacityHint: string | null = null;
    if (tmn || tmx) {
      capacityHint = `Capacité session ${tmn || '?'}–${tmx || '?'}`;
    } else {
      const ref = formatEffectifFourchette(selectedFormation);
      if (ref !== '—') capacityHint = `Réf. catalogue ${ref}`;
    }
    return {
      durationDisplay: durationLabel,
      enrolledCount: participantIds.size,
      capacityHint,
      roomName,
      trainer: trainerRow
        ? { name: trainerRow.name, email: trainerRow.email, avatar: trainerRow.avatar }
        : null,
    };
  }, [
    trainerWatch,
    formateursQuery.data,
    venueRoomWatch,
    venueRoomsQuery.data,
    traineesMinWatch,
    traineesMaxWatch,
    selectedFormation,
    durationLabel,
    participantIds.size,
  ]);

  const parcoursPedago =
    selectedFormation?.parcoursSpecialite != null
      ? FORMATION_PARCOURS_LABELS[selectedFormation.parcoursSpecialite]
      : draft
        ? FORMATION_PARCOURS_LABELS[draft.formationParcours]
        : '—';

  const catalogueStatusLabel = selectedFormation
    ? selectedFormation.status === 'ACTIVE'
      ? 'Active'
      : selectedFormation.status === 'DRAFT'
        ? 'Brouillon'
        : 'Archivée'
    : '—';

  const dispatchSessionKind = selectedFormation
    ? sessionKindDerivedFromFormationParcours(selectedFormation.parcoursSpecialite)
    : (draft?.sessionKind ?? null);

  const traineesMaxParsed = parseOptionalTrainees(traineesMaxWatch);

  const selectedEquipmentIdsForDispatch = useMemo(
    () => [...Array.from(equipmentIds), ...Array.from(examEquipmentIds)],
    [equipmentIds, examEquipmentIds],
  );

  const handleSubmitForm = form.handleSubmit((values) => {
    if (editingId) updateMutation.mutate(values);
    else createMutation.mutate(values);
  });

  return {
    form,
    editingId,
    draft,
    activeTab,
    setActiveTab,
    participantIds,
    equipmentIds,
    examEquipmentIds,
    formationId,
    catalogQuery,
    elevesQuery,
    formateursQuery,
    equipmentQuery,
    venueRoomsQuery,
    sessionsForEquipmentQuery,
    catalogActive,
    selectedFormation,
    sessionAddOverviewModel,
    venueRoomPickMeta,
    selectedVenueRoomConflicts,
    equipmentSessionRange,
    venueRoomWatch,
    examVenueRoomWatch,
    examLocalWatch,
    onEquipmentPickToggle,
    onExamEquipmentToggle,
    onParticipantToggle,
    busy,
    sheetTitle,
    voletLabel,
    typeLabel,
    durationLabel,
    sessionOverviewMetrics,
    parcoursPedago,
    catalogueStatusLabel,
    dispatchSessionKind,
    traineesMaxParsed,
    selectedEquipmentIdsForDispatch,
    handleSubmitForm,
    onOpenChange,
  };
}
