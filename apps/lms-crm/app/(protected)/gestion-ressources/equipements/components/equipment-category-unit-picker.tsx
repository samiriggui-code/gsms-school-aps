'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@repo/ui/badge';
import { ScrollArea } from '@repo/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { EquipmentThumbnail } from '../inventaire/components/equipment-thumbnail';
import { getInventaireStatusProps } from '../inventaire/constants/status';
import type { EquipmentStatus } from '@/app/models/equipment';
import {
  extractUnitIndex,
  formatEquipmentUnitReference,
} from '@/lib/equipment-catalog';

export type CatalogCategoryOption = {
  id: string;
  label: string;
  catalogKey: string;
  serialNumber: string;
  type: string | null;
  avatar?: string | null;
  unitCount?: number;
};

export type CatalogUnitOption = {
  id: string;
  label: string;
  serialNumber: string;
  status: EquipmentStatus;
  unitIndex: number | null;
};

type EquipmentCategoryUnitPickerProps = {
  selectedCategoryKey: string | null;
  onCategoryChange: (category: CatalogCategoryOption | null) => void;
  selectedUnitId: string | null;
  onUnitChange: (unit: CatalogUnitOption | null) => void;
  /** Ne proposer que les pièces avec ce statut (ex. AVAILABLE pour affectation) */
  unitStatusFilter?: EquipmentStatus | EquipmentStatus[];
  className?: string;
};

export function EquipmentCategoryUnitPicker({
  selectedCategoryKey,
  onCategoryChange,
  selectedUnitId,
  onUnitChange,
  unitStatusFilter,
  className,
}: EquipmentCategoryUnitPickerProps) {
  const [categoryQuery, setCategoryQuery] = useState('');

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['equipment-catalog-picker'],
    queryFn: async () => {
      const params = new URLSearchParams({ mode: 'catalog', limit: '100', page: '1' });
      const res = await apiFetch(
        `/api/sections/gestion-ressources/equipements/inventaire?${params}`,
      );
      if (!res.ok) throw new Error('Catalogue indisponible');
      const json = await res.json();
      const rows = json?.data?.data ?? [];
      return rows.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        label: String(row.label),
        catalogKey: String((row as { catalogKey?: string }).catalogKey ?? row.label),
        serialNumber: String(row.serialNumber ?? ''),
        type: (row.type as string) ?? null,
        avatar: (row.avatar as string) ?? null,
        unitCount: (row as { unitCount?: number }).unitCount,
      })) as CatalogCategoryOption[];
    },
  });

  const { data: units = [], isLoading: unitsLoading } = useQuery({
    queryKey: ['equipment-catalog-units-picker', selectedCategoryKey],
    queryFn: async () => {
      if (!selectedCategoryKey) return [];
      const params = new URLSearchParams({
        mode: 'catalog-units',
        catalogKey: selectedCategoryKey,
      });
      const res = await apiFetch(
        `/api/sections/gestion-ressources/equipements/inventaire?${params}`,
      );
      if (!res.ok) throw new Error('Unités indisponibles');
      const json = await res.json();
      const list = json?.data?.units ?? [];
      return list.map((u: Record<string, unknown>) => ({
        id: String(u.id),
        label: String(u.label),
        serialNumber: String(u.serialNumber),
        status: u.status as EquipmentStatus,
        unitIndex:
          (u as { unitIndex?: number }).unitIndex ??
          extractUnitIndex(String(u.serialNumber)),
      })) as CatalogUnitOption[];
    },
    enabled: Boolean(selectedCategoryKey),
  });

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.serialNumber.toLowerCase().includes(q),
    );
  }, [categories, categoryQuery]);

  const filteredUnits = useMemo(() => {
    if (!unitStatusFilter) return units;
    const allowed = Array.isArray(unitStatusFilter)
      ? unitStatusFilter
      : [unitStatusFilter];
    return units.filter((u) => allowed.includes(u.status));
  }, [units, unitStatusFilter]);

  const selectedCategory = categories.find(
    (c) => c.catalogKey === selectedCategoryKey,
  );

  return (
    <div className={cn('space-y-6', className)}>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            1. Catégorie
          </h4>
          <input
            type="search"
            placeholder="Filtrer…"
            value={categoryQuery}
            onChange={(e) => setCategoryQuery(e.target.value)}
            className="h-8 w-40 rounded-md border border-border bg-background px-2 text-xs"
          />
        </div>
        {categoriesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[200px] rounded-lg border border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
              {filteredCategories.map((cat) => {
                const active = cat.catalogKey === selectedCategoryKey;
                return (
                  <button
                    key={cat.catalogKey}
                    type="button"
                    onClick={() => {
                      onCategoryChange(cat);
                      onUnitChange(null);
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-2 text-left transition-colors',
                      active
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    <EquipmentThumbnail
                      avatar={cat.avatar}
                      label={cat.label}
                      className="size-12 rounded-md shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{cat.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {cat.unitCount ?? '—'} pièce(s) · {cat.type ?? '—'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </section>

      {selectedCategory && (
        <section className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            2. Pièce à mobiliser
          </h4>
          {unitsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUnits.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4 text-center">
              Aucune pièce disponible pour cette catégorie avec les critères choisis.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {units.map((unit) => {
                const active = unit.id === selectedUnitId;
                const st = getInventaireStatusProps(unit.status);
                const idx = unit.unitIndex ?? extractUnitIndex(unit.serialNumber);
                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => onUnitChange(unit)}
                    className={cn(
                      'rounded-lg border p-3 text-left transition-colors',
                      active
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-bold">
                        Pièce {idx != null ? `${idx}` : '—'}
                      </span>
                      <Badge
                        size="sm"
                        variant={st.variant as 'success'}
                        appearance="light"
                        className="text-[9px]"
                      >
                        {st.label}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      {formatEquipmentUnitReference(unit.serialNumber, unit.label)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
