'use client';

import { Equipment, EquipmentStatus } from "@/app/models/equipment";
import { InventaireOverviewStats } from "./details/inventaire-overview-stats";
import { InventaireRecentActivity } from "./details/inventaire-recent-activity";
import { InventaireReliabilityTier } from "./details/inventaire-reliability-tier";
import { InventaireTechnicalInfo } from "./details/inventaire-technical-info";
import { Alert, AlertIcon, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Wrench } from "lucide-react";

export function InventaireDetailsOverview({ 
  equipment,
  onTabChange,
  settingsTab = 'settings',
  isCatalogMode = false,
  quickNavTabs,
}: { 
  equipment: Equipment,
  onTabChange: (tab: string) => void,
  settingsTab?: string,
  isCatalogMode?: boolean,
  quickNavTabs?: Array<{ label: string; tab: string }>,
}) {
  const isInMaintenance = !isCatalogMode && equipment.status === EquipmentStatus.MAINTENANCE;

  return (
    <div className="space-y-5">
      {isInMaintenance && (
        <Alert variant="warning" appearance="outline" className="border-border bg-background shadow-none animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertIcon>
            <Wrench className="size-4 text-warning" />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle className="text-foreground font-bold uppercase text-[11px] tracking-wider">Équipement en Maintenance</AlertTitle>
            <AlertDescription className="text-muted-foreground text-sm">
              Cet équipement est actuellement en cours de maintenance. Il n'est pas disponible pour l'affectation ou l'utilisation.
            </AlertDescription>
          </div>
        </Alert>
      )}

      <InventaireOverviewStats equipment={equipment} isCatalogMode={isCatalogMode} />
      
      {onTabChange && (
        <div className="flex flex-wrap gap-3">
          {quickNavTabs?.length ? (
            quickNavTabs.map((link) => (
              <button
                key={link.tab}
                type="button"
                onClick={() => onTabChange(link.tab)}
                className="text-xs font-bold text-primary hover:underline"
              >
                {link.label}
              </button>
            ))
          ) : settingsTab === 'parametres' ? (
            <>
              <button
                type="button"
                onClick={() => onTabChange('parametres')}
                className="text-xs font-bold text-primary hover:underline"
              >
                Paramètres de la catégorie →
              </button>
              <button
                type="button"
                onClick={() => onTabChange('conformite')}
                className="text-xs font-bold text-muted-foreground hover:text-primary hover:underline"
              >
                Conformité →
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onTabChange(settingsTab)}
              className="text-xs font-bold text-primary hover:underline"
            >
              {settingsTab === 'conformite'
                ? 'Modifier la conformité →'
                : 'Modifier les paramètres →'}
            </button>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2">
          <InventaireTechnicalInfo equipment={equipment} onTabChange={onTabChange} isCatalogMode={isCatalogMode} />
        </div>
        <div>
          <InventaireReliabilityTier equipment={equipment} />
        </div>
      </div>

      {!isCatalogMode && (
      <div className="grid lg:grid-cols-1 gap-5">
        <InventaireRecentActivity equipment={equipment} onSeeAll={() => onTabChange('activity')} />
      </div>
      )}
    </div>
  );
}
