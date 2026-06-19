'use client';

import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import {
  Certification_ACTIVITY_EVENT,
  getCertificationActivityChannel,
} from '@/lib/certification-activity';
import { Loader2, UserIcon, AlertCircle, Calendar, Printer } from 'lucide-react';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_LARGE } from '../../constants/sheet-shell-classes';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User as Certification, UserStatus } from '@/app/models/user';
import { getCertificationStatusProps } from '../constants/status';
import { usePusher } from '@/hooks/use-pusher';
import { formatDateTime, toAbsoluteUrl, getAvatarUrl, getInitials } from '@/lib/helpers';

// Imports des composants modernisÃ©s
import { CertificationDetailsOverview } from './certification-details-overview'; 
import { CertificationDetailsPermissions } from './certification-details-permissions'; 
import { CertificationDetailsActivity } from './certification-details-activity';
import { CertificationDetailsSettings } from './certification-details-settings';
import { CertificationDetailsAbsences } from './certification-details-absences';
import { CertificationDetailsCompliance } from './certification-details-compliance';
import { CertificationDetailsDocuments } from './certification-details-documents';

interface CertificationDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  Certification: Certification | null;
  onEditClick?: () => void;
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

const CertificationFicheTemplate = ({ 
  Certification, 
  companyProfile 
}: { 
  Certification: Certification; 
  companyProfile: any;
}) => {
  const companyLogo = companyProfile?.companyProfile?.logo || toAbsoluteUrl('/media/app/default-logo.svg');
  const companyName = companyProfile?.companyProfile?.companyName || companyProfile?.tenant?.name || 'LMS';
  const badgeNumber = Certification.carteProNumber
    ? Certification.carteProNumber.length >= 7
      ? Certification.carteProNumber.slice(-7)
      : Certification.carteProNumber
    : null;
  
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

  const calculateSeniority = (startDate: Date | string | null | undefined) => {
    if (!startDate) return '-';
    try {
      const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
      if (isNaN(start.getTime())) return '-';
      const years = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      if (years < 1) {
        const months = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        return `${months} mois`;
      }
      return `${years} ans`;
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
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Dossier Administratif Certification</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Date d'Ã©dition</div>
          <div className="text-xs font-bold text-slate-900">{new Date().toLocaleDateString('fr-FR')}</div>
          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID SystÃ¨me</div>
          <div className="text-xs font-bold text-slate-900 uppercase">{Certification.id.substring(0, 12)}</div>
        </div>
      </div>

      {/* Main Profile Header - Optimized size and larger avatar */}
      <div className="grid grid-cols-12 gap-6 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="col-span-4 flex items-center">
          <div className="aspect-square w-full max-w-[230px] bg-white border-2 border-slate-900 rounded-lg overflow-hidden shadow-sm">
            {Certification.avatar ? (
              <img src={getAvatarUrl(Certification.avatar)} alt={Certification.name || ''} className="size-full object-cover" />
            ) : (
              <div className="size-full flex flex-col items-center justify-center bg-slate-50">
                <UserIcon className="size-10 text-slate-200" />
                <span className="text-[10px] font-black text-slate-300 uppercase mt-1">{getInitials(Certification.name)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="col-span-8 flex flex-col justify-center">
          <div className="mb-2">
            <div className="flex gap-2 mb-0.5">
              <span className="px-1 py-0.5 bg-slate-900 text-white text-[7px] font-black uppercase tracking-widest rounded">
                {Certification.userCategory || 'Certification'}
              </span>
              <span className={`px-1 py-0.5 text-[7px] font-black uppercase tracking-widest rounded border ${Certification.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {Certification.status === 'ACTIVE' ? 'COMPTE ACTIF' : Certification.status}
              </span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none text-slate-900">
              {Certification.firstName} {Certification.lastName?.toUpperCase()}
            </h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight mt-0.5">{Certification.jobFunction || 'Poste non dÃ©fini'}</p>
          </div>
          
          <div className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-1.5">
            <div>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">RÃ´le SystÃ¨me</p>
              <p className="text-[9px] font-bold text-slate-900 uppercase">{Certification.role?.name || '-'}</p>
            </div>
            <div>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Qualification</p>
              <p className="text-[9px] font-bold text-slate-900 uppercase">{Certification.qualification || '-'}</p>
            </div>
            <div>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Planifiable</p>
              <p className="text-[9px] font-bold text-slate-900 uppercase">{Certification.isSchedulable ? 'OUI' : 'NON'}</p>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-3">
            <div className="col-span-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-2">
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">NÂ° Carte Pro</p>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-wide">
                {Certification.carteProNumber || '-'}
              </p>
            </div>
            <div className="col-span-1 rounded-lg border border-slate-200 bg-white/80 px-3 py-2">
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">NÂ° Badge</p>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-wide">
                {badgeNumber || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-10 gap-y-6">
        {/* Ã‰tat Civil */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-900 rounded-full" />
            Ã‰tats Civil & Contact
          </h3>
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">PrÃ©nom</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Certification.firstName || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Nom de famille</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Certification.lastName || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Date de naissance</span>
              <span className="text-[10px] font-bold text-slate-900">{formatDateFr(Certification.birthDate)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Lieu de naissance</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Certification.birthPlace || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">NationalitÃ©</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Certification.nationality || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Email Personnel</span>
              <span className="text-[10px] font-bold text-slate-900">{Certification.email}</span>
            </div>
          </div>
        </div>

        {/* ConformitÃ© SÃ©curitÃ© */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-900 rounded-full" />
            ConformitÃ© SÃ©curitÃ©
          </h3>
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">NÂ° SÃ©curitÃ© Sociale (NIR)</span>
              <span className="text-[10px] font-bold text-slate-900 font-mono tracking-tighter">{Certification.socialSecurityNumber || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">NÂ° CNI / Passeport</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Certification.cniNumber || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">NÂ° Titre de sÃ©jour</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Certification.residencePermitNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Expiration Titre</span>
              <span className="text-[10px] font-bold text-slate-900">{formatDateFr(Certification.residencePermitExpiry)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">NÂ° Carte Pro</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Certification.carteProNumber || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Expiration Carte Pro</span>
              <span className="text-[10px] font-bold text-slate-900">{formatDateFr(Certification.carteProExpiry)}</span>
            </div>
          </div>
        </div>

        {/* Contrat & Embauche */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-900 rounded-full" />
            Contrat & Embauche
          </h3>
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Type de Contrat</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Certification.contractType || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Temps de Travail</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">
                {Certification.workTimeType === 'FULL_TIME' ? 'TEMPS PLEIN' : Certification.workTimeType === 'PART_TIME' ? 'TEMPS PARTIEL' : '-'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Date d'embauche</span>
              <span className="text-[10px] font-bold text-slate-900">{formatDateFr(Certification.contractStartDate)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Date de fin</span>
              <span className="text-[10px] font-bold text-slate-900">{formatDateFr(Certification.contractEndDate)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">AnciennetÃ©</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{calculateSeniority(Certification.contractStartDate)}</span>
            </div>
          </div>
        </div>

        {/* RÃ©sidence */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-900 rounded-full" />
            RÃ©sidence & Localisation
          </h3>
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex flex-col gap-1 py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Adresse de rÃ©sidence</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Certification.address || '-'}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 py-1">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Ville</span>
                <span className="text-[10px] font-bold text-slate-900 uppercase">{Certification.city || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Code Postal</span>
                <span className="text-[10px] font-bold text-slate-900 uppercase">{Certification.postalCode || '-'}</span>
              </div>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pays</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Certification.country || 'FRANCE'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t-2 border-slate-900">
        <div className="flex justify-between px-8 mb-2">
          <div className="text-center">
            <div className="w-56 h-16 border-2 border-dashed border-slate-200 mb-1 bg-slate-50/50 rounded-lg" />
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Signature Certification</p>
          </div>
          <div className="text-center">
            <div className="w-56 h-16 border-2 border-dashed border-slate-200 mb-1 bg-slate-50/50 rounded-lg" />
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Cachet Entreprise</p>
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            Document confidentiel edite par LMS - {companyName}
          </p>
        </div>
      </div>
    </div>
  );
};

export function CertificationDetailsSheet({
  open,
  onOpenChange,
  Certification: initialCertification,
  onEditClick,
}: CertificationDetailsSheetProps) { 
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [Certification, setCertification] = useState<Certification | null>(initialCertification);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingRestore, setIsLoadingRestore] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [complianceStatus, setComplianceStatus] = useState<any>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const settingsFormRef = useRef<HTMLFormElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCertification) {
      setCertification(initialCertification);
    }
  }, [initialCertification]);

  useEffect(() => {
    if (open && initialCertification?.id) {
      fetchCertification();
      fetchComplianceStatus();
      fetchCompanyProfile();
    }
  }, [open, initialCertification?.id]);

  const fetchCertification = async () => {
    if (!initialCertification?.id) return;
    try {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/Certifications/${initialCertification.id}`);
      if (response.status === 404) {
        toast.info("Ce Certification n'est plus disponible.");
        onOpenChange(false);
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setCertification(data);
      }
    } catch (error) {
      console.error("Erreur fetch Certification:", error);
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      const response = await apiFetch('/api/sections/securite-configuration/acces/account/profile');
      if (response.ok) {
        const payload = await response.json();
        setCompanyProfile(payload?.data || null);
      }
    } catch (error) {
      console.error("Erreur company profile:", error);
    }
  };

  const fetchComplianceStatus = async () => {
    const collaboratorId = initialCertification?.id || Certification?.id;
    if (!collaboratorId) return;
    try {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/compliance/${collaboratorId}`);
      if (response.ok) {
        const data = await response.json();
        setComplianceStatus(data);
      }
    } catch (error) {
      console.error("Erreur compliance:", error);
    }
  };

  usePusher(
    session?.user?.id,
    () => {
      void fetchCertification();
      void fetchComplianceStatus();
    },
    {
      channelName:
        open &&
        ((session?.user as any)?.companyId || (session?.user as any)?.tenantId) &&
        (Certification?.id || initialCertification?.id)
          ? getCertificationActivityChannel(
              (session?.user as any)?.companyId || (session?.user as any)?.tenantId,
              Certification?.id || initialCertification!.id,
            )
          : undefined,
      eventName: Certification_ACTIVITY_EVENT,
      enabled: Boolean(
        open &&
          session?.user?.id &&
          ((session?.user as any)?.companyId || (session?.user as any)?.tenantId) &&
          (Certification?.id || initialCertification?.id),
      ),
    },
  );

  if (!Certification) return null;

  const handleSaveSettings = () => {
    if (settingsFormRef.current) {
      settingsFormRef.current.requestSubmit();
    }
  };

  const statusProps = getCertificationStatusProps(Certification.status as UserStatus);

  const handleEditClick = () => {
    setActiveTab('settings');
    if (onEditClick) onEditClick();
  };

  const handleSendResetEmail = async () => {
    setIsLoadingEmail(true);
    try {
      const response = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: Certification.email }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'envoi');
      
      toast.success(t('candidature.resetLinkSent'));
    } catch (error) {
      console.error(error);
      toast.error('Ã‰chec de l\'envoi du mail de rÃ©initialisation');
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleRestoreAccount = async () => {
    setIsLoadingRestore(true);
    try {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/Certifications/${Certification.id}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Erreur lors de la rÃ©intÃ©gration');
      
      toast.success(t('candidature.accountRestored'));
      // On ferme la sheet ou on rafraÃ®chit les donnÃ©es via le parent si possible
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Ã‰chec de la rÃ©intÃ©gration du compte');
    } finally {
      setIsLoadingRestore(false);
    }
  };

  const handlePrintCertificationFiche = () => {
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
            <title>Fiche Certification - ${escapeHtml(Certification?.name || '')}</title>
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE}>
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-background shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">DÃ©tails du Certification</SheetTitle>
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
            <div className="flex justify-between flex-wrap gap-2 border-b border-border px-5 py-5 bg-background shrink-0">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="lg:text-[24px] font-bold text-foreground tracking-tight leading-none">
                  {Certification.name}
                </span>
                <Badge size="sm" variant={statusProps.variant as any} appearance="light" className="font-bold uppercase text-[10px] px-2">
                  {statusProps.label}
                </Badge>
                {complianceStatus && (
                  <Badge 
                    size="sm" 
                    variant={
                      complianceStatus.status === 'COMPLIANT' ? 'success' : 
                      complianceStatus.status === 'WARNING' ? 'warning' : 'destructive'
                    } 
                    appearance="light" 
                    className="font-bold uppercase text-[10px] px-2 gap-1"
                  >
                    {complianceStatus.status === 'COMPLIANT' ? 'Conforme' : 
                     complianceStatus.status === 'WARNING' ? 'Alerte' : 'Non-Conforme'}
                  </Badge>
                )}
              </div>

              {complianceStatus?.issues?.length > 0 && (
                <div className="flex flex-col gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  {complianceStatus.issues.map((issue: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <AlertCircle className="size-4 text-destructive" />
                      <span className="text-[11px] font-bold text-destructive uppercase tracking-wide">
                        {issue.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {Certification.status === 'ABSENT' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border/50 rounded-lg">
                  <AlertCircle className="size-4 text-foreground/70" />
                  <span className="text-xs font-bold text-foreground/80 uppercase tracking-wide">
                    Certification actuellement absent
                  </span>
                </div>
              )}
              <div className="flex items-center flex-wrap gap-2 text-2sm">
                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
                  <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">ID</span>
                  <span className="font-bold text-foreground/80">{Certification.id.substring(0, 8)}</span>
                </div>
                <BadgeDot className="bg-muted-foreground/30 size-1" />
                <span className="font-normal text-muted-foreground">
                  Qualification:
                </span>
                <span className="font-bold text-foreground/80">
                  {Certification.qualification || '-'}
                </span>
                <BadgeDot className="bg-muted-foreground/30 size-1" />
                <span className="font-normal text-muted-foreground italic">
                  Carte Pro:
                </span>
                <span className="font-bold text-primary tracking-wide">
                  {Certification.carteProNumber || '-'}
                </span>
                <BadgeDot className="bg-muted-foreground/30 size-1" />
                <span className="font-normal text-muted-foreground">
                  DerniÃ¨re visite:
                </span>
                <span className="font-semibold text-foreground/80">{Certification.lastSignInAt ? formatDateTime(new Date(Certification.lastSignInAt)) : 'Jamais'}</span>
                
                {Certification.carteProNumber && (
                  <>
                    <BadgeDot className="bg-muted-foreground/30 size-1" />
                    <div className="flex items-center gap-1.5 bg-primary/5 px-2 py-0.5 rounded-md border border-primary/20">
                      <span className="font-semibold text-primary/70 text-[10px] uppercase tracking-wider">Badge Site</span>
                      <span className="font-bold text-primary">
                        {Certification.carteProNumber.length >= 7 
                          ? Certification.carteProNumber.slice(-7) 
                          : Certification.carteProNumber}
                      </span>
                    </div>
                  </>
                )}
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
                  {Certification.avatar ? (
                    <img src={Certification.avatar || undefined} alt={Certification.name || undefined} className="size-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <UserIcon className="size-[40px] text-muted-foreground/60" />
                      <span className="text-xs text-muted-foreground font-medium">Pas d'image</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Nom complet", value: Certification.name },
                    { label: "Email", value: Certification.email },
                    { label: "CatÃ©gorie", value: Certification.userCategory },
                    { label: "Fonction", value: Certification.jobFunction || '-' },
                    { label: "ID Certification", value: Certification.id.substring(0, 8) }
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-2sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold text-foreground truncate max-w-[150px]">{item.value}</span>
                    </div>
                  ))}
                </div>
                
                <div className="bg-muted/10 border border-border/50 rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between text-2sm">
                        <span className="text-muted-foreground">RÃ´le actuel</span>
                        <span className="font-semibold text-foreground">{Certification.role?.name || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-2sm">
                        <span className="text-muted-foreground">VÃ©rifiÃ©</span>
                        <span className="font-semibold text-foreground">{Certification.emailVerified ? 'Oui' : 'Non'}</span>
                    </div>
                </div>
              </div>

              <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-5">   
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto text-sm text-muted-foreground">
                  <TabsList className="inline-flex w-auto grow-0 mb-2.5">
                    <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                    <TabsTrigger value="absences" className="relative">
                      Absences
                      {Certification.status === 'ABSENT' && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="compliance">ConformitÃ©</TabsTrigger>
                    <TabsTrigger value="activity">ActivitÃ©</TabsTrigger>
                    <TabsTrigger value="settings">ParamÃ¨tres</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview">
                    <CertificationDetailsOverview Certification={Certification} />
                  </TabsContent>
                  <TabsContent value="absences">
                    <CertificationDetailsAbsences Certification={Certification} />
                  </TabsContent>
                  <TabsContent value="documents">
                    <CertificationDetailsDocuments Certification={Certification} companyProfile={companyProfile} />
                  </TabsContent>
                  <TabsContent value="compliance">
                    <CertificationDetailsCompliance user={Certification} />
                  </TabsContent>
                  <TabsContent value="permissions">
                    <CertificationDetailsPermissions Certification={Certification} />
                  </TabsContent>
                  <TabsContent value="activity">
                    <CertificationDetailsActivity Certification={Certification} />
                  </TabsContent>
                  <TabsContent value="settings">
                    <CertificationDetailsSettings 
                      Certification={Certification} 
                      formRef={settingsFormRef} 
                      onSuccess={fetchCertification}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="flex-row border-t pb-4 p-5 border-border gap-2.5 lg:gap-0 bg-background shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Fermer</Button>
          <div className="flex gap-2.5 ml-auto">
            {activeTab === 'settings' ? (
              <Button 
                variant="outline" 
                className="bg-foreground text-background hover:bg-foreground/90 font-bold border-none" 
                onClick={handleSaveSettings}
              >
                Enregistrer les modifications
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handlePrintCertificationFiche} className="font-bold border-none bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                  <Printer className="size-4" />
                  Fiche Certification
                </Button>
                <Button variant="outline" onClick={handleSendResetEmail} disabled={isLoadingEmail}>
                  {isLoadingEmail ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Envoyer Email
                </Button>
                {Certification.status === 'INACTIVE' && (
                  <Button variant="outline" onClick={handleRestoreAccount} disabled={isLoadingRestore}>
                    {isLoadingRestore ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                    RÃ©intÃ©grer
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="bg-foreground text-background hover:bg-foreground/90 font-bold border-none" 
                  onClick={handleEditClick}
                >
                  Modifier les dÃ©tails
                </Button>
              </>
            )}
          </div>
        </SheetFooter>
        <div className="hidden" aria-hidden="true" ref={printRef}>
          {Certification && (
            <CertificationFicheTemplate Certification={Certification} companyProfile={companyProfile} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}


