'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link2, Package, Plus, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SerializedRoomFixedEquipmentRow } from '@/app/api/sections/gestion-ressources/equipements/salles/_lib/serialize-room-fixed-equipment';
import { RoomEquipmentDispatchGuide } from './room-equipment-dispatch-guide';

type FixedInventoryResponse = {
  items: SerializedRoomFixedEquipmentRow[];
  summary: {
    itemCount: number;
    unitCount: number;
    totalCapitalized: number;
    annualAmortization: number;
    maintenanceCompleted: number;
  };
};

type CatalogUnitOption = {
  id: string;
  serialNumber: string;
  label: string;
  status: string;
  dispatch?: { location: string };
};

function fmtEuro(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export function SalleDetailsFixedInventory({
  roomId,
  roomCapacity,
}: {
  roomId: string;
  roomCapacity?: number | null;
}) {
  const qc = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [assignCatalog, setAssignCatalog] = useState<{ key: string; label: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['venue-room-fixed-equipment', roomId] as const,
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/gestion-ressources/equipements/salles/${encodeURIComponent(roomId)}/fixed-equipment`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('Chargement impossible');
      return unwrapSectionApiData<FixedInventoryResponse>(json)!;
    },
  });

  const pickerCatalogKey = assignCatalog?.key ?? null;
  const pickerCatalogLabel = assignCatalog?.label ?? null;

  const { data: unitOptions = [], isLoading: unitsLoading } = useQuery({
    queryKey: ['room-assign-units', pickerCatalogKey, pickerCatalogLabel] as const,
    enabled: pickerOpen && Boolean(pickerCatalogKey || pickerCatalogLabel),
    queryFn: async () => {
      const params = new URLSearchParams({ mode: 'catalog-units' });
      if (pickerCatalogKey) params.set('catalogKey', pickerCatalogKey);
      if (pickerCatalogLabel) params.set('label', pickerCatalogLabel);
      const res = await apiFetch(
        `/api/sections/gestion-ressources/equipements/inventaire?${params}`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return [];
      const payload = unwrapSectionApiData<{ units?: CatalogUnitOption[] }>(json);
      return (payload?.units ?? []).filter(
        (u) =>
          u.status === 'AVAILABLE' &&
          (!u.dispatch || u.dispatch.location === 'AVAILABLE'),
      );
    },
  });

  const assignedIds = useMemo(
    () => new Set((data?.items ?? []).map((r) => r.equipmentId)),
    [data?.items],
  );

  const availableOptions = unitOptions.filter((e) => !assignedIds.has(e.id));

  const openPicker = (catalog?: { key: string; label: string }) => {
    setAssignCatalog(catalog ?? null);
    setSelectedEquipmentId('');
    setPickerOpen(true);
  };

  const assignMutation = useMutation({
    mutationFn: async (equipmentId: string) => {
      const res = await apiFetch(
        `/api/sections/gestion-ressources/equipements/salles/${encodeURIComponent(roomId)}/fixed-equipment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ equipmentId, quantity: 1 }),
        },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error?.message || 'Affectation impossible');
      }
    },
    onSuccess: async () => {
      toast.success('Unité liée à la salle (mobilier fixe)');
      setSelectedEquipmentId('');
      await qc.invalidateQueries({ queryKey: ['venue-room-fixed-equipment', roomId] });
      await qc.invalidateQueries({ queryKey: ['room-dispatch-guide', roomId] });
      await qc.invalidateQueries({ queryKey: ['equipment-catalog'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await apiFetch(
        `/api/sections/gestion-ressources/equipements/salles/${encodeURIComponent(roomId)}/fixed-equipment/${encodeURIComponent(assignmentId)}`,
        { method: 'DELETE' },
      );
      if (!res.ok) throw new Error('Retrait impossible');
    },
    onSuccess: async () => {
      toast.success('Unité retournée au stock global');
      await qc.invalidateQueries({ queryKey: ['venue-room-fixed-equipment', roomId] });
      await qc.invalidateQueries({ queryKey: ['room-dispatch-guide', roomId] });
      await qc.invalidateQueries({ queryKey: ['equipment-catalog'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const summary = data?.summary;

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground leading-relaxed">
        <strong>Étape 1 — Inventaire global</strong> : les unités existent dans le catalogue école.{' '}
        <strong>Étape 2 — Cette salle</strong> : liez les unités nécessaires (chaises, tables, VP…).
        Elles restent <strong>fixes</strong> ici jusqu&apos;à transfert ou retour stock. Les sessions
        planifiées dans cette salle utilisent ce mobilier sans réservation unitaire.
        {roomCapacity ? ` Capacité déclarée : ${roomCapacity} places.` : ''}
      </p>

      <RoomEquipmentDispatchGuide
        roomId={roomId}
        onAssignCategory={(key, label) => openPicker({ key, label })}
      />

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Unités liées', value: String(summary.itemCount), icon: Package },
            { label: 'Valeur capitalisée', value: fmtEuro(summary.totalCapitalized), icon: Wallet },
            { label: 'Amortissement / an', value: fmtEuro(summary.annualAmortization), icon: Link2 },
          ].map((kpi) => (
            <Card key={kpi.label} className="shadow-none border border-border/60">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
                <p className="mt-1 text-lg font-bold tabular-nums">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <Card className="shadow-none border border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">Unités fixées dans cette salle</CardTitle>
          <Button size="sm" variant="outline" onClick={() => openPicker()}>
            <Plus className="size-4" />
            Lier une unité
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unité</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Valeur</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : (data?.items.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Aucune unité liée — utilisez l&apos;assistant ci-dessus ou « Lier une unité ».
                  </TableCell>
                </TableRow>
              ) : (
                data!.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <p className="font-medium">{row.equipment.label}</p>
                      <p className="text-xs font-mono text-muted-foreground">{row.equipment.serialNumber}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {row.equipment.typeLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmtEuro(row.equipment.totalCapitalized)}</TableCell>
                    <TableCell className="text-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => removeMutation.mutate(row.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={pickerOpen}
        onOpenChange={(open) => {
          setPickerOpen(open);
          if (!open) setAssignCatalog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {assignCatalog
                ? `Lier — ${assignCatalog.label}`
                : 'Lier une unité au mobilier fixe'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Seules les unités <strong>disponibles</strong> du stock global (non déjà en salle ni en
            session) sont proposées.
          </p>
          <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
            <SelectTrigger>
              <SelectValue
                placeholder={
                  unitsLoading
                    ? 'Chargement…'
                    : availableOptions.length
                      ? 'Choisir une unité'
                      : 'Aucune unité libre pour cette catégorie'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableOptions.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.serialNumber} — {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={!selectedEquipmentId || assignMutation.isPending}
              onClick={() => assignMutation.mutate(selectedEquipmentId)}
            >
              Lier à la salle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
