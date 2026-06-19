'use client';

import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Loader2, UserIcon, AlertCircle, Calendar, Printer, Clock3, Mail, FileText, UserCheck } from 'lucide-react';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User as Etudiant, UserStatus } from '@/app/models/user';
import { getEtudiantStatusProps } from '../constants/status';
import { formatDateTime, toAbsoluteUrl, getAvatarUrl, getInitials } from '@/lib/helpers';
import { agrementUiLabels, showsCollaboratorAgrementSchedulingSection, isParcoursApprenantRole } from '@/lib/rh-agrement';
import { VIE_SCOLAIRE_SHEET_LARGE } from '@/app/(protected)/gestion-academique/vie-scolaire/constants/sheet-shell-classes';

// Imports des composants modernisés
import { EtudiantDetailsOverview } from './leads-details-overview'; 
import type { LeadsHubListRow } from './leads-hub-list';
import { LEAD_STATUS_LABEL_FR, LANDING_SOURCE_SHORT_LABEL } from '../constants/source-labels';
import { landingLeadsListQueryKey } from '../constants/query-keys';
import {
  financeDevisDetailQueryKey,
  financeDevisListQueryKey,
} from '@/app/(protected)/administration-facturation/finance/devis/constants/query-keys';
import { DevisDetailSheet } from '@/app/(protected)/administration-facturation/finance/devis/components/devis-detail-sheet';
import { LeadLinkedDevisSection } from './lead-linked-devis-section';

interface EtudiantDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  Etudiant: Etudiant | null;
  leadRow?: LeadsHubListRow | null;
  onEditClick?: () => void;
  disableAutoFetch?: boolean;
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
}: {
  Etudiant: Etudiant;
  companyProfile: any;
  parcoursAnnex?: FicheParcoursAnnex | null;
}) => {
  const { t } = useTranslation();
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
    </div>
  );
};

