import type { PrismaClient, ReportGenerationJob } from '@repo/database';
import {
  PILOTAGE_REPORT_ENTITY,
  PILOTAGE_REPORT_MODULE,
  ReportDataService,
  ReportJobService,
  notifyReportGenerated,
  sendReportGeneratedEmails,
} from '@repo/api-core';
import {
  buildEmargementExcel,
  buildFicheCandidatExcel,
  buildPilotageIndicateursExcel,
  buildReportFileMetadata,
  getReportTemplate,
} from '@repo/report-engine';
import { uploadFile } from '@repo/storage';
import cron from 'node-cron';

const POLL_CRON =
  process.env.REPORT_WORKER_POLL_CRON ??
  (process.env.NODE_ENV === 'production' ? '*/30 * * * * *' : '0 * * * * *');
const REPORT_MODULE = 'reports';
const REPORT_ENTITY = 'generation-job';

function baseUrl() {
  return (process.env.REPORT_APP_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3001').replace(
    /\/$/,
    '',
  );
}

function jobParams(job: ReportGenerationJob): Record<string, string> {
  const raw = job.parameters;
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

function parseJobGenerationSource(parameters: unknown): string | undefined {
  if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) return undefined;
  const source = (parameters as Record<string, unknown>).generationSource;
  if (source === 'manual' || source === 'schedule' || source === 'run_now') return source;
  return undefined;
}

async function renderPdfBuffer(jobId: string, token: string): Promise<Buffer> {
  const { chromium } = await import('playwright');
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  const url = `${baseUrl()}/reports/render/${jobId}?token=${encodeURIComponent(token)}`;
  const browser = await chromium.launch({
    headless: true,
    executablePath: executablePath || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1240, height: 1754 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 });
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '12mm', bottom: '14mm', left: '12mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function buildExcelBuffer(prisma: PrismaClient, job: ReportGenerationJob): Promise<Buffer> {
  const dataService = new ReportDataService(prisma);
  const params = jobParams(job);

  switch (job.templateKey) {
    case 'pilotage.gr-indicateurs': {
      const data = await dataService.loadPilotageIndicateurs(job.period);
      if (!data) throw new Error('Données indicateurs indisponibles');
      return buildPilotageIndicateursExcel(data);
    }
    case 'rh.emargement-session': {
      const sessionId = params.sessionId;
      if (!sessionId) throw new Error('sessionId requis');
      const data = await dataService.loadEmargementSession(sessionId);
      if (!data) throw new Error('Session introuvable');
      return buildEmargementExcel({
        ...data,
        participants: data.participants.map((p) => ({ ...p, signature: '' })),
      });
    }
    case 'academic.fiche-candidat': {
      const candidatureId = params.candidatureId;
      if (!candidatureId) throw new Error('candidatureId requis');
      const data = await dataService.loadFicheCandidat(candidatureId);
      if (!data) throw new Error('Candidature introuvable');
      return buildFicheCandidatExcel(data.rows);
    }
    case 'rh.fiche-collaborateur':
    case 'rh.contrat-travail': {
      const userId = params.userId;
      if (!userId) throw new Error('userId requis');
      const data = await dataService.loadFicheCollaborateur(userId);
      if (!data) throw new Error('Collaborateur introuvable');
      return buildFicheCandidatExcel(
        data.rows.map((r) => ({ section: 'Contrat RH', label: r.label, value: r.value })),
      );
    }
    default:
      throw new Error(`Excel non implémenté pour ${job.templateKey}`);
  }
}

async function persistFile(
  prisma: PrismaClient,
  jobId: string,
  userId: string,
  filename: string,
  buffer: Buffer,
  mimeType: string,
  meta: Record<string, unknown>,
) {
  const file = new File([buffer], filename, { type: mimeType });
  const uploaded = await uploadFile({
    file,
    module: REPORT_MODULE,
    entityType: REPORT_ENTITY,
    entityId: jobId,
    category: mimeType.includes('sheet') ? 'excel' : 'pdf',
    visibility: 'private',
  });
  const asset = await prisma.fileAsset.create({
    data: {
      module: PILOTAGE_REPORT_MODULE,
      entityType: PILOTAGE_REPORT_ENTITY,
      entityId: jobId,
      category: 'export',
      originalName: uploaded.originalName,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
      storageKey: uploaded.key,
      url: uploaded.url,
      visibility: 'PRIVATE',
      status: 'ACTIVE',
      metadata: meta,
      createdById: userId,
    },
  });
  return asset.id;
}

