import type { PrismaClient, ReportOutputFormat, ReportScheduleFrequency } from '@repo/database';
import { parseReportFileMetadata } from '@repo/report-engine';

export type ReportGenerationSource = 'manual' | 'schedule' | 'run_now';

export type ReportDedupeInput = {
  templateKey: string;
  format: ReportOutputFormat;
  periodStart: Date;
  periodEnd: Date;
  dedupeBucketKey: string;
  requestedById?: string;
};

export type ReportDedupeResult = {
  skip: boolean;
  reason?: 'already_exists' | 'already_pending' | 'rate_limit';
  message?: string;
  existingJobId?: string;
  existingFileAssetId?: string;
};

export function buildReportDedupeBucketKey(
  templateKey: string,
  format: string,
  bucketKey: string,
): string {
  return `${templateKey}:${format}:${bucketKey}`;
}

/** Fenêtre calendaire pour les planifications automatiques (jour / mois / trimestre). */
export function resolveSchedulePeriod(
  frequency: ReportScheduleFrequency,
  ref = new Date(),
): {
  period: string;
  start: Date;
  end: Date;
  label: string;
  bucketKey: string;
} {
  const end = new Date(ref);
  end.setHours(23, 59, 59, 999);

  if (frequency === 'DAILY') {
    const start = new Date(ref);
    start.setHours(0, 0, 0, 0);
    const day = start.toISOString().slice(0, 10);
    return {
      period: 'day',
      start,
      end,
      label: "Aujourd'hui",
      bucketKey: `day:${day}`,
    };
  }

  if (frequency === 'WEEKLY') {
    const start = new Date(ref);
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    const weekEnd = new Date(start);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const weekKey = start.toISOString().slice(0, 10);
    return {
      period: 'week',
      start,
      end: weekEnd,
      label: `Semaine du ${start.toLocaleDateString('fr-FR')}`,
      bucketKey: `week:${weekKey}`,
    };
  }

  if (frequency === 'MONTHLY') {
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
    const month = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`;
    return {
      period: 'month',
      start,
      end,
      label: start.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }),
      bucketKey: `month:${month}`,
    };
  }

  const quarter = Math.floor(ref.getMonth() / 3);
  const start = new Date(ref.getFullYear(), quarter * 3, 1, 0, 0, 0, 0);
  return {
    period: 'quarter',
    start,
    end,
    label: `T${quarter + 1} ${ref.getFullYear()}`,
    bucketKey: `quarter:${ref.getFullYear()}-Q${quarter + 1}`,
  };
}

function isAssetEdited(metadata: unknown): boolean {
  const meta = parseReportFileMetadata(metadata);
  return Boolean(meta?.editedByUserId);
}

export class ReportDedupService {
  constructor(private readonly prisma: PrismaClient) {}

  /** Cooldown anti-spam pour « Lancer maintenant » (2 min entre deux tentatives). */
  async checkScheduleRunCooldown(
    scheduleId: string,
    minIntervalMs = 120_000,
  ): Promise<ReportDedupeResult | null> {
    const recent = await this.prisma.reportGenerationJob.findFirst({
      where: {
        parameters: { path: ['scheduleId'], equals: scheduleId },
        createdAt: { gte: new Date(Date.now() - minIntervalMs) },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      return {
        skip: true,
        reason: 'rate_limit',
        message:
          'Un lancement récent existe déjà pour cette planification. Attendez quelques minutes ou consultez l’historique.',
        existingJobId: recent.id,
      };
    }
    return null;
  }

  /** Max 5 jobs en file par utilisateur pour éviter la saturation. */
  async checkRateLimit(requestedById: string): Promise<ReportDedupeResult | null> {
    const pending = await this.prisma.reportGenerationJob.count({
      where: {
        requestedById,
        status: { in: ['PENDING', 'RUNNING'] },
      },
    });
    if (pending >= 5) {
      return {
        skip: true,
        reason: 'rate_limit',
        message:
          'Trop de rapports en cours de génération. Attendez la fin des traitements en cours avant d’en lancer de nouveaux.',
      };
    }
    return null;
  }

  async checkDuplicate(input: ReportDedupeInput): Promise<ReportDedupeResult> {
    const dedupeKey = buildReportDedupeBucketKey(
      input.templateKey,
      input.format,
      input.dedupeBucketKey,
    );

    const pendingJob = await this.prisma.reportGenerationJob.findFirst({
      where: {
        templateKey: input.templateKey,
        format: input.format,
        status: { in: ['PENDING', 'RUNNING'] },
        parameters: { path: ['dedupeBucketKey'], equals: dedupeKey },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
    if (pendingJob) {
      return {
        skip: true,
        reason: 'already_pending',
        message: 'Un rapport identique est déjà en cours de génération pour cette période.',
        existingJobId: pendingJob.id,
      };
    }

    const completedJobs = await this.prisma.reportGenerationJob.findMany({
      where: {
        templateKey: input.templateKey,
        format: input.format,
        status: 'COMPLETED',
        fileAssetId: { not: null },
        parameters: { path: ['dedupeBucketKey'], equals: dedupeKey },
      },
      select: { id: true, fileAssetId: true },
      orderBy: { completedAt: 'desc' },
      take: 3,
    });

    if (completedJobs.length) {
      const assetIds = completedJobs.map((j) => j.fileAssetId!).filter(Boolean);
      const assets = await this.prisma.fileAsset.findMany({
        where: { id: { in: assetIds }, status: 'ACTIVE', deletedAt: null },
        select: { id: true, metadata: true },
      });
      const editedIds = new Set(
        assets.filter((a) => isAssetEdited(a.metadata)).map((a) => a.id),
      );
      const fresh = completedJobs.find((j) => j.fileAssetId && !editedIds.has(j.fileAssetId));
      if (fresh?.fileAssetId) {
        return {
          skip: true,
          reason: 'already_exists',
          message:
            'Un rapport non modifié existe déjà pour cette période. Éditez-le ou attendez la prochaine fenêtre.',
          existingJobId: fresh.id,
          existingFileAssetId: fresh.fileAssetId,
        };
      }
    }

    return { skip: false };
  }

  /** Vérifie les CSV synchrones (sans job) via métadonnées FileAsset. */
  async checkCsvDuplicate(
    templateKey: string,
    dedupeBucketKey: string,
  ): Promise<ReportDedupeResult> {
    const dedupeKey = buildReportDedupeBucketKey(templateKey, 'CSV', dedupeBucketKey);
    const assets = await this.prisma.fileAsset.findMany({
      where: {
        module: 'pilotage-supervision',
        entityType: 'pilotage-report',
        status: 'ACTIVE',
        deletedAt: null,
        metadata: { path: ['dedupeBucketKey'], equals: dedupeKey },
      },
      select: { id: true, metadata: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const fresh = assets.find((a) => !isAssetEdited(a.metadata));
    if (fresh) {
      return {
        skip: true,
        reason: 'already_exists',
        message: 'Un rapport CSV identique existe déjà pour cette période (non modifié).',
        existingFileAssetId: fresh.id,
      };
    }

    return { skip: false };
  }

  async assertCanGenerate(
    input: ReportDedupeInput & { requestedById: string },
  ): Promise<ReportDedupeResult> {
    const rate = await this.checkRateLimit(input.requestedById);
    if (rate?.skip) return rate;
    return this.checkDuplicate(input);
  }
}

export class ReportGenerationSkippedError extends Error {
  readonly code: 'ALREADY_EXISTS' | 'ALREADY_PENDING' | 'RATE_LIMIT';
  readonly existingJobId?: string;
  readonly existingFileAssetId?: string;

  constructor(result: ReportDedupeResult) {
    super(result.message ?? 'Génération bloquée.');
    this.name = 'ReportGenerationSkippedError';
    this.code =
      result.reason === 'rate_limit'
        ? 'RATE_LIMIT'
        : result.reason === 'already_pending'
          ? 'ALREADY_PENDING'
          : 'ALREADY_EXISTS';
    this.existingJobId = result.existingJobId;
    this.existingFileAssetId = result.existingFileAssetId;
  }
}
