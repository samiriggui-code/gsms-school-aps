'use client';

import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import {
  Etudiant_ACTIVITY_EVENT,
  getEtudiantActivityChannel,
} from '@/lib/etudiant-activity';
import { Loader2, UserIcon, AlertCircle, Calendar, Printer } from 'lucide-react';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User as Etudiant, UserStatus } from '@/app/models/user';
import { getEtudiantStatusProps } from '../constants/status';
import { usePusher } from '@/hooks/use-pusher';
import { formatDateTime, toAbsoluteUrl, getAvatarUrl, getInitials } from '@/lib/helpers';
import { agrementUiLabels, showsCollaboratorAgrementSchedulingSection, isParcoursApprenantRole } from '@/lib/rh-agrement';
import { VIE_SCOLAIRE_SHEET_LARGE } from '../../constants/sheet-shell-classes';
import { isUserCurrentlyAbsent } from '@/lib/rh/user-absence-ui';
import { useOfficialDocumentPreview } from '@/hooks/use-official-document-preview';

// Imports des composants modernisés
import { EtudiantDetailsOverview } from './etudiant-details-overview'; 
import { EtudiantDetailsPermissions } from './etudiant-details-permissions'; 
import { EtudiantDetailsActivity } from './etudiant-details-activity';
import { EtudiantDetailsSettings } from './etudiant-details-settings';
import { EtudiantDetailsAbsences } from './etudiant-details-absences';
import { EtudiantDetailsCompliance } from './etudiant-details-compliance';
import { EtudiantDetailsDocuments } from './etudiant-details-documents';

interface EtudiantDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  Etudiant: Etudiant | null;
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

/** Prisma / API peuvent renseigner seulement `name` alors que les impressions utilisaient `firstName` / `lastName` vides → incohérence avec l’affichage écran ou le titre d’onglet imprimé. */
function deriveCivilParts(u: Etudiant): { firstName: string; lastNameUpper: string } {
  const f = u.firstName?.trim();
  const l = u.lastName?.trim();
  if (f || l) {
    return { firstName: f || '—', lastNameUpper: (l || '—').toUpperCase() };
  }
  const n = u.name?.trim();
  if (!n) return { firstName: '—', lastNameUpper: '—' };
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0], lastNameUpper: '—' };
  return {
    firstName: parts[0],
    lastNameUpper: parts.slice(1).join(' ').toUpperCase(),
  };
}

/** Données dossier catalogue / CNAPS pour l’impression (hub candidat uniquement). */
export type FicheParcoursAnnex = {
  formationVisee?: string | null;
  dossierCatalogueStatut?: string | null;
  autorisationPrefalable?: string | null;
};

