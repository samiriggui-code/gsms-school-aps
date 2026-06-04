'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useForm } from 'react-hook-form';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoaderCircleIcon, TrendingUp, UserPlus } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_SESSION } from '../../../constants/sheet-shell-classes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { z } from 'zod';
import type { FormationCatalogApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/types/catalog-api';
import {
  FORMATION_PARCOURS_LABELS,
  FORMATION_TRACK_LABELS,
} from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';
import {
  formationsCatalogQueryKey,
  formationsCatalogQueryRoot,
} from '@/app/(protected)/gestion-academique/vie-scolaire/formations/hooks/use-formations-catalog-query';
import { LoyaltyTier } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/components/loyalty-tier';
import { RecentOrders } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/components/resent-order';
import { Upload } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/components/upload';
import { buildFormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';
import type { FormationSessionApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/types/formation-session-api-row';
import { FormationSessionEquipmentPickGrid } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/formation-session-equipment-pick-grid';
import { sessionsListQueryKey } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/sessions-manager';
import { indexVenueRoomConflictsForRange } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/lib/session-room-availability';
import { sessionKindDerivedFromFormationParcours } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/lib/session-parcours-exam';

const elevesQueryKey = ['gestion-academique', 'vie-scolaire', 'sessions', 'eleves'] as const;
const formateursQueryKey = ['gestion-academique', 'vie-scolaire', 'sessions', 'formateurs'] as const;
const equipmentPickQueryKey = ['gestion-academique', 'vie-scolaire', 'sessions', 'equipment-pick'] as const;
const venueRoomsQueryKey = ['gestion-academique', 'vie-scolaire', 'sessions', 'venue-rooms'] as const;
/** Clé distincte de `sessionsListQueryKey` : le manager met en cache `{ items }`, pas un tableau brut. */
const sessionsForEquipmentPickQueryKey = [
  ...sessionsListQueryKey,
  'equipment-pick',
] as const;

const EMPTY_CATALOG_ITEMS: FormationCatalogApiRow[] = [];

type EquipmentPickInventoryRow = { id: string; label: string; serialNumber: string; status: string };
const EMPTY_EQUIPMENT_INVENTORY: EquipmentPickInventoryRow[] = [];

const EMPTY_VENUE_ROOM_PICK_META = new Map<string, { occupied: boolean; conflictLabel: string | null }>();

/** Même grille que `AddCatalogMetricsStrip` — 4ᵉ carte : libellés courts en « titre », détail en pied comme le catalogue. */
function SessionFormationMetricsStrip({
  durationLabel,
  effectifLabel,
  catalogueLabel,
  sessionOverviewComplete,
  sessionOverviewDetail,
}: {
  durationLabel: string;
  effectifLabel: string;
  catalogueLabel: string;
  sessionOverviewComplete: boolean;
  sessionOverviewDetail: string;
}) {
  const fourth = sessionOverviewComplete
    ? {
        total: sessionOverviewDetail || '—',
        totalClamp: true,
        label: 'Synthèse session',
        badgeLabel: 'Synthèse',
        badgeColor: 'success' as const,
        text: 'effectif · planning · moyens',
      }
    : {
        total: '—',
        totalClamp: false,
        label: 'Synthèse session',
        badgeLabel: '—',
        badgeColor: 'secondary' as const,
        text: sessionOverviewDetail,
      };

  const items = [
    {
      total: durationLabel,
      label: 'Durée indicative',
      badgeLabel: 'Réf.',
      badgeColor: 'success' as const,
      text: 'fiche métier',
      number: '',
      totalClamp: false as const,
    },
    {
      total: effectifLabel,
      label: 'Effectif catalogue',
      badgeLabel: 'Réf.',
      badgeColor: 'success' as const,
      text: 'indicatif offre',
      number: '',
      totalClamp: false as const,
    },
    {
      total: catalogueLabel,
      label: 'Offre catalogue',
      badgeLabel: 'Statut',
      badgeColor: 'warning' as const,
      text: 'formation liée',
      number: '',
      totalClamp: false as const,
    },
    {
      total: fourth.total,
      totalClamp: fourth.totalClamp,
      label: fourth.label,
      badgeLabel: fourth.badgeLabel,
      badgeColor: fourth.badgeColor,
      text: fourth.text,
      number: '',
    },
  ];

  return (
    <Card className="mb-5 rounded-md bg-accent/70 p-1">
      <CardContent className="rounded-md border border-border bg-background p-0">
        <div className="grid md:grid-cols-4 lg:gap-5">
          {items.map((item, index) => (
            <div
              key={item.label}
              className={`flex flex-col justify-between gap-5 p-4.5 pb-3.5 ${index > 0 ? 'border-border md:border-s' : ''}`}
            >
              <div className="flex min-h-0 flex-col gap-0.5">
                <span
                  className={`inline-flex flex-wrap items-baseline gap-x-0 font-semibold text-foreground ${
                    item.totalClamp
                      ? 'line-clamp-2 text-lg leading-snug lg:text-xl'
                      : 'text-xl lg:text-2xl'
                  }`}
                >
                  <span className="min-w-0">{item.total}</span>
                  {item.number ? (
                    <span className="text-xl font-semibold text-secondary-foreground/30 lg:text-2xl">
                      {item.number}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs font-normal text-secondary-foreground/70">{item.label}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={item.badgeColor} size="sm" appearance="light" className="w-fit">
                  <TrendingUp className="size-3" /> {item.badgeLabel}
                </Badge>
                <span className="text-xs font-normal text-secondary-foreground">{item.text}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const formSchema = z
  .object({
    formationId: z.string().uuid({ message: 'Choisissez une formation catalogue active.' }),
    dateDisplayLabel: z.string().min(1, 'Libellé dates obligatoire.'),
    location: z.string().min(1, 'Lieu obligatoire.'),
    startLocal: z.string(),
    endLocal: z.string(),
    registrationClosesLocal: z.string(),
    examLocal: z.string(),
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

function parseOptionalTrainees(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function buildSessionExtrasPayload(values: FormationSessionAddSheetValues, equipmentIds: Set<string>) {
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
  return {
    registrationClosesAt: isoOrNull(values.registrationClosesLocal),
    examDate: isoOrNull(values.examLocal),
    traineesMin,
    traineesMax,
    trainerUserId: trainer ? trainer : null,
    venueRoomId: room ? room : null,
    reservedEquipmentIds: Array.from(equipmentIds),
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: FormationSessionApiRow | null;
};

export default function FormationSessionAddSheet({ open, onOpenChange, draft }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const editingId = draft?.id ?? null;
  const [activeTab, setActiveTab] = useState('overview');
  const [participantIds, setParticipantIds] = useState<Set<string>>(new Set());
  const [equipmentIds, setEquipmentIds] = useState<Set<string>>(new Set());

  const form = useForm<FormationSessionAddSheetValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formationId: '',
      dateDisplayLabel: '',
      location: '',
      startLocal: '',
      endLocal: '',
      registrationClosesLocal: '',
      examLocal: '',
      traineesMin: '',
      traineesMax: '',
      trainerUserId: '',
      venueRoomId: '',
    },
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

  const elevesQuery = useQuery({
    queryKey: elevesQueryKey,
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/sessions/eleves');
      if (!res.ok) throw new Error('Élèves indisponibles.');
      const j = await res.json();
      if (!j?.success || !Array.isArray(j?.data?.items)) throw new Error('Réponse élèves invalide.');
      return j.data.items as { id: string; name: string | null; email: string }[];
    },
    staleTime: 120_000,
    enabled: open,
  });

  const formateursQuery = useQuery({
    queryKey: formateursQueryKey,
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/sessions/formateurs');
      if (!res.ok) throw new Error('Formateurs indisponibles.');
      const j = await res.json();
      if (!j?.success || !Array.isArray(j?.data?.items)) throw new Error('Réponse formateurs invalide.');
      return j.data.items as { id: string; name: string | null; email: string }[];
    },
    staleTime: 120_000,
    enabled: open,
  });

  const equipmentQuery = useQuery({
    queryKey: equipmentPickQueryKey,
    queryFn: async (): Promise<{ id: string; label: string; serialNumber: string; status: string }[]> => {
      const qs = new URLSearchParams({ limit: '500', page: '1' });
      const res = await apiFetch(`/api/sections/gestion-ressources/equipements/inventaire?${qs}`);
      if (!res.ok) throw new Error('Équipements indisponibles.');
      const j = await res.json();
      if (!j?.success || !Array.isArray(j?.data?.items)) throw new Error('Réponse inventaire invalide.');
      return j.data.items;
    },
    staleTime: 60_000,
    enabled: open,
  });

  const venueRoomsQuery = useQuery({
    queryKey: venueRoomsQueryKey,
    queryFn: async (): Promise<{ id: string; name: string }[]> => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/sessions/venue-rooms');
      if (!res.ok) throw new Error('Salles indisponibles.');
      const j = await res.json();
      if (!j?.success || !Array.isArray(j?.data?.items)) throw new Error('Réponse salles invalide.');
      return j.data.items as { id: string; name: string }[];
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
  const catalogActive = useMemo(() => catalogRows.filter((r) => r.status === 'ACTIVE'), [catalogRows]);
  const selectedFormation = useMemo(
    () => catalogRows.find((f) => f.formationId === formationId) ?? null,
    [catalogRows, formationId],
  );

  const sessionAddOverviewModel = useMemo(
    () => buildFormationSheetViewModel(undefined, selectedFormation),
    [selectedFormation],
  );

  const resetAll = () => {
    form.reset({
      formationId: '',
      dateDisplayLabel: '',
      location: '',
      startLocal: '',
      endLocal: '',
      registrationClosesLocal: '',
      examLocal: '',
      traineesMin: '',
      traineesMax: '',
      trainerUserId: '',
      venueRoomId: '',
    });
    setParticipantIds(new Set());
    setEquipmentIds(new Set());
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
      traineesMin: row.traineesMin != null ? String(row.traineesMin) : '',
      traineesMax: row.traineesMax != null ? String(row.traineesMax) : '',
      trainerUserId: row.trainerUserId ?? '',
      venueRoomId: row.venueRoomId ?? '',
    });
    setParticipantIds(new Set(row.participants.map((p) => p.userId)));
    setEquipmentIds(new Set(row.reservedEquipmentIds ?? []));
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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['gestion-academique', 'vie-scolaire', 'sessions'] });
    queryClient.invalidateQueries({ queryKey: [...formationsCatalogQueryRoot] });
  };

  const traineesMinWatch = form.watch('traineesMin');
  const traineesMaxWatch = form.watch('traineesMax');
  const trainerWatch = form.watch('trainerUserId');
  const venueRoomWatch = form.watch('venueRoomId');
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

  const sessionOverviewStrip = useMemo(() => {
    const bits: string[] = [];
    if (participantIds.size > 0) bits.push(`${participantIds.size} inscrit(s)`);
    const tmn = traineesMinWatch.trim();
    const tmx = traineesMaxWatch.trim();
    if (tmn || tmx) bits.push(`eff. session ${tmn || '?'}–${tmx || '?'}`);
    if (trainerWatch.trim()) bits.push('formateur');
    const roomId = venueRoomWatch.trim();
    if (roomId) {
      const name = venueRoomsQuery.data?.find((r) => r.id === roomId)?.name;
      bits.push(name ? `salle : ${name}` : 'salle réservée');
    }
    if (equipmentIds.size > 0) bits.push(`${equipmentIds.size} équip.`);
    if (!bits.length) {
      return {
        complete: false,
        detail: 'À compléter via les onglets Session et Moyens.',
      };
    }
    return { complete: true, detail: bits.join(' · ') };
  }, [
    participantIds.size,
    traineesMinWatch,
    traineesMaxWatch,
    trainerWatch,
    venueRoomWatch,
    venueRoomsQuery.data,
    equipmentIds.size,
  ]);

  const createMutation = useMutation({
    mutationFn: async (values: FormationSessionAddSheetValues) => {
      const formationRow = catalogActive.find((f) => f.formationId === values.formationId);
      if (!formationRow) throw new Error('Formation catalogue introuvable.');
      let extras: ReturnType<typeof buildSessionExtrasPayload>;
      try {
        extras = buildSessionExtrasPayload(values, equipmentIds);
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
        extras = buildSessionExtrasPayload(values, equipmentIds);
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
      if (!res.ok) throw new Error(j?.error?.message ?? 'Mise à jour impossible.');
      return j;
    },
    onSuccess: () => {
      toast.success(t('sessions.updated'));
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
      : selectedFormation?.name ?? 'Nouvelle session';

  const voletLabel = selectedFormation ? FORMATION_TRACK_LABELS[selectedFormation.track] : '—';
  const typeLabel = selectedFormation?.tag ?? '—';
  const durationLabel = selectedFormation?.duration ?? draft?.formationDuration ?? '—';
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

  const onParticipantToggle = (userId: string, checked: boolean) => {
    setParticipantIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(userId);
      else next.delete(userId);
      return next;
    });
  };

  const handleSubmitForm = form.handleSubmit((values) => {
    if (editingId) updateMutation.mutate(values);
    else createMutation.mutate(values);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_SESSION}>
        <SheetHeader className="shrink-0 border-b border-border px-5 py-3.5">
          <SheetTitle className="font-medium">
            {editingId ? 'Modifier la session' : 'Programmer une session'}
          </SheetTitle>
          <p className="mt-1 max-w-[68ch] text-xs leading-relaxed text-muted-foreground">
            Planning vitrine (libellé, lieu, dates), puis{' '}
            <span className="font-medium text-foreground">clôture inscriptions</span>,{' '}
            <span className="font-medium text-foreground">examen</span>,{' '}
            <span className="font-medium text-foreground">effectif session min–max</span>,{' '}
            <span className="font-medium text-foreground">formateur</span> et{' '}
            <span className="font-medium text-foreground">équipements</span> (inventaire).
          </p>
        </SheetHeader>

        <Form {...form}>
          <form
            id="formation-session-add"
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            onSubmit={handleSubmitForm}
          >
            <SheetBody className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
              <div className="shrink-0 border-b border-border px-5 py-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-lg font-semibold leading-none text-foreground lg:text-[22px]">
                      {sheetTitle}
                    </span>
                    {!editingId ? (
                      <Badge size="sm" variant="warning" appearance="light">
                        Configuration
                      </Badge>
                    ) : (
                      <Badge size="sm" variant="secondary" appearance="light">
                        Mise à jour
                      </Badge>
                    )}
                    {selectedFormation?.status === 'ACTIVE' ? (
                      <Badge size="sm" variant="success" appearance="light">
                        Catalogue actif
                      </Badge>
                    ) : selectedFormation ? (
                      <Badge size="sm" variant="secondary" appearance="light">
                        {catalogueStatusLabel}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-2sm flex flex-wrap items-center gap-2">
                    <span className="font-normal text-muted-foreground">Filière</span>
                    <span className="font-medium text-foreground">{voletLabel}</span>
                    <BadgeDot className="size-1 bg-muted-foreground" />
                    <span className="font-normal text-muted-foreground">Type</span>
                    <span className="font-medium text-foreground">{typeLabel}</span>
                    <BadgeDot className="size-1 bg-muted-foreground" />
                    <span className="font-normal text-muted-foreground">Durée</span>
                    <span className="font-medium text-foreground">{durationLabel}</span>
                    <BadgeDot className="size-1 bg-muted-foreground" />
                    <span className="font-normal text-muted-foreground">Parcours pédago.</span>
                    <span className="font-medium text-foreground">{parcoursPedago}</span>
                  </div>
                </div>
              </div>

              <ScrollArea className="mx-1.5 min-h-0 flex-1" viewportClassName="[&>div]:h-full [&>div>div]:h-full">
                <div className="flex grow flex-wrap px-3.5 lg:flex-nowrap">
                  <div className="w-full shrink-0 space-y-4 py-5 lg:w-[230px] lg:pe-5">
                    <Upload
                      allowDemoLogoFallback={false}
                      logoUrl={selectedFormation?.logoUrl ?? undefined}
                      companyName={selectedFormation?.providerName ?? undefined}
                      email={selectedFormation?.providerEmail ?? undefined}
                      phone={selectedFormation?.providerPhone ?? undefined}
                      address={selectedFormation?.providerAddress ?? undefined}
                      sessionLabel={selectedFormation?.nextSessionLabel ?? undefined}
                    />
                    <Separator className="opacity-40" />
                    <FormField
                      control={form.control}
                      name="formationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Formation catalogue</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={Boolean(editingId) || catalogQuery.isLoading || catalogActive.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    catalogQuery.isLoading ? 'Chargement…' : 'Choisir une formation publiée…'
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[min(320px,70vh)]">
                              {catalogActive.map((item) => (
                                <SelectItem
                                  key={item.id}
                                  value={item.formationId}
                                  textValue={`${item.name} ${FORMATION_TRACK_LABELS[item.track]}`}
                                >
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-muted-foreground">
                                    {' '}
                                    · {FORMATION_TRACK_LABELS[item.track]}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!catalogQuery.isLoading && catalogActive.length === 0 ? (
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                              Aucune formation active dans le catalogue. Publiez une offre ou réactivez-en une depuis
                              « Formations ».
                            </p>
                          ) : null}
                          {editingId ? (
                            <p className="text-[11px] text-muted-foreground">
                              La formation liée ne peut pas être changée après création.
                            </p>
                          ) : null}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      Même principe que l&apos;ajout au catalogue : colonne média + rattachement à une ligne catalogue
                      existante et active.
                    </p>
                  </div>

                  <div className="grow space-y-5 border-border py-5 lg:border-s lg:ps-5">
                    <Tabs
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-auto text-sm text-muted-foreground"
                    >
                        <TabsList className="mb-2.5 inline-flex w-auto grow-0 flex-wrap gap-1">
                        <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
                        <TabsTrigger value="session" disabled={!formationId?.trim() && !editingId}>
                          Session
                        </TabsTrigger>
                        <TabsTrigger value="moyens" disabled={!formationId?.trim() && !editingId}>
                          Moyens
                        </TabsTrigger>
                        <TabsTrigger value="eleves">Stagiaires</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        {!formationId?.trim() && !editingId ? (
                          <p className="rounded-lg border border-dashed px-3 py-12 text-center text-sm text-muted-foreground">
                            Sélectionnez une formation catalogue dans la colonne de gauche pour afficher les blocs vitrine et
                            planifier cette session.
                          </p>
                        ) : (
                          <div className="space-y-5">
                            <SessionFormationMetricsStrip
                              durationLabel={durationLabel}
                              effectifLabel={formatEffectifFourchette(selectedFormation)}
                              catalogueLabel={
                                selectedFormation?.status === 'ACTIVE'
                                  ? 'Publiée'
                                  : selectedFormation?.status === 'DRAFT'
                                    ? 'Brouillon'
                                    : selectedFormation
                                      ? catalogueStatusLabel
                                      : '—'
                              }
                              sessionOverviewComplete={sessionOverviewStrip.complete}
                              sessionOverviewDetail={sessionOverviewStrip.detail}
                            />
                            <div className="grid items-stretch gap-5 lg:grid-cols-2">
                              <RecentOrders presentation={sessionAddOverviewModel.presentation} />
                              <LoyaltyTier loyalty={sessionAddOverviewModel.loyalty} />
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="session" className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                        <FormField
                          control={form.control}
                          name="dateDisplayLabel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Libellé dates (vitrine)</FormLabel>
                              <FormControl>
                                <Input placeholder="ex. 04 Mai – 12 Juin 2026" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lieu</FormLabel>
                              <FormControl>
                                <Input placeholder="Adresse ou salle" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="startLocal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Début session</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="endLocal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fin session</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="registrationClosesLocal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Clôture des inscriptions</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <p className="text-[11px] text-muted-foreground">
                                  À partir de cette date/heure : plus de nouvelle inscription sur cette session.
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="examLocal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date / heure examen</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="traineesMin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Effectif min. (session)</FormLabel>
                                <FormControl>
                                  <Input type="number" min={1} step={1} placeholder="ex. 6" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="traineesMax"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Effectif max. (session)</FormLabel>
                                <FormControl>
                                  <Input type="number" min={1} step={1} placeholder="ex. 12" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="moyens" className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                        <FormField
                          control={form.control}
                          name="trainerUserId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Formateur référent</FormLabel>
                              <Select
                                value={field.value?.trim() ? field.value : '__none__'}
                                onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choisir un formateur…" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-[min(320px,70vh)]">
                                  <SelectItem value="__none__">— Non renseigné —</SelectItem>
                                  {(formateursQuery.data ?? []).map((f) => (
                                    <SelectItem key={f.id} value={f.id}>
                                      <span className="font-medium">{f.name ?? f.email}</span>
                                      <span className="text-muted-foreground">{f.name ? ` · ${f.email}` : ''}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {!formateursQuery.isLoading && (formateursQuery.data ?? []).length === 0 ? (
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                  Aucun compte actif avec le rôle « formateur ». Créez-en un depuis les ressources humaines.
                                </p>
                              ) : null}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="venueRoomId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Salle</FormLabel>
                              <Select
                                value={field.value?.trim() ? field.value : '__none__'}
                                onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choisir une salle…" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-[min(320px,70vh)]">
                                  <SelectItem value="__none__">— Aucune salle —</SelectItem>
                                  {(venueRoomsQuery.data ?? []).map((room) => {
                                    const pick = venueRoomPickMeta.get(room.id);
                                    const occupied = pick?.occupied ?? false;
                                    const disabled = occupied && field.value?.trim() !== room.id;
                                    return (
                                      <SelectItem key={room.id} value={room.id} disabled={disabled}>
                                        <span className="font-medium">{room.name}</span>
                                        {disabled ? (
                                          <span className="text-muted-foreground">
                                            {' '}
                                            · occupée ({pick?.conflictLabel ?? '…'})
                                          </span>
                                        ) : null}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              {equipmentSessionRange.start == null || equipmentSessionRange.end == null ? (
                                <FormDescription>
                                  Renseignez début et fin de session pour afficher les salles déjà réservées sur la
                                  période.
                                </FormDescription>
                              ) : null}
                              {selectedVenueRoomConflicts.length > 0 ? (
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                  Conflit : cette salle est déjà retenue pour{' '}
                                  {selectedVenueRoomConflicts.map((c, i) => (
                                    <span key={c.sessionId}>
                                      {i > 0 ? ' ; ' : null}
                                      « {c.formationName} » ({c.dateDisplayLabel})
                                    </span>
                                  ))}
                                  . Choisissez une autre salle ou modifiez les dates.
                                </p>
                              ) : null}
                              {!venueRoomsQuery.isLoading && (venueRoomsQuery.data ?? []).length === 0 ? (
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                  Aucune salle en base. À la racine du dépôt : <code className="font-mono">pnpm db:push</code>{' '}
                                  puis <code className="font-mono">pnpm db:seed</code> (réf.{' '}
                                  <code className="font-mono">packages/database/prisma</code>
                                  ), puis rechargez la page.
                                </p>
                              ) : null}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div>
                          <p className="mb-2 text-sm font-medium text-foreground">Équipements réservés</p>
                          <FormationSessionEquipmentPickGrid
                            inventory={equipmentQuery.data ?? EMPTY_EQUIPMENT_INVENTORY}
                            sessions={sessionsForEquipmentQuery.data ?? []}
                            selectedIds={equipmentIds}
                            onToggle={onEquipmentPickToggle}
                            rangeStart={equipmentSessionRange.start}
                            rangeEnd={equipmentSessionRange.end}
                            excludeSessionId={editingId}
                            isLoadingInventory={equipmentQuery.isLoading}
                            isLoadingSessions={sessionsForEquipmentQuery.isLoading}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="eleves" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <div className="mb-4 space-y-2 rounded-lg border border-dashed border-border bg-muted/25 p-3 text-xs leading-relaxed text-muted-foreground">
                          <p>
                            Ces cases ajoutent immédiatement l&apos;élève comme participant CRM à cette session (
                            <span className="font-medium text-foreground">sans contrôle dossier automatique</span>).
                          </p>
                          <p>
                            Si vos règles imposent un{' '}
                            <span className="font-medium text-foreground">
                              dossier complet / conformité avant admission
                            </span>
                            , validez d&apos;abord en dehors de cet écran (ou via un flux candidature à créer),
                            puis cochez ici uniquement les parcours déjà admis.
                          </p>
                        </div>
                        <p className="mb-4 text-xs text-muted-foreground">
                          Liste limitée aux comptes actifs au rôle « élève ».
                        </p>
                        <div className="max-h-[min(320px,50vh)] space-y-2 overflow-auto rounded-lg border border-border p-3">
                          {elevesQuery.isLoading ? (
                            <p className="text-sm text-muted-foreground">Chargement des élèves…</p>
                          ) : (elevesQuery.data ?? []).length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucun élève éligible.</p>
                          ) : (
                            (elevesQuery.data ?? []).map((u) => (
                              <label
                                key={u.id}
                                className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                              >
                                <input
                                  type="checkbox"
                                  className="mt-1 accent-primary"
                                  checked={participantIds.has(u.id)}
                                  onChange={(e) => onParticipantToggle(u.id, e.target.checked)}
                                />
                                <span>
                                  <span className="block text-sm font-medium">{u.name ?? u.email}</span>
                                  <span className="text-xs text-muted-foreground">{u.email}</span>
                                </span>
                              </label>
                            ))
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
            </SheetBody>

            <SheetFooter className="flex shrink-0 flex-row justify-end gap-2.5 border-t border-border bg-background p-5 pb-[max(1rem,env(safe-area-inset-bottom))] lg:gap-0">
              <Button type="button" variant="mono" disabled={busy} onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" disabled={busy} className="gap-2">
                {busy ? <LoaderCircleIcon className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                {editingId ? 'Enregistrer la session' : 'Créer la session'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
