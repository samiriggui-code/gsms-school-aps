'use client';

import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import {
  getInventaireActivityChannel,
} from '@/lib/inventaire-activity';
import { Loader2, AlertCircle, Calendar, Printer, Package, Wrench, History, Settings, FileText, Info, ShieldCheck } from 'lucide-react';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_LARGE } from '../../../constants/sheet-shell-classes';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Equipment as Inventaire, EquipmentStatus } from '@/app/models/equipment';
import { cn } from '@/lib/utils';
import { getInventaireStatusProps } from '../constants/status';
import { usePusher } from '@/hooks/use-pusher';
import { formatDateTime, toAbsoluteUrl, getAvatarUrl } from '@/lib/helpers';

// Imports des composants modernisés
import { InventaireDetailsOverview } from './inventaire-details-overview'; 
import { InventaireDetailsActivity } from './inventaire-details-activity';
import { InventaireDetailsSettings } from './inventaire-details-settings';
import { InventaireDetailsCompliance } from './inventaire-details-compliance';
import { InventaireDetailsDocuments } from './inventaire-details-documents';
import { InventaireDetailsMovements } from './inventaire-details-movements';
import { InventaireDetailsMaintenance } from './inventaire-details-maintenance';
import { InventaireDetailsAffectations } from './inventaire-details-affectations';
import {
  InventaireCatalogUnitsTable,
  type CatalogUnitRow,
} from './inventaire-catalog-units-table';
import { EQUIPMENT_HEADQUARTERS_SITE_NAME } from '@/lib/equipment-catalog';

interface InventaireDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventaire: Inventaire | null;
  onEditClick?: () => void;
  defaultTab?: string;
}

