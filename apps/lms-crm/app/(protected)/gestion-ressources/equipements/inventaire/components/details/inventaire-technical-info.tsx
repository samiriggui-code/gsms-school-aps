'use client';

import { Equipment } from "@/app/models/equipment";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Settings, 
  FileText, 
  Clock, 
  Info,
  ShieldCheck,
  Hash,
  Package
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getEquipmentTypeLabel,
  getPedagogicDomainLabel,
} from "@/lib/equipment-constants";
import type { EquipmentMetadata } from "../../../forms/equipment-metadata-schema";

interface InventaireTechnicalInfoProps {
  equipment: Equipment;
  onTabChange?: (tab: string) => void;
  isCatalogMode?: boolean;
}

export function InventaireTechnicalInfo({
  equipment,
  onTabChange,
  isCatalogMode = false,
}: InventaireTechnicalInfoProps) {
  const meta = (equipment.metadata ?? {}) as EquipmentMetadata;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Non renseigné";
    try {
      return format(new Date(date), "dd MMMM yyyy", { locale: fr });
    } catch {
      return "Format invalide";
    }
  };

  return (
    <Card className="shadow-none border border-border/60 bg-background">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/50 bg-background">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2.5 text-foreground">
          <div className="p-2 rounded-lg bg-background border border-border">
            <Settings className="size-4 text-foreground/70" />
          </div>
          Spécifications Techniques & Localisation
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 p-6">
        <div className="grid sm:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Caractéristiques</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Package className="size-3.5" />
                    <span className="font-medium">Type d&apos;équipement</span>
                </div>
                <Badge variant="outline" size="sm" className="font-bold text-foreground/80 uppercase text-[10px]">{getEquipmentTypeLabel(equipment.type)}</Badge>
              </div>
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Hash className="size-3.5" />
                    <span className="font-medium">Numéro de série</span>
                </div>
                <span className="font-bold text-foreground">{equipment.serialNumber}</span>
              </div>
              <div className="flex items-center justify-between text-2sm">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Info className="size-3.5" />
                    <span className="font-medium">Domaine</span>
                </div>
                <span className="font-semibold text-foreground uppercase text-[10px]">{getPedagogicDomainLabel(meta.pedagogicDomain)}</span>
              </div>
              {(meta.brand || meta.model) && (
                <div className="flex items-center justify-between text-2sm pt-2 border-t border-dashed border-border/60">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <FileText className="size-3.5" />
                    <span className="font-medium">Marque / modèle</span>
                  </div>
                  <span className="font-semibold text-foreground text-[10px]">
                    {[meta.brand, meta.model].filter(Boolean).join(' — ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Localisation</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <MapPin className="size-3.5" />
                    <span className="font-medium">Site affecté</span>
                </div>
                <span className="font-semibold text-foreground">{equipment.assignedSite?.name || 'Campus Principal Reuil'}</span>
              </div>
              {meta.storageRoom && (
                <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <MapPin className="size-3.5" />
                    <span className="font-medium">Salle / zone</span>
                  </div>
                  <span className="font-semibold text-foreground">{meta.storageRoom}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-2sm">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Clock className="size-3.5" />
                    <span className="font-medium">Dernière mise à jour</span>
                </div>
                <span className="font-semibold text-foreground">{formatDate(equipment.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border/60">
          <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Maintenance & État</h4>
          </div>
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <ShieldCheck className="size-3.5" />
                    <span className="font-medium">Statut opérationnel</span>
                </div>
                <Badge variant={equipment.status === 'AVAILABLE' ? 'success' : 'warning'} size="sm" className="font-bold">
                  {equipment.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span className="font-medium">Date d&apos;achat</span>
                </div>
                <span className="font-semibold text-foreground">{formatDate(meta.purchaseDate || equipment.createdAt)}</span>
              </div>
              {meta.acquisitionCost != null && Number(meta.acquisitionCost) > 0 ? (
                <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                  <span className="text-muted-foreground font-medium">Coût acquisition</span>
                  <span className="font-semibold text-foreground">
                    {Number(meta.acquisitionCost).toLocaleString('fr-FR')} €
                  </span>
                </div>
              ) : null}
              {meta.nextControlDate && (
                <div className="flex items-center justify-between text-2sm">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <ShieldCheck className="size-3.5" />
                    <span className="font-medium">Prochain contrôle</span>
                  </div>
                  <span className="font-semibold text-foreground">{formatDate(meta.nextControlDate)}</span>
                </div>
              )}
            </div>
            {!isCatalogMode && (
            <div className="space-y-3">
              <div 
                className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60 cursor-pointer hover:bg-muted/30 transition-colors p-1 -m-1 rounded"
                onClick={() => onTabChange?.('maintenance')}
              >
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <FileText className="size-3.5" />
                    <span className="font-medium">Historique maintenances</span>
                </div>
                <span className="font-semibold text-foreground">{equipment._count?.maintenanceItems || 0} intervention(s)</span>
              </div>
            </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
