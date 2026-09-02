/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Card, CardContent } from "@repo/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { cn } from "@/lib/utils";


import { Equipment } from "@/app/models/equipment";

export function InventaireOverviewStats({
  equipment,
  isCatalogMode = false,
}: {
  equipment: Equipment;
  isCatalogMode?: boolean;
}) {
  const stats = (equipment as any).stockStats || {
    availableCount: 0,
    inUseCount: 0,
    maintenanceCount: 0,
  };
  const unitCount =
    (equipment as { unitCount?: number }).unitCount ??
    (stats.availableCount ?? stats.currentStock ?? 0) +
      (stats.inUseCount ?? stats.totalIn ?? 0) +
      (stats.maintenanceCount ?? stats.totalOut ?? 0);

  const items = [
    { 
      total: String(stats.availableCount ?? stats.currentStock ?? 0), 
      label: 'Disponibles',
      badgeLabel: (stats.availableCount ?? stats.currentStock) > 0 ? '100' : '0',
      badgeColor: (stats.availableCount ?? stats.currentStock) > 0 ? 'success' : 'outline',
      text: 'Par statut (pas mouvement IN)',
      number: '',
      icon: <TrendingUp className="size-3" />,
    }, 
    { 
      total: equipment._count?.stockMovements?.toString() || '0', 
      label: 'Mouvements ledger',
      badgeLabel: '100',
      badgeColor: 'success',
      text: 'Entrées / sorties historiques',
      number: '',
      icon: <TrendingUp className="size-3" />,
    }, 
    { 
      total: String(stats.inUseCount ?? stats.totalIn ?? 0), 
      label: 'En utilisation',
      badgeLabel: (stats.inUseCount ?? stats.totalIn) > 0 ? '100' : '0',
      badgeColor: (stats.inUseCount ?? stats.totalIn) > 0 ? 'success' : 'outline',
      text: 'Statut IN_USE',
      number: '',
      icon: <TrendingUp className="size-3" />,
    }, 
    { 
      total: String(stats.maintenanceCount ?? stats.totalOut ?? 0), 
      label: 'En maintenance',
      badgeLabel: (stats.maintenanceCount ?? stats.totalOut) > 0 ? '100' : '0',
      badgeColor: (stats.maintenanceCount ?? stats.totalOut) > 0 ? 'success' : 'outline',
      text: 'Statut MAINTENANCE',
      number: '',
      icon: <TrendingUp className="size-3" />,
    },
    ...(isCatalogMode
      ? [
          {
            total: unitCount.toString(),
            label: 'Pièces catalogue',
            badgeLabel: unitCount > 0 ? '100' : '0',
            badgeColor: unitCount > 0 ? 'success' : 'outline',
            text: 'Total catégorie',
            number: '',
            icon: <TrendingUp className="size-3" />,
          },
        ]
      : []),
  ];

  const visibleItems = isCatalogMode
    ? items.filter((item) => !['En utilisation', 'En maintenance', 'Mouvements ledger'].includes(item.label))
    : items;

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-5 mb-5',
        isCatalogMode ? 'md:grid-cols-2 lg:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4',
      )}
    >
      {visibleItems.map((item, index) => ( 
        <Card key={index} className="shadow-none border border-border/50 bg-background group hover:border-border transition-all duration-300">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                  {item.label}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground tracking-tight">
                    {item.total}
                  </span>
                  {item.number && (
                    <span className="text-sm font-semibold text-muted-foreground/60">
                      {item.number}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-2 rounded-lg border border-border/50 bg-background text-foreground/70">
                {item.icon}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-auto">
              <Badge 
                variant="outline" 
                size="sm" 
                className="font-bold text-[10px] px-1.5 py-0 border-border text-foreground/70"
              >
                {item.badgeColor === 'success' ? '+' : ''}{item.badgeLabel}%
              </Badge>
              <span className="text-[11px] font-medium text-muted-foreground">
                {item.text}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
