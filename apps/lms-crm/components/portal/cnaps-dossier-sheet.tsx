'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Loader2,
  Scan,
  Shield,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatPortalDate } from '@/lib/portal/format-portal-date';
import {
  CNAPS_RESEND_REASON_LABELS,
  type CnapsFileRow,
  type CnapsPortalSlot,
  type CnapsResendRequest,
} from '@/lib/portal/cnaps-portal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SheetStatGrid } from '@/components/sheet-shared/stat-grid';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_AUTO } from '@/app/(protected)/gestion-academique/vie-scolaire/constants/sheet-shell-classes';
import {
  DossierFileViewerDialog,
  type DossierViewerFile,
} from '@/app/(protected)/gestion-ressources/compagnie/documents/components/dossier-file-viewer-dialog';

type CnapsPayload = {
  candidature: {
    formationName: string | null;
    cnapsSubmittedAt: string | null;
    cnapsReference: string | null;
    cnapsPrefavorable: boolean | null;
    cnapsDecisionAt: string | null;
  } | null;
  slots: CnapsPortalSlot[];
  summary: {
    uploadedCount: number;
    totalSlots: number;
    verifiedCount: number;
    complete: boolean;
    fullyVerified: boolean;
  };
  authorizationFile: CnapsFileRow | null;
  schoolFormFile: CnapsFileRow | null;
  officialFormUrl: string;
  canDownloadAuthorization: boolean;
  canRequestResend: boolean;
  resendRequests: CnapsResendRequest[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CnapsDossierSheet({ open, onOpenChange }: Props) {
  const [data, setData] = useState<CnapsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [viewerFile, setViewerFile] = useState<DossierViewerFile | null>(null);
  const [resendReason, setResendReason] = useState('LOST_MAIL');
  const [resendNote, setResendNote] = useState('');
  const [resendSubmitting, setResendSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/portal/cnaps');
      const json = (await res.json()) as {
        success?: boolean;
        data?: CnapsPayload;
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error?.message ?? 'Impossible de charger le dossier CNAPS.');
      }
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const handleUpload = async (category: string, file: File) => {
    setUploadingCategory(category);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', category);
      const res = await apiFetch('/api/portal/cnaps/upload', { method: 'POST', body: fd });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { file?: CnapsFileRow };
        error?: { message?: string };
      };
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Échec du téléversement.');
      }
      toast.success('Document déposé — en attente de validation par l’école.');
      if (json.data?.file && data) {
        setData((prev) => {
          if (!prev) return prev;
          const slots = prev.slots.map((slot) => {
            if (slot.category !== category) return slot;
            const newFile = json.data!.file!;
            return {
              ...slot,
              uploaded: true,
              verified: false,
              files: [newFile, ...slot.files],
            };
          });
          const uploadedCount = slots.filter((s) => s.uploaded).length;
          const verifiedCount = slots.filter((s) => s.verified).length;
          return {
            ...prev,
            slots,
            summary: {
              ...prev.summary,
              uploadedCount,
              verifiedCount,
              complete: uploadedCount === prev.summary.totalSlots,
              fullyVerified: verifiedCount === prev.summary.totalSlots,
            },
          };
        });
      }
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Échec du téléversement.');
    } finally {
      setUploadingCategory(null);
    }
  };

  const handleResend = async () => {
    setResendSubmitting(true);
    try {
      const res = await apiFetch('/api/portal/cnaps/resend-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: resendReason, note: resendNote }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { message?: string };
        error?: { message?: string };
      };
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Demande impossible.');
      }
      toast.success(json.data?.message ?? 'Demande enregistrée.');
      setResendNote('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Demande impossible.');
    } finally {
      setResendSubmitting(false);
    }
  };

  const openViewer = (file: CnapsFileRow) => {
    if (!file.url) return;
    setViewerFile({
      url: file.url,
      mimeType: file.mimeType,
      originalName: file.name,
    });
  };

  const summary = data?.summary;
  const pendingResend = data?.resendRequests.some((r) => r.status === 'PENDING');

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className={VIE_SCOLAIRE_SHEET_AUTO}>
          <SheetHeader className="shrink-0 border-b border-border px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-left text-base font-bold md:text-lg">
              <Shield className="size-5 text-primary" />
              Dossier CNAPS
            </SheetTitle>
            <p className="text-left text-sm text-muted-foreground">
              Déposez vos pièces, visualisez les documents et suivez la validation par l’école.
            </p>
            {summary ? (
              <SheetStatGrid
                columnsClassName="sm:grid-cols-2 lg:grid-cols-4"
                items={[
                  { total: `${summary.uploadedCount}/${summary.totalSlots}`, label: 'Pièces déposées' },
                  { total: `${summary.verifiedCount}/${summary.totalSlots}`, label: 'Validées école' },
                  {
                    total: summary.fullyVerified ? 'Complet' : summary.complete ? 'En validation' : 'Incomplet',
                    label: 'État du dossier',
                  },
                  {
                    total: data?.canDownloadAuthorization ? 'Disponible' : '—',
                    label: 'Autorisation',
                  },
                ]}
              />
            ) : null}
          </SheetHeader>

          <SheetBody className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4">
            {loading ? (
              <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                Chargement…
              </div>
            ) : error ? (
              <Alert variant="destructive" appearance="light">
                <AlertIcon>
                  <AlertCircle className="size-4" />
                </AlertIcon>
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : data ? (
              <ScrollArea className="flex-1 pr-3">
                <div className="space-y-5 pb-4">
                  {data.candidature ? (
                    <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
                      {data.candidature.formationName ? (
                        <p>
                          <span className="text-muted-foreground">Formation :</span>{' '}
                          <span className="font-medium">{data.candidature.formationName}</span>
                        </p>
                      ) : null}
                      {data.candidature.cnapsReference ? (
                        <p className="mt-1">
                          <span className="text-muted-foreground">Référence :</span>{' '}
                          {data.candidature.cnapsReference}
                        </p>
                      ) : null}
                      {data.candidature.cnapsSubmittedAt ? (
                        <p className="mt-1 text-muted-foreground">
                          Dépôt CNAPS : {formatPortalDate(data.candidature.cnapsSubmittedAt)}
                        </p>
                      ) : null}
                      {data.candidature.cnapsPrefavorable !== null ? (
                        <p className="mt-1 font-medium">
                          Décision :{' '}
                          <span
                            className={
                              data.candidature.cnapsPrefavorable ? 'text-primary' : 'text-destructive'
                            }
                          >
                            {data.candidature.cnapsPrefavorable ? 'Favorable' : 'Défavorable'}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Pièces du dossier</h3>
                    {data.slots.map((slot) => (
                      <SlotCard
                        key={slot.category}
                        slot={slot}
                        uploading={uploadingCategory === slot.category}
                        officialFormUrl={
                          slot.category === 'CNAPS_FORM_OF' && !slot.uploaded
                            ? data.officialFormUrl
                            : undefined
                        }
                        onUpload={(file) => void handleUpload(slot.category, file)}
                        onView={openViewer}
                      />
                    ))}
                  </div>

                  {summary?.fullyVerified ? (
                    <div className="rounded-lg border bg-card p-4 space-y-3">
                      <h3 className="text-sm font-semibold">Demander un nouvel envoi au CNAPS</h3>
                      <p className="text-xs text-muted-foreground">
                        Si le courrier a été perdu ou si l’autorisation n’est pas téléchargeable depuis votre espace,
                        vous pouvez solliciter un renvoi une fois le dossier entièrement validé.
                      </p>
                      {pendingResend ? (
                        <Badge variant="secondary">Demande en cours de traitement</Badge>
                      ) : data.canRequestResend ? (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs">Motif</Label>
                            <Select value={resendReason} onValueChange={setResendReason}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(CNAPS_RESEND_REASON_LABELS).map(([k, label]) => (
                                  <SelectItem key={k} value={k}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Précisions (optionnel)</Label>
                            <Textarea
                              value={resendNote}
                              onChange={(e) => setResendNote(e.target.value)}
                              rows={3}
                              placeholder="Date du dernier envoi, numéro de suivi…"
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            disabled={resendSubmitting}
                            onClick={() => void handleResend()}
                          >
                            {resendSubmitting ? (
                              <>
                                <Loader2 className="mr-1.5 size-4 animate-spin" />
                                Envoi…
                              </>
                            ) : (
                              'Envoyer la demande'
                            )}
                          </Button>
                        </>
                      ) : null}
                      {data.resendRequests.length > 0 ? (
                        <ul className="space-y-2 border-t pt-3 text-xs">
                          {data.resendRequests.map((r, i) => (
                            <li key={i} className="text-muted-foreground">
                              {formatPortalDate(r.requestedAt)} —{' '}
                              {CNAPS_RESEND_REASON_LABELS[r.reason] ?? r.reason}
                              {r.status === 'PENDING' ? ' (en cours)' : ' (traitée)'}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            ) : null}
          </SheetBody>

          <SheetFooter className="shrink-0 border-t px-5 py-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            <Button type="button" variant="outline" size="sm" className="ms-auto gap-1.5" asChild>
              <a href={data?.officialFormUrl ?? '#'} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" />
                Formulaire officiel CNAPS
              </a>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DossierFileViewerDialog
        open={!!viewerFile}
        onOpenChange={(o) => {
          if (!o) setViewerFile(null);
        }}
        file={viewerFile}
      />
    </>
  );
}

function SlotCard({
  slot,
  uploading,
  officialFormUrl,
  onUpload,
  onView,
}: {
  slot: CnapsPortalSlot;
  uploading: boolean;
  officialFormUrl?: string;
  onUpload: (file: File) => void;
  onView: (file: CnapsFileRow) => void;
}) {
  const isSchool = slot.uploadBy === 'school';
  const StatusIcon = slot.verified ? CheckCircle2 : slot.uploaded ? Clock : AlertCircle;
  const statusClass = slot.verified
    ? 'border-emerald-500/30 bg-emerald-500/5'
    : slot.uploaded
      ? 'border-amber-500/30 bg-amber-500/5'
      : 'border-border bg-muted/10';

  return (
    <Card className={cn('shadow-none', statusClass, slot.highlight && 'ring-1 ring-primary/20')}>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-3">
          <div
            className={cn(
              'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full',
              slot.verified
                ? 'bg-emerald-500/15 text-emerald-600'
                : slot.uploaded
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            <StatusIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold">{slot.title}</h4>
              <Badge variant={isSchool ? 'secondary' : 'outline'} size="sm" className="text-[10px]">
                {isSchool ? 'École' : 'Candidat'}
              </Badge>
              {slot.verified ? (
                <Badge variant="success" appearance="light" size="sm">
                  Validé école
                </Badge>
              ) : slot.uploaded ? (
                <Badge variant="warning" appearance="light" size="sm">
                  En attente validation
                </Badge>
              ) : (
                <Badge variant="outline" size="sm">
                  À déposer
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{slot.description}</p>

            {slot.files.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {slot.files.map((f) => (
                  <div key={f.id} className="flex flex-wrap items-center gap-1">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => onView(f)}
                    >
                      <Scan className="size-3.5" />
                      Visualiser
                    </Button>
                    {f.url ? (
                      <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" asChild>
                        <a href={f.url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="size-3.5" />
                          Télécharger
                        </a>
                      </Button>
                    ) : null}
                    <span className="text-xs text-muted-foreground">{f.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {isSchool
                  ? 'Document déposé par le secrétariat après contrôle de vos pièces.'
                  : 'Aucun fichier — utilisez le bouton ci-dessous.'}
                {officialFormUrl ? (
                  <>
                    {' '}
                    <a
                      href={officialFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Modèle officiel CNAPS
                    </a>
                  </>
                ) : null}
              </p>
            )}
          </div>
        </div>

        {!isSchool ? (
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" asChild disabled={uploading}>
            <label className="cursor-pointer">
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Envoi…
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  {slot.files.length ? 'Remplacer' : 'Déposer'}
                </>
              )}
              <input
                type="file"
                className="sr-only"
                accept=".pdf,image/*,.png,.jpg,.jpeg,.webp"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) onUpload(f);
                }}
              />
            </label>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
