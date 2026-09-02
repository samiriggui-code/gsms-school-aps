'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FilePlus2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/toggle-group';
import { generatePilotageReport } from '@/lib/pilotage/api';
import { createReportJob, fetchReportJob } from '@/lib/reports/api';
import { moduleLabelFromKey } from '@/lib/pilotage/modules';
import { REPORT_TEMPLATE_REGISTRY, type ReportOutputFormat } from '@repo/report-engine';
import {
  ReportPeriodRangePicker,
  reportPeriodToApi,
  type ReportPeriodValue,
} from '@/components/reports/report-period-range-picker';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPeriodValue: ReportPeriodValue;
  onGenerated?: () => void;
};

export function PilotageRapportGenerateSheet({
  open,
  onOpenChange,
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
        if (!selected.exportDataset) throw new Error('Export CSV non disponible pour ce modèle');
        const period = periodValue.mode === 'preset' ? periodValue.period : ('month' as const);
        return generatePilotageReport(selected.key, period, { label: title, description: summary });
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-5 py-4 text-start">
          <SheetTitle className="flex items-center gap-2 text-base">
            <FilePlus2 className="size-4 text-primary" />
            Générer un rapport
          </SheetTitle>
          <SheetDescription className="text-start text-xs leading-relaxed">
            Export ponctuel PDF, Excel ou CSV. Les planifications récurrentes se gèrent dans « Rapports automatiques ».
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="space-y-2">
            <Label className="text-sm">Période</Label>
            <ReportPeriodRangePicker value={periodValue} onChange={setPeriodValue} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Format</Label>
            <ToggleGroup
              type="single"
              value={format}
              variant="outline"
              className="flex w-full justify-start"
              onValueChange={(v) => v && setFormat(v as ReportOutputFormat)}
            >
              <ToggleGroupItem value="PDF" className="flex-1 text-xs sm:flex-none sm:text-sm">
                PDF
              </ToggleGroupItem>
              <ToggleGroupItem value="EXCEL" className="flex-1 text-xs sm:flex-none sm:text-sm">
                Excel
              </ToggleGroupItem>
              <ToggleGroupItem value="CSV" className="flex-1 text-xs sm:flex-none sm:text-sm">
                CSV
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Modèle</Label>
            <Select value={templateKey} onValueChange={setTemplateKey}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="rapport-gen-title">Titre affiché</Label>
            <Input
              id="rapport-gen-title"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Titre dans l'historique"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rapport-gen-desc">Description / notes</Label>
            <Textarea
              id="rapport-gen-desc"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              rows={3}
              placeholder="Contexte, destinataire (Qualiopi, OPCO, entreprise…)"
            />
          </div>

          {selected?.requiredParameters?.map((p) => (
            <div key={p.key} className="space-y-2">
              <Label htmlFor={`param-${p.key}`}>{p.label}</Label>
              <Input
                id={`param-${p.key}`}
                value={parameters[p.key] ?? ''}
                placeholder={p.placeholder}
                onChange={(e) => setParameters((prev) => ({ ...prev, [p.key]: e.target.value }))}
              />
            </div>
          ))}

          {selected ? (
            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3 text-sm">
              <p className="font-medium">{selected.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{selected.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="outline" appearance="light" className="text-[10px] uppercase">
                  {moduleLabelFromKey(selected.moduleKey)}
                </Badge>
                <Badge variant="primary" appearance="light" className="text-[10px] uppercase">
                  {format}
                </Badge>
              </div>
            </div>
          ) : null}
        </SheetBody>

        <SheetFooter className="flex-row gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            className="flex-1"
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
