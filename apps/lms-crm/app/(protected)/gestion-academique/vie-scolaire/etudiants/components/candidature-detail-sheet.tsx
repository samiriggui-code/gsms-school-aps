'use client';

/** Panneau unique : même coque que `EtudiantDetailsSheet` · onglets dossier / conformité / accès séparés. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { CandidatureStatus } from '@repo/database/browser';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { User as EtudiantType, UserStatus } from '@/app/models/user';
import { CandidatureParcoursActions } from './candidature-parcours-actions';
import { CandidatureAssessmentsSection } from './candidature-assessments-section';
import { RiCheckboxCircleFill } from '@remixicon/react';
import {
  Etudiant_ACTIVITY_EVENT,
  getEtudiantActivityChannel,
} from '@/lib/etudiant-activity';
import { usePusher } from '@/hooks/use-pusher';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDateTime, getAvatarUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Loader2, UserIcon, AlertCircle, Printer } from 'lucide-react';
import { Badge, BadgeDot } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Textarea } from '@repo/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@repo/ui/alert';
import { Separator } from '@repo/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import {
  candidatHubDetailQueryKey,
  candidatHubListQueryKey,
  candidatHubStatsQueryKey,
  candidaturesListQueryKey,
  etudiantsListQueryKey,
  etudiantsStatsQueryKey,
} from '../constants/query-keys';
import { VIE_SCOLAIRE_SHEET_AUTO } from '../../constants/sheet-shell-classes';
import { getEtudiantStatusProps } from '../constants/status';
import { isParcoursApprenantRole } from '@/lib/rh-agrement';
import { EtudiantFicheTemplate } from './etudiant-details-sheet';
import { useOfficialDocumentPreview } from '@/hooks/use-official-document-preview';
import { EtudiantDetailsOverview } from './etudiant-details-overview';
import { EtudiantDetailsActivity } from './etudiant-details-activity';
import { EtudiantDetailsSettings } from './etudiant-details-settings';
import { EtudiantDetailsAbsences } from './etudiant-details-absences';
import { EtudiantDetailsCompliance } from './etudiant-details-compliance';
import { CandidatDocumentsCnapsTab } from './candidat-documents-cnaps-tab';
import { CandidatConformiteDossierSection } from './details/candidat-conformite-dossier-section';
import { EtudiantAccesTab } from './etudiant-acces-tab';
import { EtudiantPlatformAccessPanel } from './etudiant-platform-access-panel';
import { getLmsAccessTier } from '@/lib/portal/lms-access-shared';
import {
  fetchUserRhDocuments,
  isCnapsDossierStructurallyComplete,
} from '../lib/cnaps-dossier-documents';

const escapeHtml = (value: unknown) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export type DetailTab =
  | 'overview'
  | 'dossier'
  | 'conformite'
  | 'compte';

export type CandidatureDetailSheetInitialTab =
  | DetailTab
  | 'dossiers'
  | 'pipeline'
  | 'parcours'
  | 'permissions'
  | 'compliance'
  | 'activity'
  | 'synthese'
  | 'conformite'
  | 'acces'
  | 'sessions'
  | 'absences'
  | 'documents'
  | 'settings';

const ACTIVE_TABS = new Set<string>([
  'overview',
  'dossier',
  'conformite',
  'compte',
]);

function mapInitialTab(t: CandidatureDetailSheetInitialTab | undefined): DetailTab {
  if (!t || t === 'synthese') return 'overview';
  if (t === 'permissions' || t === 'acces' || t === 'settings' || t === 'absences') {
    return 'compte';
  }
  if (t === 'dossiers' || t === 'pipeline' || t === 'parcours' || t === 'sessions') {
    return 'dossier';
  }
  if (t === 'conformite' || t === 'compliance' || t === 'activity' || t === 'documents') {
    return 'conformite';
  }
  return ACTIVE_TABS.has(t as string) ? (t as DetailTab) : 'overview';
}

const STATUS_ENTRIES = Object.values(CandidatureStatus) as string[];

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Transmis',
  MISSING_DOCUMENTS: 'Pièces manquantes',
  VALIDATION_PENDING: 'En validation',
  PENDING_CNAPS: 'Attente CNAPS',
  CNAPS_APPROVED: 'CNAPS favorable',
  CNAPS_REJECTED: 'CNAPS refus',
  VALIDATED: 'Dossier validé',
  COMPLETED: 'Parcours terminé',
  REJECTED: 'Refusé',
  ARCHIVED: 'Archivé',
};

type HubDetailUser = {
  id: string;
  name: string | null;
  email: string;
  status: string;
  createdAt: string;
  role: { slug: string; name: string };
  candidatures: Array<{
    id: string;
    status: string;
    source: string;
    notes: string | null;
    cnapsReference: string | null;
    cnapsPrefavorable: boolean | null;
    cnapsSubmittedAt: string | null;
    cnapsDecisionAt: string | null;
    validatedAt: string | null;
    updatedAt: string;
    formation: { id: string; name: string } | null;
    interestedSession: {
      id: string;
      dateDisplayLabel: string;
      formationId: string;
    } | null;
  }>;
  formationSessionParticipants: Array<{
    id: string;
    enrollmentStatus: string;
    candidatureId: string | null;
    session: {
      id: string;
      dateDisplayLabel: string;
      formation: { name: string } | null;
    };
  }>;
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'd MMM yyyy', { locale: fr });
  } catch {
    return '—';
  }
}

const etudiantsDetailQueryKey = (userId: string) =>
  ['gestion-academique', 'vie-scolaire', 'etudiants', 'detail', userId] as const;

export function CandidatureDetailSheet({
  open,
  onOpenChange,
  hubUserId,
  initialCandidatureId = null,
  initialTab = 'overview',
  presentation = 'sheet',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hubUserId: string | null;
  initialCandidatureId?: string | null;
  initialTab?: CandidatureDetailSheetInitialTab;
  /** Pleine page (ex. `/mon-profil`). */
  presentation?: 'sheet' | 'page';
}) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isPage = presentation === 'page';
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [selectedCandidatureId, setSelectedCandidatureId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingRestore, setIsLoadingRestore] = useState(false);
  const settingsFormRef = useRef<HTMLFormElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { openPreview } = useOfficialDocumentPreview();

  const sheetActive = open || isPage;
  const enabled = !!hubUserId && sheetActive;

  const { data: hub, isLoading: hubLoading, error: hubError } = useQuery({
    queryKey: [...candidatHubDetailQueryKey, hubUserId ?? ''] as const,
    queryFn: async () => {
      const id = hubUserId!;
      const res = await apiFetch(`/api/sections/gestion-ressources/rh/CandidatHub/${id}`);
      const json = await res.json();
      if (!res.ok)
        throw new Error((json as { message?: string }).message ?? 'Chargement impossible.');
      return (json as { data: HubDetailUser }).data;
    },
    enabled,
    staleTime: 1000 * 30,
  });

  const {
    data: Etudiant,
    isLoading: etLoading,
    isError: etError,
    refetch: refetchEtudiant,
  } = useQuery({
    queryKey: etudiantsDetailQueryKey(hubUserId ?? ''),
    queryFn: async () => {
      const res = await apiFetch(`/api/sections/gestion-ressources/rh/etudiants/${hubUserId}`);
      if (res.status === 404) {
        toast.info("Ce compte n'existe plus ou n'est plus accessible.");
        if (!isPage) queueMicrotask(() => onOpenChange(false));
        throw new Error('not_found');
      }
      if (!res.ok) throw new Error('Échec du chargement de la fiche apprenant.');
      return (await res.json()) as EtudiantType;
    },
    enabled,
    staleTime: 1000 * 30,
  });

  const { data: companyProfile } = useQuery({
    queryKey: ['gestion-academique', 'account-profile'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/securite-configuration/acces/account/profile');
      if (!res.ok) return null;
      const payload = await res.json();
      return (payload?.data ?? null) as Record<string, unknown> | null;
    },
    enabled,
  });

  const { data: complianceStatus } = useQuery({
    queryKey: ['gestion-academique', 'compliance', hubUserId ?? ''],
    queryFn: async () => {
      const res = await apiFetch(`/api/sections/gestion-ressources/rh/compliance/${hubUserId}`);
      if (!res.ok) return null;
      const json = await res.json();
      const data = unwrapSectionApiData<{
        status: string;
        issues?: { message: string }[];
      }>(json);
      return data ?? null;
    },
    enabled,
  });

  const { data: rhDocuments = [] } = useQuery({
    queryKey: ['gestion-academique', 'rh-documents-cnaps', hubUserId ?? ''],
    queryFn: () => fetchUserRhDocuments(hubUserId!),
    enabled: Boolean(hubUserId) && enabled,
    staleTime: 30_000,
  });

  const candidatures = hub?.candidatures ?? [];
  const primary = candidatures[0] ?? null;

  useEffect(() => {
    if (!sheetActive) return;
    setActiveTab(mapInitialTab(initialTab));
  }, [sheetActive, initialTab]);

  useEffect(() => {
    if (!sheetActive || !hub) return;
    setSelectedCandidatureId((curr) => {
      if (curr && hub.candidatures.some((c) => c.id === curr)) return curr;
      const list = hub.candidatures;
      if (initialCandidatureId && list.some((c) => c.id === initialCandidatureId))
        return initialCandidatureId;
      return list[0]?.id ?? null;
    });
  }, [sheetActive, hub, initialCandidatureId]);

  const selectedCandidature =
    candidatures.find((c) => c.id === selectedCandidatureId) ?? candidatures[0] ?? null;

  useEffect(() => {
    if (selectedCandidature && sheetActive) {
      setStatus(selectedCandidature.status);
      setNotes('');
    }
  }, [selectedCandidature?.id, selectedCandidature?.status, sheetActive]);

  const cnapsSubject = selectedCandidature ?? primary;

  const invalidateEtudiant = () => {
    if (hubUserId) void queryClient.invalidateQueries({ queryKey: etudiantsDetailQueryKey(hubUserId) });
  };

  const mutation = useMutation({
    mutationFn: async (overrides?: { status?: string }) => {
      if (!selectedCandidature) return null;
      const nextStatus = overrides?.status ?? status;
      const res = await apiFetch(`/api/sections/gestion-ressources/rh/Candidatures/${selectedCandidature.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          notes: notes.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { message?: string }).message || 'Mise à jour impossible.');
      return { body, nextStatus };
    },
    onSuccess: (data) => {
      if (!data) return;
      if (data.nextStatus === CandidatureStatus.VALIDATED) {
        setStatus(CandidatureStatus.VALIDATED);
      }
      toast.custom((toastId) => (
        <Alert variant="mono" icon="success" onClose={() => toast.dismiss(toastId)}>
          <AlertIcon>
            <RiCheckboxCircleFill className="size-4 text-green-600" />
          </AlertIcon>
          <AlertTitle>
            {data.nextStatus === CandidatureStatus.VALIDATED
              ? t('candidature.validatedSuccess')
              : t('candidature.updatedSuccess')}
          </AlertTitle>
        </Alert>
      ));
      void queryClient.invalidateQueries({ queryKey: [...candidaturesListQueryKey] });
      void queryClient.invalidateQueries({ queryKey: [...etudiantsListQueryKey] });
      void queryClient.invalidateQueries({ queryKey: [...etudiantsStatsQueryKey] });
      void queryClient.invalidateQueries({ queryKey: [...candidatHubListQueryKey] });
      void queryClient.invalidateQueries({ queryKey: [...candidatHubStatsQueryKey] });
      if (hubUserId) {
        void queryClient.invalidateQueries({ queryKey: [...candidatHubDetailQueryKey, hubUserId] });
      }
      invalidateEtudiant();
      void queryClient.invalidateQueries({
        queryKey: ['gestion-academique', 'compliance', hubUserId ?? ''],
      });
      if (hubUserId) {
        void queryClient.invalidateQueries({
          queryKey: ['gestion-academique', 'rh-documents-cnaps', hubUserId],
        });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dossierSynth = useMemo(() => {
    if (!hub) return null;
    if (!primary)
      return "Aucun dossier catalogue — les candidatures peuvent provenir du site public ou du process interne.";
    return `${STATUS_LABEL[primary.status] ?? primary.status}${primary.formation?.name ? ` · ${primary.formation.name}` : ''}`;
  }, [hub, primary]);

  const isDossierValidePourSessions = Boolean(
    selectedCandidature &&
      (selectedCandidature.status === CandidatureStatus.VALIDATED || selectedCandidature.validatedAt),
  );

  const cnapsPiecesComplet = isCnapsDossierStructurallyComplete(rhDocuments);
  const profilConforme = complianceStatus?.status === 'COMPLIANT';

  const canValiderPassageEleve = Boolean(
    selectedCandidature &&
      selectedCandidature.status !== CandidatureStatus.VALIDATED &&
      profilConforme &&
      cnapsPiecesComplet,
  );

  const validationGateHints = useMemo(() => {
    const lines: string[] = [];
    if (!profilConforme) {
      lines.push(
        'Profil : la conformité doit être « Conforme » (document d’identité versé sur la fiche, aucun point bloquant).',
      );
    }
    if (!cnapsPiecesComplet) {
      lines.push(
        'Dépôt CNAPS : chaque catégorie du bloc « Dépôt du dossier » doit avoir un fichier associé (4 cases vertes).',
      );
    }
    return lines;
  }, [profilConforme, cnapsPiecesComplet]);

  const formationLabelPourCnaps =
    selectedCandidature?.formation?.name ?? primary?.formation?.name ?? null;

  const enteteDossier = selectedCandidature ?? primary;
  const enteteFormationVisée = enteteDossier?.formation?.name ?? '—';
  const enteteAutorisationPrealable = useMemo(() => {
    const d = enteteDossier;
    const ref = d?.cnapsReference?.trim();
    if (ref) return ref;
    if (d?.cnapsPrefavorable === true) return 'Acceptée (sans n°)';
    return '—';
  }, [enteteDossier?.cnapsReference, enteteDossier?.cnapsPrefavorable, enteteDossier?.id]);

  const goPipeline = (candidatureId: string) => {
    setSelectedCandidatureId(candidatureId);
    setActiveTab('dossier');
  };

  const lmsAccessTier = useMemo(
    () => getLmsAccessTier(selectedCandidature?.status ?? primary?.status),
    [selectedCandidature?.status, primary?.status],
  );

  const dossierLabelForAccess = primary ? STATUS_LABEL[primary.status] ?? primary.status : null;

  usePusher(
    session?.user?.id,
    () => {
      void invalidateEtudiant();
      if (hubUserId) void refetchEtudiant();
      void queryClient.invalidateQueries({
        queryKey: ['gestion-academique', 'compliance', hubUserId ?? ''],
      });
    },
    {
      channelName:
        sheetActive && Etudiant?.id
          ? getEtudiantActivityChannel(
              String(
                (session?.user as { companyId?: string })?.companyId ||
                  (session?.user as { tenantId?: string })?.tenantId ||
                  'solo',
              ),
              Etudiant.id,
            )
          : undefined,
      eventName: Etudiant_ACTIVITY_EVENT,
      enabled: Boolean(sheetActive && session?.user?.id && Etudiant?.id),
    },
  );

  if (!hubUserId) return null;

  const handleSaveSettings = () => {
    settingsFormRef.current?.requestSubmit();
  };

  const handleEditClick = () => setActiveTab('compte');

  const handleSendResetEmail = async () => {
    if (!Etudiant) return;
    setIsLoadingEmail(true);
    try {
      const response = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: Etudiant.email }),
      });
      if (!response.ok) throw new Error("Erreur lors de l'envoi");
      toast.success(t('candidature.resetLinkSent'));
    } catch {
      toast.error("Échec de l'envoi du mail de réinitialisation.");
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleRestoreAccount = async () => {
    if (!Etudiant) return;
    setIsLoadingRestore(true);
    try {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/etudiants/${Etudiant.id}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Erreur lors de la réintégration');
      toast.success(t('candidature.accountRestored'));
      onOpenChange(false);
    } catch {
      toast.error('Échec de la réintégration du compte.');
    } finally {
      setIsLoadingRestore(false);
    }
  };

  const handlePrintEtudiantFiche = () => {
    if (!Etudiant?.id) return;
    const parcoursAnnex =
      isParcoursApprenantRole(Etudiant.role?.slug)
        ? {
            formationVisee: enteteFormationVisée,
            dossierCatalogueStatut: enteteDossier?.status
              ? STATUS_LABEL[enteteDossier.status] ?? enteteDossier.status
              : null,
            autorisationPrefalable: enteteAutorisationPrealable,
          }
        : undefined;

    void openPreview({
      templateKey: 'academic.fiche-etudiant',
      userId: Etudiant.id,
      options: parcoursAnnex ? { parcoursAnnex } : undefined,
      autoPrint: true,
    });
  };

  const statusProps = Etudiant ? getEtudiantStatusProps(Etudiant.status as UserStatus) : null;
  const blocking = hubLoading || etLoading || !hub || !Etudiant;

  const pageShellClass =
    'flex min-h-0 min-w-0 w-full max-w-[min(100%,1160px)] mx-auto flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm sm:min-h-[calc(100dvh-9rem)]';

  const candidatChrome = (
    <>
        <SheetHeader className="border-b border-border bg-background px-4 py-3.5 sm:px-5 shrink-0">
          {isPage ?
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
              Détails du candidat
            </h2>
          : <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
              Détails du candidat
            </SheetTitle>}
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
          {hubError ?
            <div className="p-5 text-destructive text-sm">{(hubError as Error).message}</div>
          : etError ?
            <div className="p-5 text-destructive text-sm">
              Impossible de charger la fiche apprenant.
            </div>
          : blocking ?
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <span className="text-sm">Chargement…</span>
            </div>
          : Etudiant && hub ?
            <>
              <div className="flex justify-between flex-wrap gap-3 border-b border-border bg-background px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5 shrink-0">
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                    <span className="min-w-0 break-words text-base font-bold leading-tight tracking-tight text-foreground sm:text-lg lg:text-[24px]">
                      {Etudiant.name}
                    </span>
                    {statusProps ?
                      <Badge
                        size="sm"
                        variant={statusProps.variant as 'success' | 'warning' | 'destructive'}
                        appearance="light"
                        className="font-bold uppercase text-[10px] px-2"
                      >
                        {statusProps.label}
                      </Badge>
                    : null}
                    {complianceStatus ?
                      <Badge
                        size="sm"
                        variant={
                          complianceStatus.status === 'COMPLIANT'
                            ? 'success'
                          : complianceStatus.status === 'WARNING'
                            ? 'warning'
                          : 'destructive'
                        }
                        appearance="light"
                        className="font-bold uppercase text-[10px] px-2 gap-1"
                      >
                        {complianceStatus.status === 'COMPLIANT'
                          ? 'Conforme'
                        : complianceStatus.status === 'WARNING'
                          ? 'Alerte'
                        : 'Non-Conforme'}
                      </Badge>
                    : null}
                    {primary ?
                      <Badge variant="secondary" appearance="light" size="sm" className="font-bold uppercase text-[10px] px-2">
                        Dossier · {STATUS_LABEL[primary.status] ?? primary.status}
                      </Badge>
                    : null}
                  </div>

                  {Boolean(complianceStatus?.issues?.length) && complianceStatus!.issues!.length > 0 && (
                    <div className="flex flex-col gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      {complianceStatus!.issues!.map((issue, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <AlertCircle className="size-4 text-destructive" />
                          <span className="text-[11px] font-bold text-destructive uppercase tracking-wide">
                            {issue.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {Etudiant.status === 'ABSENT' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border/50 rounded-lg">
                      <AlertCircle className="size-4 text-foreground/70" />
                      <span className="text-xs font-bold text-foreground/80 uppercase tracking-wide">
                        Candidat actuellement absent
                      </span>
                    </div>
                  )}
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1.5 text-2sm">
                    <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
                      <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">ID</span>
                      <span className="font-bold text-foreground/80">{Etudiant.id.substring(0, 8)}</span>
                    </div>
                    <BadgeDot className="bg-muted-foreground/30 size-1 hidden sm:inline-flex" />
                    <span className="font-normal text-muted-foreground w-full sm:w-auto">Formation visée&nbsp;:</span>
                    <span className="font-bold text-foreground/80 break-words">
                      {enteteFormationVisée}
                    </span>
                    <BadgeDot className="bg-muted-foreground/30 size-1 hidden md:inline-flex" />
                    <span className="font-normal text-muted-foreground w-full sm:w-auto">Autorisation préalable&nbsp;:</span>
                    <span className="font-bold text-foreground/80 break-words">{enteteAutorisationPrealable}</span>
                    <BadgeDot className="bg-muted-foreground/30 size-1 hidden md:inline-flex" />
                    <span className="font-normal text-muted-foreground w-full sm:w-auto">Dernière visite&nbsp;:</span>
                    <span className="font-semibold text-foreground/80">
                      {Etudiant.lastSignInAt ?
                        formatDateTime(new Date(Etudiant.lastSignInAt))
                      : 'Jamais'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mx-0 sm:mx-1.5 min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="flex flex-col items-stretch lg:flex-row lg:flex-nowrap px-2 sm:px-3.5">
                  <div className="w-full shrink-0 lg:w-[280px] py-4 sm:py-5 lg:pe-5 space-y-4 border-b border-border lg:border-b-0">
                    <div className="w-full h-[160px] sm:h-[200px] lg:h-[240px] bg-muted/10 border border-border rounded-lg flex items-center justify-center overflow-hidden relative">
                      {Etudiant.avatar ?
                        <img
                          src={getAvatarUrl(Etudiant.avatar)}
                          alt={Etudiant.name || ''}
                          className="size-full object-cover"
                        />
                      : <div className="flex flex-col items-center gap-2">
                          <UserIcon className="size-[40px] text-muted-foreground/60" />
                          <span className="text-xs text-muted-foreground font-medium">Pas d&apos;image</span>
                        </div>
                      }
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: 'Nom complet', value: Etudiant.name },
                        { label: 'Email connexion (pro)', value: Etudiant.proEmail?.trim() || '—' },
                        { label: 'Email personnel', value: Etudiant.email },
                        ...(Etudiant.phone ? [{ label: 'Téléphone', value: Etudiant.phone }] : []),
                        { label: 'Catégorie', value: Etudiant.userCategory ?? '—' },
                        ...((enteteDossier?.formation?.name) ?
                          [{ label: 'Formation visée', value: enteteDossier.formation.name }]
                        : []),
                        ...(Etudiant.jobFunction ?
                          [{ label: 'Intention métier', value: Etudiant.jobFunction }]
                        : []),
                        { label: 'ID candidat', value: Etudiant.id.substring(0, 8) },
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-start gap-3 text-2sm">
                          <span className="text-muted-foreground shrink-0">{item.label}</span>
                          <span className="font-semibold text-foreground text-end break-all min-w-0">{item.value}</span>
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
                        <span className="font-semibold text-foreground">
                          {Etudiant.emailVerifiedAt ? 'Oui' : 'Non'}
                        </span>
                      </div>
                      {primary ?
                        <>
                          <Separator />
                          <div className="flex items-start justify-between text-2sm gap-2">
                            <span className="text-muted-foreground shrink-0">Dossier CRM</span>
                            <span className="font-semibold text-foreground max-w-[150px] text-end">
                              {STATUS_LABEL[primary.status] ?? primary.status}
                            </span>
                          </div>
                        </>
                      : null}
                    </div>

                    <EtudiantPlatformAccessPanel
                      etudiant={Etudiant}
                      lmsAccessTier={lmsAccessTier}
                      dossierLabel={dossierLabelForAccess}
                      compact
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setActiveTab('compte')}
                    >
                      Gérer accès &amp; permissions
                    </Button>
                  </div>

                  <div className="grow lg:border-s border-border space-y-5 py-4 sm:py-5 lg:ps-5 min-w-0 w-full">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DetailTab)} className="w-full min-w-0 text-sm text-muted-foreground">
                      <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
                        <TabsList className="inline-flex w-max min-w-full sm:w-auto grow-0 mb-2.5 flex-nowrap gap-1 sm:flex-wrap sm:gap-y-1 px-1">
                        <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
                        <TabsTrigger value="dossier">Dossier CRM</TabsTrigger>
                        <TabsTrigger value="conformite">Conformité</TabsTrigger>
                        <TabsTrigger value="compte">
                          Compte
                          {Etudiant.status === UserStatus.ABSENT && (
                            <span className="ms-1.5 inline-flex h-2 w-2 rounded-full bg-destructive" />
                          )}
                        </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="overview">
                        {activeTab === 'overview' ? (
                        <EtudiantDetailsOverview
                          Etudiant={Etudiant}
                          hideRecentActivity
                          hideMetierCartePro
                          hideContratPoste
                          hideGamificationTier
                          personaCopy="candidat"
                          hrCardTitle="Informations candidat & administratives"
                        />
                        ) : null}
                      </TabsContent>

                      <TabsContent value="dossier" className="mt-0 space-y-8 pb-4">
                        {activeTab === 'dossier' ? (<>
                        {selectedCandidature ? (
                          <CandidatureParcoursActions
                            candidatureId={selectedCandidature.id}
                            candidatureStatus={selectedCandidature.status}
                          />
                        ) : null}
                        {selectedCandidature ? (
                          <CandidatureAssessmentsSection candidatureId={selectedCandidature.id} />
                        ) : null}
                        <section className="space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Dossiers catalogue (CRM)
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Synthèse : <span className="text-foreground font-medium">{dossierSynth}</span>
                          </p>
                          {candidatures.length === 0 ?
                            <p className="text-sm text-muted-foreground">Aucun dossier catalogue.</p>
                          : candidatures.map((c) => (
                              <div key={c.id} className="rounded-lg border border-border bg-muted/20 p-3">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <Badge variant="secondary" appearance="light" className="text-xs">
                                      {STATUS_LABEL[c.status] ?? c.status}
                                    </Badge>
                                    <p className="mt-1 truncate text-sm font-medium">
                                      {c.formation?.name ?? 'Formation non renseignée'}
                                    </p>
                                    {c.interestedSession ?
                                      <p className="truncate text-xs text-muted-foreground">
                                        Session · {c.interestedSession.dateDisplayLabel}
                                      </p>
                                    : null}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() => goPipeline(c.id)}
                                  >
                                    Configurer
                                  </Button>
                                </div>
                              </div>
                            ))
                          }
                        </section>

                        <section className="space-y-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Pipeline &amp; suivi administratif
                          </p>
                          {!selectedCandidature ?
                            <p className="text-sm text-muted-foreground">
                              Aucun dossier à éditer. Choisissez un dossier dans la liste ci-dessus ou attendez une
                              candidature depuis le site public.
                            </p>
                          : <>
                              {candidatures.length > 1 ?
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold uppercase text-muted-foreground">Dossier actif</p>
                                  <Select
                                    value={selectedCandidature.id}
                                    onValueChange={(id) => setSelectedCandidatureId(id)}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {candidatures.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                          {c.formation?.name ?? 'Dossier'} · {STATUS_LABEL[c.status] ?? c.status}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              : null}

                              <div className="space-y-4">
                                <div>
                                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Formation visée
                                  </p>
                                  <p className="text-sm">{selectedCandidature.formation?.name ?? '—'}</p>
                                </div>
                                <div>
                                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Session d&apos;intérêt
                                  </p>
                                  <p className="text-sm">{selectedCandidature.interestedSession?.dateDisplayLabel ?? '—'}</p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Statut du dossier (CRM)
                                  </p>
                                  <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Statut…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {STATUS_ENTRIES.map((s) => (
                                        <SelectItem
                                          key={s}
                                          value={s}
                                          disabled={
                                            s === CandidatureStatus.VALIDATED &&
                                            selectedCandidature.status !== CandidatureStatus.VALIDATED &&
                                            !canValiderPassageEleve
                                          }
                                        >
                                          {STATUS_LABEL[s] ?? s}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Note interne
                                  </p>
                                  <Textarea
                                    placeholder="Synthèse instruction, CNAPS, pièces manquantes…"
                                    rows={5}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="primary"
                                  className="w-full sm:w-auto"
                                  disabled={
                                    mutation.isPending ||
                                    (!(notes.trim().length > 0) && status === selectedCandidature.status)
                                  }
                                  onClick={() => mutation.mutate({})}
                                >
                                  {mutation.isPending ?
                                    <Loader2 className="size-4 animate-spin" />
                                  : 'Enregistrer le dossier'}
                                </Button>

                                {selectedCandidature.status !== CandidatureStatus.VALIDATED ?
                                  <div className="rounded-lg border border-border/80 bg-muted/10 p-4 space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                      Validation définitive
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      L’inscription à une session reste une action séparée (disponibilités). Ce bouton
                                      confirme la conformité et passe le compte en <strong>élève</strong>.
                                    </p>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="w-full sm:w-auto border-primary/40 font-semibold"
                                      disabled={!canValiderPassageEleve || mutation.isPending}
                                      onClick={() =>
                                        mutation.mutate({ status: CandidatureStatus.VALIDATED })
                                      }
                                    >
                                      {mutation.isPending ?
                                        <Loader2 className="size-4 animate-spin" />
                                      : 'Valider le dossier (passage élève)'}
                                    </Button>
                                    {!canValiderPassageEleve && validationGateHints.length > 0 ?
                                      <ul className="text-xs text-muted-foreground space-y-1.5 list-disc ps-4 leading-snug">
                                        {validationGateHints.map((h, i) => (
                                          <li key={i}>{h}</li>
                                        ))}
                                      </ul>
                                    : null}
                                  </div>
                                : <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                    Dossier validé — vous pourrez inscrire l’élève à une session lorsque les créneaux
                                    le permettent.
                                  </p>
                                }
                              </div>
                            </>
                          }
                        </section>

                        <Separator />

                        <section className="space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Sessions CRM
                          </p>
                          {!isDossierValidePourSessions ?
                            <Alert variant="secondary" appearance="outline" className="border-border bg-muted/15">
                              <AlertIcon>
                                <AlertCircle className="size-4 text-amber-600" />
                              </AlertIcon>
                              <div className="flex flex-col gap-1">
                                <AlertTitle className="text-sm font-semibold text-foreground">
                                  Sessions après validation du dossier
                                </AlertTitle>
                                <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
                                  L&apos;inscription CRM aux sessions reste verrouillée tant que le dossier n&apos;est pas
                                  validé.
                                </AlertDescription>
                              </div>
                            </Alert>
                          : hub.formationSessionParticipants.length === 0 ?
                            <p className="text-sm text-muted-foreground">Aucune inscription session CRM pour ce candidat.</p>
                          : hub.formationSessionParticipants.map((p) => (
                              <div key={p.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                                <p className="font-medium">{p.session.dateDisplayLabel}</p>
                                <p className="text-xs text-muted-foreground">
                                  {p.session.formation?.name ?? 'Formation'} · inscription :{' '}
                                  <span className="text-foreground">{p.enrollmentStatus}</span>
                                </p>
                              </div>
                            ))
                          }
                        </section>
                        </>) : null}
                      </TabsContent>

                      <TabsContent value="conformite" className="mt-0 space-y-8 pb-4">
                        {activeTab === 'conformite' ? (
                        <>
                        {Etudiant?.id ?
                          <CandidatConformiteDossierSection userId={Etudiant.id} />
                        : null}

                        {selectedCandidature && cnapsSubject ?
                          <section className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              CNAPS (dossier sélectionné)
                            </p>
                            <dl className="grid gap-3 text-sm sm:grid-cols-2">
                              <div>
                                <dt className="text-xs uppercase text-muted-foreground">Référence CNAPS</dt>
                                <dd>{cnapsSubject.cnapsReference || '—'}</dd>
                              </div>
                              <div>
                                <dt className="text-xs uppercase text-muted-foreground">Préfavorable</dt>
                                <dd>
                                  {cnapsSubject.cnapsPrefavorable === null ||
                                  cnapsSubject.cnapsPrefavorable === undefined ?
                                    '—'
                                  : cnapsSubject.cnapsPrefavorable ?
                                    'Oui'
                                  : 'Non'}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs uppercase text-muted-foreground">Soumission CNAPS</dt>
                                <dd>{fmtDate(cnapsSubject.cnapsSubmittedAt ?? undefined)}</dd>
                              </div>
                              <div>
                                <dt className="text-xs uppercase text-muted-foreground">Décision CNAPS</dt>
                                <dd>{fmtDate(cnapsSubject.cnapsDecisionAt ?? undefined)}</dd>
                              </div>
                              <div>
                                <dt className="text-xs uppercase text-muted-foreground">Validé dossier</dt>
                                <dd>{fmtDate(cnapsSubject.validatedAt ?? undefined)}</dd>
                              </div>
                            </dl>
                          </section>
                        : null}

                        <section className="space-y-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Contrôle &amp; alertes automatiques
                          </p>
                          <EtudiantDetailsCompliance Etudiant={Etudiant} />
                        </section>

                        <Separator />

                        <section className="space-y-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Activité &amp; historique
                          </p>
                          <EtudiantDetailsActivity Etudiant={Etudiant} />
                        </section>

                        <Separator />

                        <section className="space-y-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Documents CNAPS
                          </p>
                          <CandidatDocumentsCnapsTab
                            Etudiant={Etudiant}
                            candidatureId={selectedCandidature?.id ?? null}
                            formationLabel={formationLabelPourCnaps}
                            companyProfile={companyProfile ?? null}
                          />
                        </section>
                        </>
                        ) : null}
                      </TabsContent>

                      <TabsContent value="compte" className="mt-0 space-y-8 pb-4">
                        {activeTab === 'compte' ? (
                          <>
                            <section className="space-y-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Accès plateforme
                              </p>
                              <EtudiantAccesTab
                                etudiant={Etudiant}
                                lmsAccessTier={lmsAccessTier}
                                dossierLabel={dossierLabelForAccess}
                              />
                            </section>

                            <Separator />

                            <section className="space-y-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Absences
                              </p>
                              {!isDossierValidePourSessions ?
                                <Alert variant="secondary" appearance="outline" className="mb-4 border-border bg-muted/15">
                                  <AlertIcon>
                                    <AlertCircle className="size-4 text-muted-foreground" />
                                  </AlertIcon>
                                  <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
                                    Suivi d&apos;absence pertinent après inscription session / émargement.
                                  </AlertDescription>
                                </Alert>
                              : null}
                              <EtudiantDetailsAbsences Etudiant={Etudiant} />
                            </section>

                            <Separator />

                            <section className="space-y-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Identité &amp; cycle de vie
                              </p>
                              <EtudiantDetailsSettings
                                Etudiant={Etudiant}
                                formRef={settingsFormRef}
                                onSuccess={() => invalidateEtudiant()}
                              />
                            </section>
                          </>
                        ) : null}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
            </>
          : <div className="p-5 text-muted-foreground text-sm">Données incomplètes.</div>
          }
        </SheetBody>

        <SheetFooter className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-background p-3 pb-4 sm:flex-row sm:items-center sm:gap-2.5 sm:p-5">
          {!isPage ? (
            <Button variant="ghost" className="w-full shrink-0 sm:w-auto" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          ) : (
            <span className="shrink-0 self-center px-1 text-xs text-muted-foreground">Profil parcours (session)</span>
          )}
          {Etudiant ?
            <div className="flex w-full min-w-0 flex-col gap-2 sm:ml-auto sm:flex-1 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end sm:gap-2.5 sm:overflow-x-auto sm:[-ms-overflow-style:none] sm:[scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {activeTab === 'compte' ?
                <Button
                  variant="outline"
                  className="shrink-0 border-none bg-foreground font-bold text-background hover:bg-foreground/90"
                  type="button"
                  onClick={handleSaveSettings}
                >
                  Enregistrer les modifications
                </Button>
              : <>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handlePrintEtudiantFiche}
                    className={cn(
                      'w-full shrink-0 gap-2 border-none bg-indigo-600 font-bold text-white hover:bg-indigo-700 sm:w-auto',
                      !isPage && 'md:inline-flex hidden',
                    )}
                  >
                    <Printer className="size-4" />
                    Fiche candidat
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full shrink-0 sm:w-auto"
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={isLoadingEmail}
                  >
                    {isLoadingEmail ?
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    : null}
                    Envoyer Email
                  </Button>
                  {Etudiant.status === 'INACTIVE' && (
                    <Button
                      variant="outline"
                      className="shrink-0"
                      type="button"
                      onClick={handleRestoreAccount}
                      disabled={isLoadingRestore}
                    >
                      {isLoadingRestore ?
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      : null}
                      Réintégrer
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full shrink-0 border-none bg-foreground font-bold text-background hover:bg-foreground/90 sm:w-auto"
                    onClick={handleEditClick}
                  >
                    Modifier les détails
                  </Button>
                </>
              }
            </div>
          : null}
        </SheetFooter>

        {Etudiant ?
          <div className="hidden" aria-hidden="true" ref={printRef}>
            <EtudiantFicheTemplate
              Etudiant={Etudiant}
              companyProfile={companyProfile}
              parcoursAnnex={
                isParcoursApprenantRole(Etudiant.role?.slug)
                  ? {
                      formationVisee: enteteFormationVisée,
                      dossierCatalogueStatut: enteteDossier?.status
                        ? STATUS_LABEL[enteteDossier.status] ?? enteteDossier.status
                        : null,
                      autorisationPrefalable: enteteAutorisationPrealable,
                    }
                  : null
              }
            />
          </div>
        : null}
    </>
  );

  if (isPage) {
    return <div className={pageShellClass}>{candidatChrome}</div>;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          VIE_SCOLAIRE_SHEET_AUTO,
          'max-sm:h-dvh max-sm:max-h-dvh sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)]',
        )}
      >
        {candidatChrome}
      </SheetContent>
    </Sheet>
  );
}
