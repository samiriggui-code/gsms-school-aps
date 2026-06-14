'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FilePlus2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { generatePilotageReport } from '@/lib/pilotage/api';
import { createReportJob, fetchReportJob } from '@/lib/reports/api';
import { moduleLabelFromKey } from '@/lib/pilotage/modules';
import type { PilotageRapportTemplate } from '@repo/api-core';
import { REPORT_TEMPLATE_REGISTRY, type ReportOutputFormat } from '@repo/report-engine';
import {
  ReportPeriodRangePicker,
  reportPeriodToApi,
  type ReportPeriodValue,
} from '@/components/reports/report-period-range-picker';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  legacyCsvTemplates?: PilotageRapportTemplate[];
  defaultPeriodValue: ReportPeriodValue;
  onGenerated?: () => void;
};

const LEGACY_CSV_MAP: Record<string, string> = {
  'pilotage.gr-conformite': 'gr-rh-conformite',
  'pilotage.gr-indicateurs': 'gr-equipements-inventaire',
};

export function PilotageRapportGenerateDialog({
  open,
  onOpenChange,
  legacyCsvTemplates = [],
  defaultPeriodValue,
  onGenerated,
}: Props) {
  const templates = REPORT_TEMPLATE_REGISTRY;
  const [format, setFormat] = useState<ReportOutputFormat>('PDF');
  const [templateKey, setTemplateKey] = useState(templates[0]?.key ?? '');
  const [periodValue, setPeriodValue] = useState<ReportPeriodValue>(defaultPeriodValue);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [parameters, setParameters] = useState<Record<string, string>>({});

  const availableTemplates = useMemo(
    () => templates.filter((t) => t.supportedFormats.includes(format)),
    [templates, format],
  );

  const selected = templates.find((t) => t.key === templateKey);

  useEffect(() => {
    if (!open) return;
    setPeriodValue(defaultPeriodValue);
  }, [open, defaultPeriodValue]);

  useEffect(() => {
    if (!open) return;
    const first = availableTemplates[0]?.key;
    if (first) setTemplateKey(first);
  }, [open, format, availableTemplates]);

  useEffect(() => {
    if (!open || !selected) return;
    setCustomTitle(selected.label);
    setCustomDescription(selected.description);
  }, [open, templateKey, selected?.label, selected?.description]);

  useEffect(() => {
    if (!selected?.requiredParameters) {
      setParameters({});
      return;
    }
    const next: Record<string, string> = {};
    for (const p of selected.requiredParameters) next[p.key] = parameters[p.key] ?? '';
    setParameters(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when template changes
  }, [templateKey]);

  const pollJobUntilDone = async (jobId: string) => {
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const { job } = await fetchReportJob(jobId);
      if (job.status === 'COMPLETED') return job;
      if (job.status === 'FAILED') throw new Error(job.errorMessage || 'Échec génération');
    }
    throw new Error('Délai dépassé — le worker traite peut-être encore le job.');
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error('Modèle requis');
      const periodApi = reportPeriodToApi(periodValue);
      const title = customTitle.trim() || selected.label;
      const summary = customDescription.trim() || selected.description;

      if (format === 'CSV') {
        const legacyId = LEGACY_CSV_MAP[selected.key];
        const legacy = legacyCsvTemplates.find((t) => t.id === legacyId);
        if (!legacy?.exportDataset) throw new Error('Export CSV non disponible pour ce modèle');
        const period = periodValue.mode === 'preset' ? periodValue.period : ('month' as const);
        return generatePilotageReport(legacy.id, period, { label: title, description: summary });
      }

      const { job } = await createReportJob({
        templateKey: selected.key,
        format,
        period: periodApi.period,
        customRange: periodApi.customRange,
        parameters,
        title,
        summary,
      });
      toast.info(`Rapport ${format} en file — traitement worker…`);
      await pollJobUntilDone(job.id);
      return null;
    },
    onSuccess: () => {
      toast.success('Rapport généré et enregistré');
      onGenerated?.();
      onOpenChange(false);
    },
    onError: (e: Error) => {
      const msg = e.message || 'Génération impossible';
      if (msg.includes('existe déjà') || msg.includes('en cours') || msg.includes('Trop de')) {
        toast.info(msg);
      } else {
        toast.error(msg);
      }
    },
  });

  const canSubmit =
    !!selected &&
    customTitle.trim().length > 0 &&
    (!selected.requiredParameters?.length ||
      selected.requiredParameters.every((p) => parameters[p.key]?.trim()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          'flex max-h-[min(92dvh,720px)] w-[min(calc(100vw-1.25rem),40rem)] max-w-none flex-col gap-0 overflow-hidden p-0',
          'top-[max(0.75rem,env(safe-area-inset-top,0px))] translate-y-0',
          'sm:top-[50%] sm:max-h-[min(90dvh,800px)] sm:w-full sm:max-w-xl sm:-translate-y-1/2',
          'md:max-w-2xl',
        )}
      >
        <DialogHeader className="mb-0 shrink-0 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
          <DialogTitle className="flex items-center gap-2 pe-8 text-start text-sm sm:text-base">
            <FilePlus2 className="size-4 shrink-0 text-primary sm:size-5" />
            Générer un rapport
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:space-y-5 sm:px-5">
          <p className="text-xs text-muted-foreground sm:text-sm">
            Export manuel ponctuel. Les rapports récurrents (quotidien / mensuel / trimestriel) se configurent
            dans la section workflows ci-dessous.
          </p>

          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Période du rapport</Label>
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <ReportPeriodRangePicker value={periodValue} onChange={setPeriodValue} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Format</Label>
              <ToggleGroup
                type="single"
                value={format}
                variant="outline"
                className="flex w-full flex-wrap justify-start"
                onValueChange={(v) => v && setFormat(v as ReportOutputFormat)}
              >
                <ToggleGroupItem value="PDF" className="flex-1 px-2 text-xs sm:flex-none sm:text-sm">
                  PDF
                </ToggleGroupItem>
                <ToggleGroupItem value="EXCEL" className="flex-1 px-2 text-xs sm:flex-none sm:text-sm">
                  Excel
                </ToggleGroupItem>
                <ToggleGroupItem value="CSV" className="flex-1 px-2 text-xs sm:flex-none sm:text-sm">
                  CSV
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Modèle</Label>
              <Select value={templateKey} onValueChange={setTemplateKey}>
                <SelectTrigger className="h-9 text-xs sm:h-10 sm:text-sm">
                  <SelectValue placeholder="Choisir un modèle" />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rapport-gen-title" className="text-xs sm:text-sm">
              Titre affiché
            </Label>
            <Input
              id="rapport-gen-title"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="h-9 text-sm sm:h-10"
              placeholder="Titre du rapport dans l'historique"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rapport-gen-desc" className="text-xs sm:text-sm">
              Description / notes
            </Label>
            <Textarea
              id="rapport-gen-desc"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              rows={2}
              className="min-h-[4.5rem] text-sm sm:rows-3"
              placeholder="Contexte, périmètre, remarques"
            />
          </div>

          {selected?.requiredParameters?.map((p) => (
            <div key={p.key} className="space-y-2">
              <Label htmlFor={`param-${p.key}`} className="text-xs sm:text-sm">
                {p.label}
              </Label>
              <Input
                id={`param-${p.key}`}
                value={parameters[p.key] ?? ''}
                placeholder={p.placeholder}
                className="h-9 text-sm sm:h-10"
                onChange={(e) => setParameters((prev) => ({ ...prev, [p.key]: e.target.value }))}
              />
            </div>
          ))}

          {selected ? (
            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-sm">
              <p className="font-medium">{selected.label}</p>
              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground sm:text-xs">{selected.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                <Badge variant="outline" appearance="light" className="text-[9px] uppercase sm:text-[10px]">
                  {moduleLabelFromKey(selected.moduleKey)}
                </Badge>
                <Badge variant="primary" appearance="light" className="text-[9px] uppercase sm:text-[10px]">
                  {format}
                </Badge>
                <Badge variant="secondary" appearance="light" className="text-[9px] uppercase sm:text-[10px]">
                  {selected.engine}
                </Badge>
              </div>
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter className="mb-0 shrink-0 gap-2 border-t border-border px-4 py-3 sm:px-5 sm:py-4">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            className="w-full sm:w-auto"
            disabled={!canSubmit || generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Génération…
              </>
            ) : (
              'Générer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