/** Réutilisable par `CandidatureDetailSheet` (même rendu imprimable). */
export const EtudiantFicheTemplate = ({
  Etudiant,
  companyProfile,
  parcoursAnnex,
  embedded = false,
}: {
  Etudiant: Etudiant;
  companyProfile: any;
  parcoursAnnex?: FicheParcoursAnnex | null;
  embedded?: boolean;
}) => {
  const agr = agrementUiLabels(Etudiant.role?.slug);
  const showCollabPlanner = showsCollaboratorAgrementSchedulingSection(Etudiant.role?.slug);
  const isParcours = isParcoursApprenantRole(Etudiant.role?.slug);
  const civil = deriveCivilParts(Etudiant);
  const companyLogo = companyProfile?.companyProfile?.logo || toAbsoluteUrl('/media/app/default-logo.svg');
  const companyName = companyProfile?.companyProfile?.companyName || companyProfile?.tenant?.name || 'LMS';
  const badgeNumber = Etudiant.carteProNumber
    ? Etudiant.carteProNumber.length >= 7
      ? Etudiant.carteProNumber.slice(-7)
      : Etudiant.carteProNumber
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
    <div
      className={
        embedded
          ? 'official-fiche-body w-full text-slate-900'
          : 'fiche-doc fiche-print w-full bg-white p-8 text-slate-900'
      }
      style={embedded ? undefined : { width: '100%', margin: 0, fontFamily: 'sans-serif' }}
    >
      {!embedded ? (
      <>
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
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              {isParcours
                ? 'Dossier administratif candidat · parcours formation & conformité'
                : 'Dossier administratif · collaborateurs & formateurs'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Date d'édition</div>
          <div className="text-xs font-bold text-slate-900">{new Date().toLocaleDateString('fr-FR')}</div>
          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID Système</div>
          <div className="text-xs font-bold text-slate-900 uppercase">{Etudiant.id.substring(0, 12)}</div>
        </div>
      </div>
      </>
      ) : null}

      {/* Main Profile Header - Optimized size and larger avatar */}
      <div className="grid grid-cols-12 gap-6 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="col-span-4 flex items-center">
          <div className="aspect-square w-full max-w-[230px] bg-white border-2 border-slate-900 rounded-lg overflow-hidden shadow-sm">
            {Etudiant.avatar ? (
              <img src={getAvatarUrl(Etudiant.avatar)} alt={Etudiant.name || ''} className="size-full object-cover" />
            ) : (
              <div className="size-full flex flex-col items-center justify-center bg-slate-50">
                <UserIcon className="size-10 text-slate-200" />
                <span className="text-[10px] font-black text-slate-300 uppercase mt-1">{getInitials(Etudiant.name)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="col-span-8 flex flex-col justify-center">
          <div className="mb-2">
            <div className="flex gap-2 mb-0.5">
              <span className="px-1 py-0.5 bg-slate-900 text-white text-[7px] font-black uppercase tracking-widest rounded">
                {isParcours ? (Etudiant.role?.name || 'Parcours').toUpperCase() : Etudiant.userCategory === 'INTERNAL' ? 'INTERNE (RH)' : Etudiant.userCategory === 'CLIENT' ? 'CLIENT' : Etudiant.userCategory === 'SUBCONTRACTOR' ? 'SOUS-TRAITANT' : (Etudiant.userCategory || 'INTERNE')}
              </span>
              <span className={`px-1 py-0.5 text-[7px] font-black uppercase tracking-widest rounded border ${Etudiant.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {Etudiant.status === 'ACTIVE' ? 'COMPTE ACTIF' : Etudiant.status}
              </span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none text-slate-900">
              {civil.firstName} {civil.lastNameUpper}
            </h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight mt-0.5">
              {Etudiant.jobFunction?.trim() ||
                (isParcoursApprenantRole(Etudiant.role?.slug) ? '—' : 'Poste non défini')}
            </p>
          </div>
          
          <div
            className={`grid gap-3 border-t border-slate-200 pt-1.5 ${showCollabPlanner ? 'grid-cols-3' : 'grid-cols-2'}`}
          >
            <div>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Rôle système</p>
              <p className="text-[9px] font-bold text-slate-900 uppercase">{Etudiant.role?.name || '-'}</p>
            </div>
            <div>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Qualification</p>
              <p className="text-[9px] font-bold text-slate-900 uppercase">{Etudiant.qualification || '-'}</p>
            </div>
            {showCollabPlanner ? (
            <div>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Planifiable</p>
              <p className="text-[9px] font-bold text-slate-900 uppercase">{Etudiant.isSchedulable ? 'OUI' : 'NON'}</p>
            </div>
            ) : null}
          </div>

          {showCollabPlanner ? (
          <div className="mt-2 grid grid-cols-3 gap-3">
            <div className="col-span-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-2">
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{agr.numberLabel}</p>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-wide">
                {Etudiant.carteProNumber || '-'}
              </p>
            </div>
            <div className="col-span-1 rounded-lg border border-slate-200 bg-white/80 px-3 py-2">
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">N° badge</p>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-wide">
                {badgeNumber || '-'}
              </p>
            </div>
          </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-10 gap-y-6">
        {/* État civil */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-900 rounded-full" />
            État civil & contact
          </h3>
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Prénom</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{civil.firstName}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Nom de famille</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{civil.lastNameUpper}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Date de naissance</span>
              <span className="text-[10px] font-bold text-slate-900">{formatDateFr(Etudiant.birthDate)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Lieu de naissance</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Etudiant.birthPlace || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Nationalité</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Etudiant.nationality || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Email Personnel</span>
              <span className="text-[10px] font-bold text-slate-900">{Etudiant.email}</span>
            </div>
          </div>
        </div>

        {/* Conformité sécurité */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-900 rounded-full" />
            Conformité sécurité
          </h3>
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">N° Sécurité sociale (NIR)</span>
              <span className="text-[10px] font-bold text-slate-900 font-mono tracking-tighter">{Etudiant.socialSecurityNumber || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">N° CNI / passeport</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Etudiant.cniNumber || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">N° Titre de séjour</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Etudiant.residencePermitNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Expiration Titre</span>
              <span className="text-[10px] font-bold text-slate-900">{formatDateFr(Etudiant.residencePermitExpiry)}</span>
            </div>
            {showCollabPlanner ? (
              <>
                <div className="flex justify-between py-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{agr.numberLabel}</span>
                  <span className="text-[10px] font-bold text-slate-900 uppercase">{Etudiant.carteProNumber || '-'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{agr.expiryLabel}</span>
                  <span className="text-[10px] font-bold text-slate-900">{formatDateFr(Etudiant.carteProExpiry)}</span>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {isParcours ? (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-900 rounded-full" />
            Parcours & dossier catalogue
          </h3>
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Formation visée</span>
              <span className="text-[10px] font-bold text-slate-900 text-right max-w-[60%]">
                {parcoursAnnex?.formationVisee?.trim() || '—'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Statut dossier</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase text-right max-w-[60%]">
                {parcoursAnnex?.dossierCatalogueStatut?.trim() || '—'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Autorisation préalable</span>
              <span className="text-[10px] font-bold text-slate-900 font-mono text-right max-w-[60%]">
                {parcoursAnnex?.autorisationPrefalable?.trim() || '—'}
              </span>
            </div>
          </div>
        </div>
        ) : (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-900 rounded-full" />
            Contrat & embauche
          </h3>
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Type de contrat</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Etudiant.contractType || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Temps de travail</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">
                {Etudiant.workTimeType === 'FULL_TIME' ? 'Temps plein' : Etudiant.workTimeType === 'PART_TIME' ? 'Temps partiel' : '-'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Date d&apos;embauche</span>
              <span className="text-[10px] font-bold text-slate-900">{formatDateFr(Etudiant.contractStartDate)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Date de fin</span>
              <span className="text-[10px] font-bold text-slate-900">{formatDateFr(Etudiant.contractEndDate)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Ancienneté</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{calculateSeniority(Etudiant.contractStartDate)}</span>
            </div>
          </div>
        </div>
        )}

        {/* Résidence */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-slate-900 rounded-full" />
            Résidence & localisation
          </h3>
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex flex-col gap-1 py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Adresse de résidence</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Etudiant.address || '-'}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 py-1">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Ville</span>
                <span className="text-[10px] font-bold text-slate-900 uppercase">{Etudiant.city || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Code Postal</span>
                <span className="text-[10px] font-bold text-slate-900 uppercase">{Etudiant.postalCode || '-'}</span>
              </div>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pays</span>
              <span className="text-[10px] font-bold text-slate-900 uppercase">{Etudiant.country || 'FRANCE'}</span>
            </div>
          </div>
        </div>
      </div>

      {!embedded ? (
      <div className="mt-4 pt-3 border-t-2 border-slate-900">
        <div className="flex justify-between px-8 mb-2">
          <div className="text-center">
            <div className="w-56 h-16 border-2 border-dashed border-slate-200 mb-1 bg-slate-50/50 rounded-lg" />
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
              {isParcours ? 'Signature du candidat' : 'Signature du collaborateur'}
            </p>
          </div>
          <div className="text-center">
            <div className="w-56 h-16 border-2 border-dashed border-slate-200 mb-1 bg-slate-50/50 rounded-lg" />
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Cachet Entreprise</p>
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            Document confidentiel édité par LMS — {companyName}
          </p>
        </div>
      </div>
      ) : null}
    </div>
  );
};

export function EtudiantDetailsSheet({
  open,
  onOpenChange,
  Etudiant: initialEtudiant,
  onEditClick,
}: EtudiantDetailsSheetProps) {
  const { t } = useTranslation(); 
  const { data: session } = useSession();
  const [Etudiant, setEtudiant] = useState<Etudiant | null>(initialEtudiant);
  const agr = agrementUiLabels(Etudiant?.role?.slug);
  const showCollabPlanner = showsCollaboratorAgrementSchedulingSection(Etudiant?.role?.slug);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingRestore, setIsLoadingRestore] = useState(false);
  const { openPreview } = useOfficialDocumentPreview();
  const [activeTab, setActiveTab] = useState('overview');
  const [complianceStatus, setComplianceStatus] = useState<any>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const settingsFormRef = useRef<HTMLFormElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialEtudiant) {
      setEtudiant(initialEtudiant);
    }
  }, [initialEtudiant]);

  useEffect(() => {
    if (open && initialEtudiant?.id) {
      fetchEtudiant();
      fetchComplianceStatus();
      fetchCompanyProfile();
    }
  }, [open, initialEtudiant?.id]);

  const fetchEtudiant = async () => {
    if (!initialEtudiant?.id) return;
    try {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/etudiants/${initialEtudiant.id}`);
      if (response.status === 404) {
        toast.info("Ce Etudiant n'est plus disponible.");
        onOpenChange(false);
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setEtudiant(data);
      }
    } catch (error) {
      console.error("Erreur fetch Etudiant:", error);
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
    const collaboratorId = initialEtudiant?.id || Etudiant?.id;
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
      void fetchEtudiant();
      void fetchComplianceStatus();
    },
    {
      channelName:
        open &&
        ((session?.user as any)?.companyId || (session?.user as any)?.tenantId) &&
        (Etudiant?.id || initialEtudiant?.id)
          ? getEtudiantActivityChannel(
              (session?.user as any)?.companyId || (session?.user as any)?.tenantId,
              Etudiant?.id || initialEtudiant!.id,
            )
          : undefined,
      eventName: Etudiant_ACTIVITY_EVENT,
      enabled: Boolean(
        open &&
          session?.user?.id &&
          ((session?.user as any)?.companyId || (session?.user as any)?.tenantId) &&
          (Etudiant?.id || initialEtudiant?.id),
      ),
    },
  );

  if (!Etudiant) return null;

  const handleSaveSettings = () => {
    if (settingsFormRef.current) {
      settingsFormRef.current.requestSubmit();
    }
  };

  const statusProps = getEtudiantStatusProps(Etudiant.status as UserStatus);

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
        body: JSON.stringify({ email: Etudiant.email }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'envoi');
      
      toast.success(t('candidature.resetLinkSent'));
    } catch (error) {
      console.error(error);
      toast.error(t('candidature.resetLinkFailed'));
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleRestoreAccount = async () => {
    setIsLoadingRestore(true);
    try {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/etudiants/${Etudiant.id}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error("Erreur lors de la réintégration");
      
      toast.success(t('candidature.accountRestored'));
      // On ferme la sheet ou on rafraîchit les données via le parent si possible
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Échec de la réintégration du compte');
    } finally {
      setIsLoadingRestore(false);
    }
  };

  const handlePrintEtudiantFiche = () => {
    if (!Etudiant?.id) return;
    void openPreview({
      templateKey: 'academic.fiche-etudiant',
      userId: Etudiant.id,
      autoPrint: true,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE}>
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-background shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Détails de l&apos;étudiant</SheetTitle>
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
            <div className="flex justify-between flex-wrap gap-2 border-b border-border px-5 py-5 bg-background shrink-0">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="lg:text-[24px] font-bold text-foreground tracking-tight leading-none">
                  {Etudiant.name}
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

              {isUserCurrentlyAbsent(Etudiant) && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border/50 rounded-lg">
                  <AlertCircle className="size-4 text-foreground/70" />
                  <span className="text-xs font-bold text-foreground/80 uppercase tracking-wide">
                    Etudiant actuellement absent
                  </span>
                </div>
              )}
              <div className="flex items-center flex-wrap gap-2 text-2sm">
                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
                  <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">ID</span>
                  <span className="font-bold text-foreground/80">{Etudiant.id.substring(0, 8)}</span>
                </div>
                <BadgeDot className="bg-muted-foreground/30 size-1" />
                <span className="font-normal text-muted-foreground">
                  Qualification:
                </span>
                <span className="font-bold text-foreground/80">
                  {Etudiant.qualification || '-'}
                </span>
                {showCollabPlanner ? (
                  <>
                    <BadgeDot className="bg-muted-foreground/30 size-1" />
                    <span
                      className="font-normal text-muted-foreground italic max-w-[min(200px,35vw)] truncate"
                      title={agr.numberLabel}
                    >
                      {agr.numberLabel} :
                    </span>
                    <span className="font-bold text-primary tracking-wide">
                      {Etudiant.carteProNumber || '-'}
                    </span>
                  </>
                ) : null}
                <BadgeDot className="bg-muted-foreground/30 size-1" />
                <span className="font-normal text-muted-foreground">
                  Dernière visite :
                </span>
                <span className="font-semibold text-foreground/80">{Etudiant.lastSignInAt ? formatDateTime(new Date(Etudiant.lastSignInAt)) : 'Jamais'}</span>
                
                {showCollabPlanner && Etudiant.carteProNumber ? (
                  <>
                    <BadgeDot className="bg-muted-foreground/30 size-1" />
                    <div className="flex items-center gap-1.5 bg-primary/5 px-2 py-0.5 rounded-md border border-primary/20">
                      <span className="font-semibold text-primary/70 text-[10px] uppercase tracking-wider">Badge Site</span>
                      <span className="font-bold text-primary">
                        {Etudiant.carteProNumber.length >= 7 
                          ? Etudiant.carteProNumber.slice(-7) 
                          : Etudiant.carteProNumber}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mx-1.5 min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="flex flex-wrap items-start lg:flex-nowrap px-3.5">
              <div className="w-full shrink-0 lg:w-[280px] py-5 lg:pe-5 space-y-4">
                <div className="w-full h-[240px] bg-muted/10 border border-border rounded-lg flex items-center justify-center overflow-hidden relative">
                  {Etudiant.avatar ? (
                    <img src={Etudiant.avatar || undefined} alt={Etudiant.name || undefined} className="size-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <UserIcon className="size-[40px] text-muted-foreground/60" />
                      <span className="text-xs text-muted-foreground font-medium">Pas d'image</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Nom complet", value: Etudiant.name },
                    { label: "Email", value: Etudiant.email },
                    { label: 'Catégorie', value: Etudiant.userCategory },
                    { label: 'Fonction', value: Etudiant.jobFunction?.trim() || (isParcoursApprenantRole(Etudiant.role?.slug) ? '—' : '-') },
                    { label: "ID Etudiant", value: Etudiant.id.substring(0, 8) }
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-2sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold text-foreground truncate max-w-[150px]">{item.value}</span>
                    </div>
                  ))}
                </div>
                
                <div className="bg-muted/10 border border-border/50 rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between text-2sm">
                        <span className="text-muted-foreground">Rôle actuel</span>
                        <span className="font-semibold text-foreground">{Etudiant.role?.name || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-2sm">
                        <span className="text-muted-foreground">Vérifié</span>
                        <span className="font-semibold text-foreground">{Etudiant.emailVerified ? 'Oui' : 'Non'}</span>
                    </div>
                </div>
              </div>

              <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-5">   
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto text-sm text-muted-foreground">
                  <TabsList className="inline-flex w-auto grow-0 mb-2.5">
                    <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                    <TabsTrigger value="permissions">Accès &amp; permissions</TabsTrigger>
                    <TabsTrigger value="absences" className="relative">
                      Absences
                      {isUserCurrentlyAbsent(Etudiant) && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="compliance">Conformité</TabsTrigger>
                    <TabsTrigger value="activity">Activité</TabsTrigger>
                    <TabsTrigger value="settings">Paramètres</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview">
                    <EtudiantDetailsOverview
                      Etudiant={Etudiant}
                      personaCopy={Etudiant.role?.slug === 'candidat' ? 'candidat' : 'etudiant'}
                    />
                  </TabsContent>
                  <TabsContent value="absences">
                    <EtudiantDetailsAbsences Etudiant={Etudiant} />
                  </TabsContent>
                  <TabsContent value="documents">
                    <EtudiantDetailsDocuments Etudiant={Etudiant} companyProfile={companyProfile} />
                  </TabsContent>
                  <TabsContent value="compliance">
                    <EtudiantDetailsCompliance Etudiant={Etudiant} />
                  </TabsContent>
                  <TabsContent value="permissions">
                    <EtudiantDetailsPermissions Etudiant={Etudiant} />
                  </TabsContent>
                  <TabsContent value="activity">
                    <EtudiantDetailsActivity Etudiant={Etudiant} />
                  </TabsContent>
                  <TabsContent value="settings">
                    <EtudiantDetailsSettings 
                      Etudiant={Etudiant} 
                      formRef={settingsFormRef} 
                      onSuccess={fetchEtudiant}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
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
                <Button variant="outline" onClick={handlePrintEtudiantFiche} className="font-bold border-none bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                  <Printer className="size-4" />
                  Fiche Etudiant
                </Button>
                <Button variant="outline" onClick={handleSendResetEmail} disabled={isLoadingEmail}>
                  {isLoadingEmail ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Envoyer Email
                </Button>
                {Etudiant.status === 'INACTIVE' && (
                  <Button variant="outline" onClick={handleRestoreAccount} disabled={isLoadingRestore}>
                    {isLoadingRestore ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                    Réintégrer
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="bg-foreground text-background hover:bg-foreground/90 font-bold border-none" 
                  onClick={handleEditClick}
                >
                  Modifier les détails
                </Button>
              </>
            )}
          </div>
        </SheetFooter>
        <div className="hidden" aria-hidden="true" ref={printRef}>
          {Etudiant && (
            <EtudiantFicheTemplate Etudiant={Etudiant} companyProfile={companyProfile} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}



