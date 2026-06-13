'use client';

import { useCallback, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, FileUp, Loader2, Paperclip } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { INSTRUCTOR_ATTENDANCE_API } from '@/lib/instructor/instructor-paths';
import type { SessionAttendanceAssetRow } from '@/lib/instructor/instructor-types';
import { PortalSection } from '@/components/portal/layout/portal-section';
import { portalMuted, portalSectionTitle } from '@/components/portal/layout/portal-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type AttendancePayload = {
  session: { id: string; label: string; location: string; formationName: string };
  archives: SessionAttendanceAssetRow[];
};

export function InstructorAttendancePanel({ sessionId }: { sessionId: string | null }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [generating, setGenerating] = useState(false);
  const [generatingBlank, setGeneratingBlank] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['instructor-attendance', sessionId],
    enabled: Boolean(sessionId),
    queryFn: async () => {
      const res = await apiFetch(`${INSTRUCTOR_ATTENDANCE_API}?sessionId=${sessionId}`);
      const json = (await res.json()) as { success?: boolean; data?: AttendancePayload };
      if (!res.ok || !json.success || !json.data) throw new Error('Chargement impossible');
      return json.data;
    },
  });

  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['instructor-attendance', sessionId] });
  }, [qc, sessionId]);

  const downloadPdfBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePdf = async () => {
    if (!sessionId) return;
    setGenerating(true);
    try {
      const res = await apiFetch(INSTRUCTOR_ATTENDANCE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          date: attendanceDate,
          action: 'generate-pdf',
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(j.error?.message ?? 'Génération impossible');
      }
      const blob = await res.blob();
      downloadPdfBlob(blob, `feuille-presence_${attendanceDate}.pdf`);
      toast.success('Feuille de présence téléchargée.');
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur PDF');
    } finally {
      setGenerating(false);
    }
  };

  /** Modèle vierge (logo entreprise, lignes à remplir) — secours si la liste CRM ne charge pas. */
  const generateBlankPdf = async () => {
    setGeneratingBlank(true);
    try {
      const qs = new URLSearchParams({ template: 'blank', date: attendanceDate });
      if (sessionId) qs.set('sessionId', sessionId);
      const res = await apiFetch(`${INSTRUCTOR_ATTENDANCE_API}?${qs.toString()}`);
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(j.error?.message ?? 'Génération impossible');
      }
      const blob = await res.blob();
      downloadPdfBlob(blob, `feuille-presence-vierge_${attendanceDate}.pdf`);
      toast.success('Modèle vierge téléchargé — imprimez et complétez à la main.');
      if (sessionId) invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur PDF vierge');
    } finally {
      setGeneratingBlank(false);
    }
  };

  const uploadScan = async (file: File) => {
    if (!sessionId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('sessionId', sessionId);
      form.append('date', attendanceDate);

      const res = await apiFetch(INSTRUCTOR_ATTENDANCE_API, { method: 'PUT', body: form });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Upload impossible');
      }
      toast.success('Feuille scannée archivée.');
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur upload');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (!sessionId) {
    return (
      <PortalSection title="Feuille de présence" description="Sélectionnez une session.">
        <p className={portalMuted}>
          Imprimez la feuille en fin de journée, collectez les signatures, scannez puis déposez le
          document pour archivage quotidien (consultable formateur et admin CRM).
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Date du jour
            </label>
            <Input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="h-9 w-[160px] text-[13px]"
            />
          </div>
          <Button size="sm" variant="outline" disabled={generatingBlank} onClick={() => void generateBlankPdf()}>
            {generatingBlank ? (
              <Loader2 className="me-2 size-4 animate-spin" />
            ) : (
              <FileText className="me-2 size-4" />
            )}
            Modèle vierge (PDF)
          </Button>
        </div>
        <p className={cn('mt-3', portalMuted)}>
          Secours : feuille avec logo organisme et lignes vides, sans liste stagiaires CRM.
        </p>
      </PortalSection>
    );
  }

  return (
    <PortalSection
      title="Feuille de présence"
      description={
        data
          ? `${data.session.formationName} · ${data.session.label}`
          : 'Génération PDF et archivage des scans'
      }
    >
      <div className="flex flex-col gap-4">
        <p className={portalMuted}>
          La session en classe est la référence. En fin de journée : générer → imprimer → signatures
          → scanner → déposer ci-dessous.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Date du jour
            </label>
            <Input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="h-9 w-[160px] text-[13px]"
            />
          </div>
          <Button size="sm" disabled={generating} onClick={() => void generatePdf()}>
            {generating ? (
              <Loader2 className="me-2 size-4 animate-spin" />
            ) : (
              <Download className="me-2 size-4" />
            )}
            Générer PDF (liste CRM)
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={generatingBlank}
            onClick={() => void generateBlankPdf()}
          >
            {generatingBlank ? (
              <Loader2 className="me-2 size-4 animate-spin" />
            ) : (
              <FileText className="me-2 size-4" />
            )}
            Modèle vierge
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="me-2 size-4 animate-spin" />
            ) : (
              <FileUp className="me-2 size-4" />
            )}
            Déposer scan
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadScan(f);
            }}
          />
        </div>

        <p className={cn('text-[12px]', portalMuted)}>
          <strong className="font-medium text-foreground">Liste CRM</strong> : stagiaires inscrits à
          la session. <strong className="font-medium text-foreground">Modèle vierge</strong> : même
          en-tête (logo, SIRET, Qualiopi) avec cases vides — utile en cas de problème technique.
        </p>

        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-[13px] text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Archives…
          </div>
        ) : data?.archives.length ? (
          <div>
            <p className={cn('mb-2', portalSectionTitle)}>Archives ({data.archives.length})</p>
            <ul className="space-y-2">
              {data.archives.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-[13px]"
                >
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{doc.originalName}</span>
                    <span className="text-muted-foreground">
                      {doc.attendanceDate ?? '—'} · {doc.kind === 'scan' ? 'Scan' : 'Généré'}
                    </span>
                  </span>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 font-medium text-primary hover:underline"
                  >
                    Ouvrir
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className={portalMuted}>Aucune archive pour cette session.</p>
        )}
      </div>
    </PortalSection>
  );
}