const escapeHtml = (value: any) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const InventaireFicheTemplate = ({ 
  inventaire, 
  companyProfile 
}: { 
  inventaire: Inventaire; 
  companyProfile: any;
}) => {
  const companyLogo = companyProfile?.companyProfile?.logo || toAbsoluteUrl('/media/app/default-logo.svg');
  const companyName = companyProfile?.companyProfile?.companyName || companyProfile?.tenant?.name || 'LMS';
  
  const formatDateFr = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  return (
    <div className="fiche-doc fiche-print w-full bg-white p-8 text-slate-900" style={{ width: '100%', margin: 0, fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
        <div className="flex gap-4 items-center">
          <div className="w-[72px] h-[72px] flex items-center justify-center border border-slate-200 overflow-hidden rounded-lg bg-[#f8fafc]">
             {companyLogo ? (
               <img src={companyLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
             ) : (
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">LOGO</span>
             )}
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter leading-none text-slate-900">{companyName}</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Fiche Technique Équipement</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Date d'édition</div>
          <div className="text-xs font-bold text-slate-900">{new Date().toLocaleDateString('fr-FR')}</div>
          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID Système</div>
          <div className="text-xs font-bold text-slate-900 uppercase">{inventaire.id.substring(0, 12)}</div>
        </div>
      </div>

      {/* Equipment Header */}
      <div className="grid grid-cols-12 gap-6 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="col-span-4 flex items-center">
          <div className="aspect-square w-full max-w-[230px] bg-white border-2 border-slate-900 rounded-lg overflow-hidden shadow-sm flex flex-col items-center justify-center">
            <Package className="size-20 text-slate-200" />
            <span className="text-[10px] font-black text-slate-300 uppercase mt-2">{inventaire.label.substring(0, 3)}</span>
          </div>
        </div>
        
        <div className="col-span-8 flex flex-col justify-center">
          <div className="mb-2">
            <div className="flex gap-2 mb-0.5">
              <span className="px-1 py-0.5 bg-slate-900 text-white text-[7px] font-black uppercase tracking-widest rounded">
                {inventaire.type || 'ÉQUIPEMENT'}
              </span>
              <span className={`px-1 py-0.5 text-[7px] font-black uppercase tracking-widest rounded border ${inventaire.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {inventaire.status}
              </span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none text-slate-900">
              {inventaire.label}
            </h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight mt-0.5">S/N: {inventaire.serialNumber}</p>
          </div>
          
          <div className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-1.5">
            <div>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Site affecté</p>
              <p className="text-[9px] font-bold text-slate-900 uppercase">{inventaire.assignedSite?.name || 'Non affecté'}</p>
            </div>
            <div>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Domaine</p>
              <p className="text-[9px] font-bold text-slate-900 uppercase">{inventaire.metadata?.pedagogicDomain || 'Sécurité'}</p>
            </div>
            <div>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Date acquisition</p>
              <p className="text-[9px] font-bold text-slate-900 uppercase">{formatDateFr(inventaire.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-10 gap-y-6">
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-900 rounded-full" />
            Spécifications Techniques
          </h3>
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Libellé</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{inventaire.label}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">N° de Série</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{inventaire.serialNumber}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Type</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{inventaire.type || '-'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-900 rounded-full" />
            Maintenance & État
          </h3>
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Statut actuel</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{inventaire.status}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Interventions</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{inventaire._count?.maintenanceItems || 0}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Dernière mise à jour</span>
              <span className="text-[10px] font-bold text-slate-900">{formatDateFr(inventaire.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function InventaireDetailsSheet({
  open,
  onOpenChange,
  inventaire: initialInventaire,
  onEditClick,
  defaultTab = 'overview',
}: InventaireDetailsSheetProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [inventaire, setInventaire] = useState<Inventaire | null>(initialInventaire);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unitSheetOpen, setUnitSheetOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<CatalogUnitRow | null>(null);
  const [unitSheetDefaultTab, setUnitSheetDefaultTab] = useState('overview');
  const [catalogUnitCount, setCatalogUnitCount] = useState<number | null>(null);
  const settingsFormRef = useRef<HTMLFormElement>(null);
  const complianceFormRef = useRef<HTMLFormElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const fetchSeqRef = useRef(0);

  useEffect(() => {
    if (open) {
      const isCatalog =
        (initialInventaire as { isCatalogEntry?: boolean })?.isCatalogEntry;
      let tab = defaultTab === 'pieces' ? 'inventaire' : defaultTab;
      if (isCatalog && (tab === 'affectations' || tab === 'maintenance')) {
        tab = 'overview';
      }
      setActiveTab(tab);
    }
  }, [open, defaultTab, initialInventaire]);

  useEffect(() => {
    if (open && initialInventaire?.id) {
      setInventaire(initialInventaire);
      void fetchInventaire();
      void fetchCompanyProfile();
    }
    if (!open) {
      setUnitSheetOpen(false);
      setSelectedUnit(null);
    }
  }, [
    open,
    initialInventaire?.id,
    (initialInventaire as { catalogKey?: string } | null)?.catalogKey,
    initialInventaire?.label,
  ]);

  const handleOpenUnitSheet = (unit: CatalogUnitRow, tab = 'overview') => {
    setSelectedUnit(unit);
    setUnitSheetDefaultTab(tab);
    setUnitSheetOpen(true);
  };

  const isCatalogMode = Boolean(
    (initialInventaire as { isCatalogEntry?: boolean })?.isCatalogEntry ||
      (inventaire as { isCatalogEntry?: boolean })?.isCatalogEntry,
  );
  const catalogLabel =
    (initialInventaire as { catalogKey?: string })?.catalogKey ||
    initialInventaire?.label ||
    (inventaire as { catalogKey?: string })?.catalogKey ||
    inventaire?.label ||
    '';

  const fetchInventaire = async (labelOverride?: string) => {
    const source = initialInventaire;
    if (!source?.id) return;

    const requestSeq = ++fetchSeqRef.current;
    setIsLoading(true);
    try {
      const catalogQueryLabel =
        labelOverride ||
        (source as { catalogKey?: string })?.catalogKey ||
        source.label ||
        '';

      if ((source as { isCatalogEntry?: boolean }).isCatalogEntry && catalogQueryLabel) {
        const params = new URLSearchParams({
          mode: 'catalog-units',
          label: catalogQueryLabel,
        });
        const response = await apiFetch(
          `/api/sections/gestion-ressources/equipements/inventaire?${params.toString()}`,
        );
        if (requestSeq !== fetchSeqRef.current) return;

        if (response.ok) {
          const { data: catalog } = await response.json();
          const representative = catalog.units?.[0] ?? source;
          const resolvedLabel =
            catalog.label ?? catalog.catalogKey ?? catalogQueryLabel;
          setCatalogUnitCount(catalog.units?.length ?? null);
          setInventaire({
            ...representative,
            id: representative.id ?? source.id,
            label: resolvedLabel,
            type: representative.type ?? source.type,
            avatar: representative.avatar ?? source.avatar,
            metadata: representative.metadata ?? source.metadata,
            serialNumber: source.serialNumber ?? representative.serialNumber,
            isCatalogEntry: true,
            catalogKey: resolvedLabel,
            unitCount: catalog.units?.length ?? 0,
            stockStats: catalog.stockStats,
            assignedSite: { name: EQUIPMENT_HEADQUARTERS_SITE_NAME },
            updatedAt: representative?.updatedAt ?? source.updatedAt,
          } as Inventaire);
        }
        return;
      }

      const response = await apiFetch(
        `/api/sections/gestion-ressources/equipements/inventaire/${source.id}`,
      );
      if (requestSeq !== fetchSeqRef.current) return;

      if (response.ok) {
        const data = await response.json();
        const equipment = data.data;

        if (!equipment.avatar && equipment.metadata?.avatar) {
          equipment.avatar = equipment.metadata.avatar;
        }

        setInventaire(equipment);
      }
    } catch (error) {
      console.error('Erreur fetching equipment:', error);
    } finally {
      if (requestSeq === fetchSeqRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleCatalogSettingsSuccess = (newCatalogLabel?: string) => {
    if (newCatalogLabel) {
      setInventaire((prev) =>
        prev
          ? ({
              ...prev,
              label: newCatalogLabel,
              catalogKey: newCatalogLabel,
            } as Inventaire)
          : prev,
      );
    }
    void fetchInventaire(newCatalogLabel);
  };

  const fetchCompanyProfile = async () => {
    try {
      const response = await apiFetch('/api/common/stats');
      if (response.ok) {
        const data = await response.json();
        setCompanyProfile(data.data);
      }
    } catch (error) {
      console.error("Erreur company profile:", error);
    }
  };

  usePusher(
    session?.user?.id,
    () => {
      void fetchInventaire();
    },
    {
      channelName:
        open &&
        ((session?.user as any)?.companyId || (session?.user as any)?.tenantId) &&
        (inventaire?.id || initialInventaire?.id)
          ? getInventaireActivityChannel(
              (session?.user as any)?.companyId || (session?.user as any)?.tenantId,
              inventaire?.id || initialInventaire!.id,
            )
          : undefined,
      eventName: 'equipment-activity',
      enabled: Boolean(
        open &&
          session?.user?.id &&
          ((session?.user as any)?.companyId || (session?.user as any)?.tenantId) &&
          (inventaire?.id || initialInventaire?.id),
      ),
    },
  );

  if (!inventaire) return null;

  const handleSaveSettings = () => {
    if (activeTab === 'conformite' && complianceFormRef.current) {
      complianceFormRef.current.requestSubmit();
      return;
    }
    if ((activeTab === 'settings' || activeTab === 'parametres') && settingsFormRef.current) {
      settingsFormRef.current.requestSubmit();
    }
  };

  const showSaveFooter =
    activeTab === 'settings' ||
    (isCatalogMode && (activeTab === 'conformite' || activeTab === 'parametres'));

  const statusProps = getInventaireStatusProps(inventaire.status);

  const handleEditClick = () => {
    setActiveTab('settings');
    if (onEditClick) onEditClick();
  };

  const handlePrintInventaireFiche = () => {
    if (typeof window !== 'undefined' && printRef.current) {
      const printTarget = printRef.current;
      const headMarkup = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((node) => node.outerHTML)
        .join('\n');

      const printFrame = document.createElement('iframe');
      printFrame.setAttribute('aria-hidden', 'true');
      printFrame.style.position = 'fixed';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.border = '0';
      printFrame.style.opacity = '0';

      const cleanup = () => {
        window.setTimeout(() => {
          printFrame.remove();
        }, 150);
      };

      const printHtml = `
        <!DOCTYPE html>
        <html lang="fr">
          <head>
            <meta charset="utf-8" />
            <title>Fiche Équipement - ${escapeHtml(inventaire?.label || '')}</title>
            ${headMarkup}
            <style>
              @media print {
                @page { size: A4; margin: 15mm; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${printTarget.innerHTML}
          </body>
        </html>
      `;

      printFrame.addEventListener('load', () => {
        const frameWindow = printFrame.contentWindow;
        if (!frameWindow) {
          cleanup();
          return;
        }
        frameWindow.onafterprint = cleanup;
        window.setTimeout(() => {
          frameWindow.focus();
          frameWindow.print();
        }, 300);
      }, { once: true });

      document.body.appendChild(printFrame);
      printFrame.srcdoc = printHtml;
    }
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE}>
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-background shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
            {isCatalogMode ? 'Fiche catégorie — Catalogue' : "Détails de l'équipement"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {isCatalogMode
              ? 'Consultez la catégorie, son inventaire et ses paramètres.'
              : "Consultez les détails, l'historique et la maintenance de cet équipement."}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
            <div className="flex justify-between flex-wrap gap-2 border-b border-border px-5 py-5 bg-background shrink-0">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="lg:text-[24px] font-bold text-foreground tracking-tight leading-none">
                  {inventaire.label}
                </span>
                {!isCatalogMode && (
                  <Badge size="sm" variant={statusProps.variant as any} appearance="light" className="font-bold uppercase text-[10px] px-2">
                    {statusProps.label}
                  </Badge>
                )}
                {isCatalogMode && (
                  <Badge size="sm" variant="outline" appearance="light" className="font-bold uppercase text-[10px] px-2">
                    {catalogUnitCount ??
                      (inventaire as { unitCount?: number }).unitCount ??
                      ((inventaire as any).stockStats?.currentStock ?? 0) +
                        ((inventaire as any).stockStats?.totalIn ?? 0) +
                        ((inventaire as any).stockStats?.totalOut ?? 0)}{' '}
                    pièces
                  </Badge>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-2 text-2sm">
                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
                  <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                    {isCatalogMode ? 'Réf. catégorie' : 'S/N'}
                  </span>
                  <span className="font-bold text-foreground/80">{inventaire.serialNumber}</span>
                </div>
                <BadgeDot className="bg-muted-foreground/30 size-1" />
                <span className="font-normal text-muted-foreground">
                  Type:
                </span>
                <span className="font-bold text-foreground/80">
                  {inventaire.type || '-'}
                </span>
                <BadgeDot className="bg-muted-foreground/30 size-1" />
                <span className="font-normal text-muted-foreground italic">
                  Site:
                </span>
                <span className="font-bold text-primary tracking-wide">
                  {isCatalogMode
                    ? EQUIPMENT_HEADQUARTERS_SITE_NAME
                    : inventaire.assignedSite?.name || EQUIPMENT_HEADQUARTERS_SITE_NAME}
                </span>
                <BadgeDot className="bg-muted-foreground/30 size-1" />
                <span className="font-normal text-muted-foreground">
                  Dernière mise à jour:
                </span>
                <span className="font-semibold text-foreground/80">
                  {inventaire.updatedAt && !Number.isNaN(new Date(inventaire.updatedAt).getTime())
                    ? formatDateTime(new Date(inventaire.updatedAt))
                    : '—'}
                </span>
              </div>
            </div>
          </div>
          <ScrollArea
            className="flex-1 min-h-0 mx-1.5"
            viewportClassName="[&>div]:h-full [&>div>div]:h-full"
          >
            <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
              <div className="w-full shrink-0 lg:w-[280px] py-5 lg:pe-5 space-y-4">
                <div className="w-full h-[240px] bg-muted/10 border border-border rounded-lg flex items-center justify-center overflow-hidden relative">
                  {inventaire.avatar || (inventaire.metadata as any)?.avatar ? (
                    <img 
                      src={getAvatarUrl(inventaire.avatar || (inventaire.metadata as any)?.avatar)} 
                      alt={inventaire.label} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={cn("flex flex-col items-center gap-2 fallback-icon", (inventaire.avatar || (inventaire.metadata as any)?.avatar) ? "hidden" : "")}>
                    <Package className="size-[60px] text-muted-foreground/40" />
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{inventaire.label.substring(0, 3)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Libellé', value: inventaire.label },
                    {
                      label: isCatalogMode ? 'Réf. catégorie' : 'S/N',
                      value: inventaire.serialNumber,
                    },
                    { label: 'Type', value: inventaire.type || '-' },
                    {
                      label: 'Entrepôt',
                      value: EQUIPMENT_HEADQUARTERS_SITE_NAME,
                    },
                    ...(isCatalogMode
                      ? []
                      : [{ label: 'ID Système', value: inventaire.id.substring(0, 8) }]),
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-2sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold text-foreground truncate max-w-[150px]">{item.value}</span>
                    </div>
                  ))}
                </div>
                
                <div className="bg-muted/10 border border-border/50 rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between text-2sm">
                        <span className="text-muted-foreground font-medium">Total en Stock (Modèle)</span>
                        <Badge variant="outline" className="font-bold h-4.5 px-1.5 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100">
                            {(inventaire as any).stockStats?.currentStock || 0}
                        </Badge>
                    </div>
                    {!isCatalogMode && (
                    <div className="flex items-center justify-between text-2sm">
                        <span className="text-muted-foreground font-medium">État de cette unité</span>
                        <Badge variant={inventaire.status === 'AVAILABLE' ? 'success' : 'outline'} className="font-bold h-4.5 px-1.5 text-[10px]">
                            {inventaire.status === 'AVAILABLE' ? 'DISPONIBLE' : 
                             inventaire.status === 'IN_USE' ? 'EN UTILISATION' : 
                             inventaire.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'HORS SERVICE'}
                        </Badge>
                    </div>
                    )}
                    {!isCatalogMode && (
                    <div 
                      className="flex items-center justify-between text-2sm cursor-pointer hover:bg-muted/50 transition-colors p-1 -m-1 rounded"
                      onClick={() => setActiveTab('mouvements')}
                    >
                        <span className="text-muted-foreground">Mouvements</span>
                        <span className="font-semibold text-foreground">{inventaire._count?.stockMovements || 0}</span>
                    </div>
                    )}
                    {!isCatalogMode && (
                    <div 
                      className="flex items-center justify-between text-2sm cursor-pointer hover:bg-muted/50 transition-colors p-1 -m-1 rounded"
                      onClick={() => setActiveTab('affectations')}
                    >
                        <span className="text-muted-foreground">Affectations (sessions)</span>
                        <span className="font-semibold text-foreground">{(inventaire as any).stockStats?.totalIn || 0}</span>
                    </div>
                    )}
                    {!isCatalogMode && (
                    <div 
                      className="flex items-center justify-between text-2sm cursor-pointer hover:bg-muted/50 transition-colors p-1 -m-1 rounded"
                      onClick={() => setActiveTab('maintenance')}
                    >
                        <span className="text-muted-foreground">Maintenances</span>
                        <span className="font-semibold text-foreground">
                          {inventaire._count?.maintenanceItems || 0}
                        </span>
                    </div>
                    )}
                    {isCatalogMode && (
                    <div 
                      className="flex items-center justify-between text-2sm cursor-pointer hover:bg-muted/50 transition-colors p-1 -m-1 rounded"
                      onClick={() => setActiveTab('inventaire')}
                    >
                        <span className="text-muted-foreground">Inventaire</span>
                        <span className="font-semibold text-foreground">{(inventaire as any).stockStats?.currentStock || 0}</span>
                    </div>
                    )}
                    {isCatalogMode && (
                    <>
                    <div 
                      className="flex items-center justify-between text-2sm cursor-pointer hover:bg-muted/50 transition-colors p-1 -m-1 rounded"
                      onClick={() => setActiveTab('parametres')}
                    >
                        <span className="text-muted-foreground">Paramètres</span>
                        <Settings className="size-3.5 text-primary" />
                    </div>
                    <div 
                      className="flex items-center justify-between text-2sm cursor-pointer hover:bg-muted/50 transition-colors p-1 -m-1 rounded"
                      onClick={() => setActiveTab('conformite')}
                    >
                        <span className="text-muted-foreground">Conformité</span>
                        <ShieldCheck className="size-3.5 text-primary" />
                    </div>
                    </>
                    )}
                </div>
              </div>

              <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-5">   
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto text-sm text-muted-foreground">
                  <TabsList className="inline-flex w-auto grow-0 mb-2.5 flex-wrap">
                    <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                    {isCatalogMode && (
                      <TabsTrigger value="inventaire">Inventaire</TabsTrigger>
                    )}
                    {isCatalogMode && (
                      <TabsTrigger value="conformite" className="gap-1.5">
                        <ShieldCheck className="size-3.5" />
                        Conformité
                      </TabsTrigger>
                    )}
                    {isCatalogMode && (
                      <TabsTrigger value="parametres" className="gap-1.5">
                        <Settings className="size-3.5" />
                        Paramètres
                      </TabsTrigger>
                    )}
                    {!isCatalogMode && (
                      <>
                    <TabsTrigger value="affectations">Affectations</TabsTrigger>
                    <TabsTrigger value="maintenance">Maintenances</TabsTrigger>
                      </>
                    )}
                    {!isCatalogMode && (
                      <>
                        <TabsTrigger value="mouvements">Mouvements</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="activity">Journal</TabsTrigger>
                        <TabsTrigger value="settings">Paramètres</TabsTrigger>
                      </>
                    )}
                  </TabsList>
                  <TabsContent value="overview">
                    <InventaireDetailsOverview
                      equipment={inventaire}
                      onTabChange={setActiveTab}
                      settingsTab={isCatalogMode ? 'parametres' : 'settings'}
                      isCatalogMode={isCatalogMode}
                    />
                  </TabsContent>
                  {isCatalogMode && catalogLabel && (
                    <TabsContent value="inventaire">
                      <InventaireCatalogUnitsTable
                        catalogLabel={catalogLabel}
                        emptyMessage="Aucune unité enregistrée pour cette catégorie."
                        onOpenUnit={(unit) => handleOpenUnitSheet(unit, 'overview')}
                        onEditUnit={(unit) => handleOpenUnitSheet(unit, 'settings')}
                      />
                    </TabsContent>
                  )}
                  {isCatalogMode && (
                    <TabsContent value="conformite">
                      <InventaireDetailsCompliance
                        inventaire={inventaire}
                        formRef={complianceFormRef}
                        onSuccess={fetchInventaire}
                        isCatalogMode
                      />
                    </TabsContent>
                  )}
                  {isCatalogMode && (
                    <TabsContent value="parametres">
                      <InventaireDetailsSettings
                        inventaire={inventaire}
                        formRef={settingsFormRef}
                        onSuccess={handleCatalogSettingsSuccess}
                        catalogMode
                        catalogLabel={catalogLabel}
                      />
                    </TabsContent>
                  )}
                  {!isCatalogMode && (
                  <TabsContent value="mouvements">
                    <InventaireDetailsMovements equipment={inventaire} />
                  </TabsContent>
                  )}
                  {!isCatalogMode && (
                  <TabsContent value="affectations">
                      <InventaireDetailsAffectations equipment={inventaire} />
                  </TabsContent>
                  )}
                  {!isCatalogMode && (
                  <TabsContent value="maintenance">
                      <InventaireDetailsMaintenance equipment={inventaire} />
                  </TabsContent>
                  )}
                  {!isCatalogMode && (
                  <>
                  <TabsContent value="documents">
                    <InventaireDetailsDocuments inventaire={inventaire} companyProfile={companyProfile} />
                  </TabsContent>
                  <TabsContent value="activity">
                    <InventaireDetailsActivity equipment={inventaire} />
                  </TabsContent>
                  <TabsContent value="settings">
                    <InventaireDetailsSettings 
                      inventaire={inventaire} 
                      formRef={settingsFormRef} 
                      onSuccess={fetchInventaire}
                    />
                  </TabsContent>
                  </>
                  )}
                </Tabs>
              </div>
            </div>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="flex-row border-t pb-4 p-5 border-border gap-2.5 lg:gap-0 bg-background shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Fermer</Button>
          <div className="flex gap-2.5 ml-auto">
            {showSaveFooter ? (
              <Button 
                variant="outline" 
                className="bg-foreground text-background hover:bg-foreground/90 font-bold border-none" 
                onClick={handleSaveSettings}
              >
                {activeTab === 'conformite'
                  ? 'Enregistrer la conformité'
                  : activeTab === 'parametres'
                    ? 'Enregistrer la catégorie'
                    : 'Enregistrer les paramètres'}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handlePrintInventaireFiche} className="font-bold border-none bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <Printer className="size-4" />
                  Fiche Technique
                </Button>
              </>
            )}
          </div>
        </SheetFooter>
      </SheetContent>

      {/* Hidden print template */}
      <div className="hidden">
        <div ref={printRef}>
          <InventaireFicheTemplate inventaire={inventaire} companyProfile={companyProfile} />
        </div>
      </div>
    </Sheet>

    <InventaireDetailsSheet
      open={unitSheetOpen}
      onOpenChange={setUnitSheetOpen}
      inventaire={
        selectedUnit
          ? ({
              id: selectedUnit.id,
              serialNumber: selectedUnit.serialNumber,
              label: selectedUnit.label,
              type: selectedUnit.type,
              status: selectedUnit.status,
              isCatalogEntry: false,
            } as unknown as Inventaire)
          : null
      }
      defaultTab={unitSheetDefaultTab}
    />
    </>
  );
}
