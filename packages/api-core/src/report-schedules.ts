import type { PrismaClient, ReportGenerationSchedule, ReportScheduleFrequency } from '@repo/database';

import { getReportTemplate } from '@repo/report-engine';

import { ReportJobService } from './report-jobs';

import {

  ReportGenerationSkippedError,

  ReportDedupService,

  resolveSchedulePeriod,

  type ReportGenerationSource,

} from './report-dedup';



export type ReportScheduleDto = {

  id: string;

  templateKey: string;

  templateLabel: string;

  format: string;

  frequency: ReportScheduleFrequency;

  frequencyLabel: string;

  title: string;

  summary: string | null;

  enabled: boolean;

  lastRunAt: string | null;

  nextRunAt: string | null;

};



export type RunScheduleResult = {

  jobId?: string;

  skipped?: boolean;

  skipReason?: string;

  existingJobId?: string;

  existingFileAssetId?: string;

  schedule: ReportScheduleDto;

};



const FREQUENCY_LABELS: Record<ReportScheduleFrequency, string> = {
  DAILY: 'Quotidien',
  WEEKLY: 'Hebdomadaire',
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
};



const DEFAULT_SCHEDULES: Array<{

  templateKey: string;

  frequency: ReportScheduleFrequency;

  title: string;

  summary: string;

}> = [

  {

    templateKey: 'pilotage.gr-indicateurs',

    frequency: 'DAILY',

    title: 'Indicateurs gestion ressources — quotidien',

    summary: 'KPI et tendances — génération automatique chaque jour.',

  },

  {

    templateKey: 'pilotage.gr-indicateurs',

    frequency: 'MONTHLY',

    title: 'Indicateurs gestion ressources — mensuel',

    summary: 'Synthèse mensuelle pilotage ressources.',

  },

  {

    templateKey: 'pilotage.gr-indicateurs',

    frequency: 'QUARTERLY',

    title: 'Indicateurs gestion ressources — trimestriel',

    summary: 'Bilan trimestriel pour supervision.',

  },

  {

    templateKey: 'pilotage.ops-weekly',

    frequency: 'WEEKLY',

    title: 'Synthèse ops — hebdomadaire',

    summary: 'Sessions, candidatures et alertes pédagogiques de la semaine.',

  },

  {

    templateKey: 'finance.monthly-summary',

    frequency: 'MONTHLY',

    title: 'Synthèse finance — mensuelle',

    summary: 'CA encaissé, impayés et pipeline commercial du mois.',

  },

  {

    templateKey: 'qualiopi.checklist',

    frequency: 'QUARTERLY',

    title: 'Checklist Qualiopi — trimestriel',

    summary: 'Indicateurs qualité et conformité pour revue Qualiopi.',

  },

];



export function computeNextScheduleRun(frequency: ReportScheduleFrequency, from = new Date()): Date {

  const next = new Date(from);

  next.setHours(6, 0, 0, 0);

  if (next <= from) next.setDate(next.getDate() + 1);



  if (frequency === 'DAILY') return next;

  if (frequency === 'WEEKLY') {
    const run = new Date(from);
    const day = run.getDay();
    const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
    run.setDate(run.getDate() + daysUntilMonday);
    run.setHours(6, 0, 0, 0);
    if (run <= from) run.setDate(run.getDate() + 7);
    return run;
  }

  if (frequency === 'MONTHLY') {

    const run = new Date(from.getFullYear(), from.getMonth() + 1, 1, 6, 0, 0, 0);

    if (run <= from) run.setMonth(run.getMonth() + 1);

    return run;

  }



  const quarterMonth = Math.floor(from.getMonth() / 3) * 3 + 3;

  const run = new Date(from.getFullYear(), quarterMonth, 1, 6, 0, 0, 0);

  if (run <= from) run.setMonth(run.getMonth() + 3);

  return run;

}



export class ReportScheduleService {

  constructor(private readonly prisma: PrismaClient) {}



  async ensureDefaults(createdById?: string): Promise<ReportGenerationSchedule[]> {

    const count = await this.prisma.reportGenerationSchedule.count();

    if (count > 0) return this.prisma.reportGenerationSchedule.findMany({ orderBy: { frequency: 'asc' } });



    const now = new Date();

    await this.prisma.reportGenerationSchedule.createMany({

      data: DEFAULT_SCHEDULES.map((s) => ({

        templateKey: s.templateKey,

        format: 'PDF',

        frequency: s.frequency,

        title: s.title,

        summary: s.summary,

        enabled: s.frequency === 'MONTHLY' || s.templateKey === 'pilotage.ops-weekly',

        nextRunAt: computeNextScheduleRun(s.frequency, now),

        createdById,

      })),

    });

    return this.prisma.reportGenerationSchedule.findMany({ orderBy: { frequency: 'asc' } });

  }