export function EtudiantDetailsSheet({
  open,
  onOpenChange,
  Etudiant: initialEtudiant,
  leadRow = null,
  onEditClick,
  disableAutoFetch = false,
}: EtudiantDetailsSheetProps) {
  const { t } = useTranslation();
  const [linkedDevisId, setLinkedDevisId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [Etudiant, setEtudiant] = useState<Etudiant | null>(initialEtudiant);
  const agr = agrementUiLabels(Etudiant?.role?.slug);
  const showCollabPlanner = showsCollaboratorAgrementSchedulingSection(Etudiant?.role?.slug);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const settingsFormRef = useRef<HTMLFormElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const leadStatusLabel = leadRow ? LEAD_STATUS_LABEL_FR[leadRow.status] ?? leadRow.status : null;
  const leadSourceLabel =
    leadRow?.source ? LANDING_SOURCE_SHORT_LABEL[leadRow.source] ?? leadRow.source : 'Source inconnue';
  const notesLines = (leadRow?.raw.notes ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const parsedNotes = Object.fromEntries(
    notesLines
      .filter((l) => l.includes(':'))
      .map((l) => {
        const i = l.indexOf(':');
        return [l.slice(0, i).trim().toLowerCase(), l.slice(i + 1).trim()];
      }),
  );
  const noteValue = (...keys: string[]) => {
    for (const k of keys) {
      const v = parsedNotes[k.toLowerCase()];
      if (v) return v;
    }
    return 'Non renseigné';
  };
  const noteFormation = noteValue('formation visée', 'formation demandée', 'libellé');
  const desiredFormation =
    leadRow?.raw.formation?.name ??
    (noteFormation !== 'Non renseigné' ? noteFormation : Etudiant?.jobFunction || '-');
  const isPreinscription = (leadRow?.source ?? '').toLowerCase().includes('preinscription');
  const preinscriptionForm = isPreinscription
    ? {
        birthDate: noteValue('date de naissance'),
        birthPlace: noteValue('lieu de naissance'),
        nationality: noteValue('nationalité'),
        address: noteValue('adresse'),
        situation: noteValue('situation actuelle'),
        motivation: noteValue('motivation'),
        financement: noteValue('mode de financement souhaité'),
        session: noteValue('session visée'),
      }
    : null;

  const fetchEtudiant = async () => {
    if (!initialEtudiant?.id) return;
    /** Fiche lead marketing (pas encore d’utilisateur CRM) : ne pas interroger les API RH / étudiants. */
    if (initialEtudiant.roleId === 'lead') return;
    if (leadRow && !leadRow.raw.candidature?.userId) return;
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

  useEffect(() => {
    setEtudiant(initialEtudiant ?? null);
  }, [initialEtudiant?.id, initialEtudiant?.updatedAt]);

  useEffect(() => {
    if (open && initialEtudiant?.id && !disableAutoFetch) {
      if (initialEtudiant.roleId !== 'lead' && !(leadRow && !leadRow.raw.candidature?.userId)) {
        void fetchEtudiant();
      }
      void fetchCompanyProfile();
    }
  }, [open, initialEtudiant?.id, initialEtudiant?.roleId, disableAutoFetch, leadRow]);

  const statusProps = getEtudiantStatusProps((Etudiant?.status ?? UserStatus.ACTIVE) as UserStatus);

  const leadStatusMutation = useMutation({
    mutationFn: async (status: 'CONTACTED' | 'QUALIFIED' | 'LOST') => {
      if (!leadRow?.candidatureId) throw new Error('Lead introuvable.');
      const res = await apiFetch(
        `/api/sections/communication-contenu/marketing/landing-leads/${leadRow.candidatureId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Mise a jour impossible.');
      return status;
    },
    onSuccess: async (status) => {
      toast.success(`Lead passe en ${LEAD_STATUS_LABEL_FR[status] ?? status}.`);
      await queryClient.invalidateQueries({ queryKey: [...landingLeadsListQueryKey] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      if (!leadRow?.candidatureId) throw new Error('Lead introuvable.');
      const res = await apiFetch(
        `/api/sections/communication-contenu/marketing/landing-leads/${leadRow.candidatureId}/convert-to-candidature`,
        { method: 'POST' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Conversion impossible.');
      return json;
    },
    onSuccess: async () => {
      toast.success(t('leads.convertedToCandidature'));
      await queryClient.invalidateQueries({ queryKey: [...landingLeadsListQueryKey] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const devisMutation = useMutation({
    mutationFn: async () => {
      if (!leadRow?.candidatureId) throw new Error('Lead introuvable.');
      const res = await apiFetch('/api/sections/administration-facturation/finance/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: leadRow.candidatureId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Création devis impossible.');
      }
      const data = unwrapSectionApiData<{
        id: string;
        referenceCode?: string;
        title?: string;
        reusedDraft?: boolean;
      }>(json);
      if (!data?.id) throw new Error('Réponse serveur invalide.');
      return data;
    },
    onSuccess: async (data) => {
      if (data.reusedDraft) {
        toast.message('Brouillon déjà en cours', {
          description: `Ouverture du devis ${data.referenceCode ?? data.id.slice(0, 8)}…`,
        });
      } else {
        toast.success(data.referenceCode ? `Devis créé (${data.referenceCode}).` : 'Devis créé.');
      }
      setActiveTab('overview');
      setLinkedDevisId(data.id);
      await queryClient.invalidateQueries({ queryKey: [...financeDevisListQueryKey] });
      await queryClient.invalidateQueries({ queryKey: [...financeDevisDetailQueryKey, data.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!Etudiant) return null;

  const handleEditClick = () => {
    if (onEditClick) onEditClick();
  };

  const handleSendResetEmail = async () => {
    if (!leadRow?.candidatureId) {
      toast.error('Lead introuvable.');
      return;
    }
    setIsLoadingEmail(true);
    try {
      const response = await apiFetch(
        `/api/sections/communication-contenu/marketing/landing-leads/${leadRow.candidatureId}/reply`,
        {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: 'Suite a votre demande',
            message:
              'Nous avons bien recu votre demande. Notre equipe vous recontacte rapidement pour la suite.',
          }),
        },
      );

      if (!response.ok) throw new Error('Erreur lors de l\'envoi');
      
      toast.success(t('leads.emailSent'));
    } catch (error) {
      console.error(error);
      toast.error("Echec de l'envoi du mail au lead.");
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handlePrintEtudiantFiche = () => {
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
            <title>Fiche Etudiant - ${escapeHtml(Etudiant?.name || '')}</title>
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
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Détails du lead</SheetTitle>
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
            <div className="flex justify-between flex-wrap gap-2 border-b border-border px-5 py-5 bg-background shrink-0">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="lg:text-[24px] font-bold text-foreground tracking-tight leading-none">
                  {Etudiant.name}
                </span>
                <Badge size="sm" variant={statusProps.variant as any} appearance="light" className="font-bold uppercase text-[10px] px-2">
                  {leadStatusLabel ?? statusProps.label}
                </Badge>
                {leadRow ? (
                  <Badge size="sm" variant="outline" appearance="light" className="font-bold uppercase text-[10px] px-2">
                    {leadSourceLabel}
                  </Badge>
                ) : null}
              </div>

              {Etudiant.status === 'ABSENT' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border/50 rounded-lg">
                  <AlertCircle className="size-4 text-foreground/70" />
                  <span className="text-xs font-bold text-foreground/80 uppercase tracking-wide">
                    Lead actuellement en suivi
                  </span>
                </div>
              )}
              <div className="flex items-center flex-wrap gap-2 text-2sm">
                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
                  <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">ID lead</span>
                  <span className="font-bold text-foreground/80">{(leadRow?.candidatureId ?? Etudiant.id).substring(0, 8)}</span>
                </div>
                <BadgeDot className="bg-muted-foreground/30 size-1" />
                <span className="font-normal text-muted-foreground">
                  Formation visée:
                </span>
                <span className="font-bold text-foreground/80">
                  {desiredFormation}
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
                  Reçu le :
                </span>
                <span className="font-semibold text-foreground/80">
                  {leadRow?.createdAt ? formatDateTime(new Date(leadRow.createdAt)) : Etudiant.lastSignInAt ? formatDateTime(new Date(Etudiant.lastSignInAt)) : 'Jamais'}
                </span>
                
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
                    { label: 'Source', value: leadSourceLabel },
                    { label: 'Téléphone', value: leadRow?.phone || Etudiant.phone || '-' },
                    { label: 'Formation', value: desiredFormation },
                    { label: "ID Lead", value: (leadRow?.candidatureId ?? Etudiant.id).substring(0, 8) }
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-2sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold text-foreground truncate max-w-[150px]">{item.value}</span>
                    </div>
                  ))}
                </div>
                
                <div className="bg-muted/10 border border-border/50 rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between text-2sm">
                        <span className="text-muted-foreground">Statut lead</span>
                        <span className="font-semibold text-foreground">{leadStatusLabel ?? '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-2sm">
                        <span className="text-muted-foreground">Candidat créé</span>
                        <span className="font-semibold text-foreground">{leadRow?.raw.candidature ? 'Oui' : 'Non'}</span>
                    </div>
                </div>
              </div>

              <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-5">   
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto text-sm text-muted-foreground">
                  <TabsList className="inline-flex w-auto grow-0 mb-2.5">
                    <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                    <TabsTrigger value="compliance">Contexte demande</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="activity">Activité</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview">
                    <div className="space-y-5">
                      {leadRow ? (
                        <LeadLinkedDevisSection
                          leadId={leadRow.candidatureId}
                          enabled={open}
                          onOpenDevis={setLinkedDevisId}
                        />
                      ) : null}
                      <EtudiantDetailsOverview
                        Etudiant={Etudiant}
                        leadRow={leadRow}
                        personaCopy={Etudiant.role?.slug === 'candidat' ? 'candidat' : 'etudiant'}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="documents">
                    <div className="space-y-4">
                      <Card className="shadow-none border border-border/60">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold">Pièces et supports lead</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          {isPreinscription ? (
                            <>
                              <div className="flex items-center justify-between border-b border-dashed pb-2">
                                <span className="text-muted-foreground">Fiche préinscription</span>
                                <Badge variant="secondary">Reçue</Badge>
                              </div>
                              <div className="flex items-center justify-between border-b border-dashed pb-2">
                                <span className="text-muted-foreground">Pièce d'identité</span>
                                <Badge variant="outline">À demander</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Justificatifs complémentaires</span>
                                <Badge variant="outline">À collecter</Badge>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between border-b border-dashed pb-2">
                                <span className="text-muted-foreground">Demande de devis</span>
                                <Badge variant="secondary">Reçue</Badge>
                              </div>
                              <div className="flex items-center justify-between border-b border-dashed pb-2">
                                <span className="text-muted-foreground">Proposition commerciale</span>
                                <Badge variant="outline">À générer</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Devis signé</span>
                                <Badge variant="outline">En attente</Badge>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  <TabsContent value="compliance">
                    <div className="space-y-4">
                      <Card className="shadow-none border border-border/60">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold">Contexte de la demande</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          {isPreinscription ? (
                            <>
                              <div className="flex items-center justify-between border-b border-dashed pb-2">
                                <span className="text-muted-foreground">Financement souhaité</span>
                                <span className="font-medium">{preinscriptionForm?.financement ?? 'Non renseigné'}</span>
                              </div>
                              <div className="flex items-center justify-between border-b border-dashed pb-2">
                                <span className="text-muted-foreground">Session visée</span>
                                <span className="font-medium">{preinscriptionForm?.session ?? 'Non renseigné'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Motivation</span>
                                <span className="font-medium max-w-[60%] truncate text-right">{preinscriptionForm?.motivation ?? 'Non renseigné'}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between border-b border-dashed pb-2">
                                <span className="text-muted-foreground">Entreprise</span>
                                <span className="font-medium">{noteValue('raison sociale', 'company')}</span>
                              </div>
                              <div className="flex items-center justify-between border-b border-dashed pb-2">
                                <span className="text-muted-foreground">Effectif estimé</span>
                                <span className="font-medium">{noteValue('nombre de stagiaires (estimation)', 'traineesexpected')}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Période souhaitée</span>
                                <span className="font-medium max-w-[60%] truncate text-right">{noteValue('période ou dates souhaitées', 'preferreddates')}</span>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                      {isPreinscription ? (
                        <Card className="shadow-none border border-border/60">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">Informations préinscription</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                              <span className="text-muted-foreground">Date de naissance</span>
                              <span className="font-medium">{preinscriptionForm?.birthDate ?? 'Non renseigné'}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                              <span className="text-muted-foreground">Lieu de naissance</span>
                              <span className="font-medium">{preinscriptionForm?.birthPlace ?? 'Non renseigné'}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                              <span className="text-muted-foreground">Nationalité</span>
                              <span className="font-medium">{preinscriptionForm?.nationality ?? 'Non renseigné'}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                              <span className="text-muted-foreground">Situation actuelle</span>
                              <span className="font-medium">{preinscriptionForm?.situation ?? 'Non renseigné'}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-muted-foreground">Adresse</span>
                              <span className="font-medium text-right max-w-[65%]">{preinscriptionForm?.address ?? 'Non renseigné'}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ) : null}
                      <Card className="shadow-none border border-border/60">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold">Texte brut formulaire</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {leadRow?.raw.notes || 'Aucune note issue du formulaire.'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  <TabsContent value="activity">
                    <div className="space-y-4">
                      <Card className="shadow-none border border-border/60">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold">Activité CRM du lead</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                          <div className="relative ms-2 border-s border-border/70 ps-6 py-1 space-y-5">
                            <div className="relative">
                              <span className="absolute -start-[34px] top-0.5 inline-flex size-6 items-center justify-center rounded-full border border-border bg-background">
                                <Clock3 className="size-3.5 text-muted-foreground" />
                              </span>
                              <p className="font-medium text-foreground">Lead créé</p>
                              <p className="text-muted-foreground text-xs">
                                {leadRow?.createdAt ? formatDateTime(new Date(leadRow.createdAt)) : 'Date inconnue'}
                              </p>
                            </div>

                            <div className="relative">
                              <span className="absolute -start-[34px] top-0.5 inline-flex size-6 items-center justify-center rounded-full border border-border bg-background">
                                <FileText className="size-3.5 text-muted-foreground" />
                              </span>
                              <p className="font-medium text-foreground">Statut actuel</p>
                              <p className="text-muted-foreground text-xs">{leadStatusLabel ?? 'Inconnu'}</p>
                            </div>

                            <div className="relative">
                              <span className="absolute -start-[34px] top-0.5 inline-flex size-6 items-center justify-center rounded-full border border-border bg-background">
                                <UserCheck className="size-3.5 text-muted-foreground" />
                              </span>
                              <p className="font-medium text-foreground">Conversion candidature</p>
                              <p className="text-muted-foreground text-xs">
                                {leadRow?.raw.candidature ? 'Déjà converti' : 'Non converti'}
                              </p>
                            </div>

                            <div className="relative">
                              <span className="absolute -start-[34px] top-0.5 inline-flex size-6 items-center justify-center rounded-full border border-border bg-background">
                                <Mail className="size-3.5 text-muted-foreground" />
                              </span>
                              <p className="font-medium text-foreground">Suivi commercial</p>
                              <p className="text-muted-foreground text-xs">
                                Prochaine action recommandée: répondre puis qualifier.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </SheetBody>

        <SheetFooter className="flex-row border-t pb-4 p-5 border-border gap-2.5 lg:gap-0 bg-background shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Fermer</Button>
          <div className="flex gap-2.5 ml-auto">
            <Button variant="outline" onClick={handlePrintEtudiantFiche} className="font-bold border-none bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Printer className="size-4" />
              Fiche lead
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="bg-foreground text-background hover:bg-foreground/90 font-bold border-none" 
                  onClick={handleEditClick}
                >
                  Traiter le lead
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={() => leadStatusMutation.mutate('CONTACTED')}>
                  Marquer contacté
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => leadStatusMutation.mutate('QUALIFIED')}>
                  Marquer qualifié
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => convertMutation.mutate()}>
                  Convertir en candidature
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={devisMutation.isPending || !leadRow?.candidatureId}
                  onClick={() => devisMutation.mutate()}
                >
                  {devisMutation.isPending ? 'Préparation du devis…' : 'Créer un devis'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendResetEmail} disabled={isLoadingEmail}>
                  {isLoadingEmail ? 'Réponse en cours...' : 'Répondre par email'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => leadStatusMutation.mutate('LOST')}
                >
                  Classer perdu
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SheetFooter>
        <div className="hidden" aria-hidden="true" ref={printRef}>
          {Etudiant && (
            <EtudiantFicheTemplate Etudiant={Etudiant} companyProfile={companyProfile} />
          )}
        </div>
      </SheetContent>
    </Sheet>
    <DevisDetailSheet
      devisId={linkedDevisId}
      open={linkedDevisId != null}
      onOpenChange={(next) => {
        if (!next) setLinkedDevisId(null);
      }}
    />
    </>
  );
}

export type LeadsDetailSheetInitialTab = 'overview' | 'pipeline' | 'documents' | 'activity' | 'settings';

/** Point d'entrée unique leads marketing (ex-leads-detail-sheet.tsx). */
export function LeadsDetailSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hubUserId: string | null;
  initialCandidatureId?: string | null;
  initialTab?: LeadsDetailSheetInitialTab;
  leadRow?: import('./leads-hub-list').LeadsHubListRow | null;
}) {
  const fallbackLeadAsEtudiant: Etudiant | null = useMemo(
    () =>
      props.leadRow
        ? {
            id: props.leadRow.raw.candidature?.userId ?? props.leadRow.raw.id,
            email: props.leadRow.raw.email,
            name:
              `${props.leadRow.raw.firstName} ${props.leadRow.raw.lastName}`.trim() ||
              props.leadRow.raw.email,
            firstName: props.leadRow.raw.firstName,
            lastName: props.leadRow.raw.lastName,
            phone: props.leadRow.raw.phone ?? null,
            jobFunction: props.leadRow.raw.formation?.name ?? null,
            roleId: 'lead',
            status: 'ACTIVE',
            createdAt: new Date(props.leadRow.raw.createdAt),
            updatedAt: new Date(props.leadRow.raw.updatedAt),
            isTrashed: false,
            isProtected: false,
            role: {
              id: 'lead',
              slug: 'candidat',
              name: 'Lead',
              isTrashed: false,
              createdAt: new Date(props.leadRow.raw.createdAt),
              isProtected: false,
              isDefault: false,
            },
          }
        : null,
    [props.leadRow],
  );

  const { data } = useQuery({
    queryKey: ['formulaires-leads', 'etudiant-detail', props.hubUserId ?? ''],
    queryFn: async () => {
      if (!props.hubUserId) return null;
      const res = await apiFetch(`/api/sections/gestion-ressources/rh/etudiants/${props.hubUserId}`);
      if (!res.ok) return null;
      return (await res.json()) as Etudiant;
    },
    enabled: props.open && !!props.hubUserId && !!props.leadRow?.raw.candidature?.userId,
  });

  const isFallbackLead = !data && !!fallbackLeadAsEtudiant;

  return (
    <EtudiantDetailsSheet
      open={props.open}
      onOpenChange={props.onOpenChange}
      Etudiant={data ?? fallbackLeadAsEtudiant}
      leadRow={props.leadRow ?? null}
      disableAutoFetch={isFallbackLead}
    />
  );
}