async function afterReportCompleted(
  prisma: PrismaClient,
  job: ReportGenerationJob,
  fileAssetId: string,
) {
  const params =
    job.parameters && typeof job.parameters === 'object' && !Array.isArray(job.parameters)
      ? (job.parameters as Record<string, unknown>)
      : {};
  const source =
    params.generationSource === 'schedule' || params.generationSource === 'run_now'
      ? (params.generationSource as 'schedule' | 'run_now')
      : 'manual';
  const scheduleId = typeof params.scheduleId === 'string' ? params.scheduleId : undefined;

  const payload = {
    jobId: job.id,
    fileAssetId,
    templateKey: job.templateKey,
    title: job.title,
    periodLabel: job.periodLabel,
    format: job.format,
    requestedById: job.requestedById,
    source,
    scheduleId,
  };

  try {
    await notifyReportGenerated(prisma, payload);
    await sendReportGeneratedEmails(prisma, payload);
  } catch (err) {
    console.error('[ReportWorker] notification error', err);
  }
}

async function processOneJob(prisma: PrismaClient, service: ReportJobService, jobId: string) {
  const job = await service.getJob(jobId);
  if (!job || job.status !== 'PENDING') return;

  await service.markRunning(job.id);
  const template = getReportTemplate(job.templateKey);

  try {
    if (job.format === 'PDF') {
      if (!template) throw new Error('Modèle introuvable');
      const buffer = await renderPdfBuffer(job.id, job.renderToken);
      const filename = `${template.key}-${job.period}-${job.id.slice(0, 8)}.pdf`;
      const fileAssetId = await persistFile(prisma, job.id, job.requestedById, filename, buffer, 'application/pdf', {
        ...buildReportFileMetadata({
          templateKey: job.templateKey,
          label: job.title,
          format: 'PDF',
          period: job.period,
          periodLabel: job.periodLabel,
          description: job.summary ?? template.description,
        }),
        jobId: job.id,
        parameters: job.parameters,
        generationSource: parseJobGenerationSource(job.parameters),
      });
      await service.markCompleted(job.id, fileAssetId);
      await afterReportCompleted(prisma, job, fileAssetId);
      console.log(`[ReportWorker] PDF OK ${job.id}`);
      return;
    }

    if (job.format === 'EXCEL') {
      const buffer = await buildExcelBuffer(prisma, job);
      const filename = `${job.templateKey}-${job.period}-${job.id.slice(0, 8)}.xlsx`;
      const fileAssetId = await persistFile(
        prisma,
        job.id,
        job.requestedById,
        filename,
        buffer,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        {
          ...buildReportFileMetadata({
            templateKey: job.templateKey,
            label: job.title,
            format: 'EXCEL',
            period: job.period,
            periodLabel: job.periodLabel,
            description: job.summary ?? template?.description,
          }),
          jobId: job.id,
          parameters: job.parameters,
          generationSource: parseJobGenerationSource(job.parameters),
        },
      );
      await service.markCompleted(job.id, fileAssetId);
      await afterReportCompleted(prisma, job, fileAssetId);
      console.log(`[ReportWorker] EXCEL OK ${job.id}`);
      return;
    }

    if (job.format === 'CSV') {
      throw new Error('CSV : génération synchrone via API export');
    }

    throw new Error(`Format non géré : ${job.format}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    await service.markFailed(job.id, msg);
    console.error(`[ReportWorker] FAILED ${job.id}:`, msg);
  }
}

export function setupReportGenerator(prisma: PrismaClient) {
  if (process.env.REPORT_WORKER_DISABLED === '1') {
    console.log('[ReportWorker] désactivé (REPORT_WORKER_DISABLED=1)');
    return;
  }

  const service = new ReportJobService(prisma);

  cron.schedule(POLL_CRON, async () => {
    try {
      const pending = await service.listPending(3);
      for (const job of pending) {
        await processOneJob(prisma, service, job.id);
      }
    } catch (e) {
      console.error('[ReportWorker] poll error', e);
    }
  });

  console.log('[ReportWorker] PDF + Excel actifs (Playwright / exceljs)');
}