  toDto(row: ReportGenerationSchedule): ReportScheduleDto {

    const tpl = getReportTemplate(row.templateKey);

    return {

      id: row.id,

      templateKey: row.templateKey,

      templateLabel: tpl?.label ?? row.templateKey,

      format: row.format,

      frequency: row.frequency,

      frequencyLabel: FREQUENCY_LABELS[row.frequency],

      title: row.title,

      summary: row.summary,

      enabled: row.enabled,

      lastRunAt: row.lastRunAt?.toISOString() ?? null,

      nextRunAt: row.nextRunAt?.toISOString() ?? null,

    };

  }



  async list(createdById?: string): Promise<ReportScheduleDto[]> {

    const rows = await this.ensureDefaults(createdById);

    return rows.map((r) => this.toDto(r));

  }



  async setEnabled(id: string, enabled: boolean): Promise<ReportScheduleDto | null> {

    const existing = await this.prisma.reportGenerationSchedule.findUnique({ where: { id } });

    if (!existing) return null;

    const updated = await this.prisma.reportGenerationSchedule.update({

      where: { id },

      data: {

        enabled,

        nextRunAt: enabled ? computeNextScheduleRun(existing.frequency) : existing.nextRunAt,

      },

    });

    return this.toDto(updated);

  }



  private async enqueueFromSchedule(

    schedule: ReportGenerationSchedule,

    requestedById: string,

    source: ReportGenerationSource,

  ): Promise<RunScheduleResult> {

    const tpl = getReportTemplate(schedule.templateKey);

    if (!tpl) throw new Error(`Modèle inconnu : ${schedule.templateKey}`);



    const window = resolveSchedulePeriod(schedule.frequency);

    const jobService = new ReportJobService(this.prisma);



    try {

      const job = await jobService.createJob({

        templateKey: schedule.templateKey,

        format: schedule.format,

        period: window.period,

        periodStart: window.start,

        periodEnd: window.end,

        periodLabel: window.label,

        dedupeBucketKey: window.bucketKey,

        requestedById,

        parameters: (schedule.parameters as Record<string, unknown>) ?? {},

        title: schedule.title,

        summary: schedule.summary ?? tpl.description,

        scheduleId: schedule.id,

        generationSource: source,

      });



      const now = new Date();

      const updated = await this.prisma.reportGenerationSchedule.update({

        where: { id: schedule.id },

        data: { lastRunAt: now },

      });



      return { jobId: job.id, schedule: this.toDto(updated) };

    } catch (error) {

      if (error instanceof ReportGenerationSkippedError) {

        const now = new Date();

        const updated = await this.prisma.reportGenerationSchedule.update({

          where: { id: schedule.id },

          data: { lastRunAt: now },

        });

        return {

          skipped: true,

          skipReason: error.message,

          existingJobId: error.existingJobId,

          existingFileAssetId: error.existingFileAssetId,

          schedule: this.toDto(updated),

        };

      }

      throw error;

    }

  }



  /** Lance immédiatement une génération sans modifier la prochaine échéance planifiée. */

  async runNow(id: string, requestedById: string): Promise<RunScheduleResult | null> {
    const schedule = await this.prisma.reportGenerationSchedule.findUnique({ where: { id } });
    if (!schedule) return null;

    const dedup = new ReportDedupService(this.prisma);
    const cooldown = await dedup.checkScheduleRunCooldown(id);
    if (cooldown?.skip) {
      return {
        skipped: true,
        skipReason: cooldown.message,
        existingJobId: cooldown.existingJobId,
        schedule: this.toDto(schedule),
      };
    }

    return this.enqueueFromSchedule(schedule, requestedById, 'run_now');
  }



  async processDueSchedules(limit = 5): Promise<number> {

    const now = new Date();

    const due = await this.prisma.reportGenerationSchedule.findMany({

      where: {

        enabled: true,

        OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }],

      },

      take: limit,

      orderBy: { nextRunAt: 'asc' },

    });



    if (!due.length) return 0;



    let processed = 0;



    for (const schedule of due) {

      const requesterId =

        schedule.createdById ??

        (await this.prisma.user.findFirst({ where: { status: 'ACTIVE' }, select: { id: true } }))?.id;

      if (!requesterId) continue;



      const result = await this.enqueueFromSchedule(schedule, requesterId, 'schedule');

      await this.prisma.reportGenerationSchedule.update({

        where: { id: schedule.id },

        data: { nextRunAt: computeNextScheduleRun(schedule.frequency, now) },

      });



      if (result.jobId) processed += 1;

      else if (result.skipped) {

        console.log(`[ReportScheduler] ignoré ${schedule.id}: ${result.skipReason}`);

      }

    }



    return processed;

  }

}


