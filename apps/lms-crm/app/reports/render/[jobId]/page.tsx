import { notFound } from 'next/navigation';
import { ReportJobService } from '@repo/api-core';
import { getReportTemplate } from '@repo/report-engine';
import { ReportDocumentShell } from '@/components/reports/report-document-shell';
import { AcademicFicheCandidatReport } from '@/components/reports/templates/academic-fiche-candidat-report';
import { PilotageGrIndicateursReport } from '@/components/reports/templates/pilotage-gr-indicateurs-report';
import { RhContratTravailReport } from '@/components/reports/templates/rh-contrat-travail-report';
import { RhEmargementSessionReport } from '@/components/reports/templates/rh-emargement-session-report';
import {
  loadContratTravailReportData,
  loadEmargementReportData,
  loadFicheCandidatReportData,
  loadFicheCollaborateurReportData,
  loadPilotageGrIndicateursReportData,
} from '@/lib/reports/load-report-data';
import { prisma } from '@/lib/prisma';

type Props = {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ token?: string }>;
};

function jobParam(parameters: unknown, key: string): string | undefined {
  if (!parameters || typeof parameters !== 'object') return undefined;
  const v = (parameters as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : undefined;
}

export default async function ReportRenderPage({ params, searchParams }: Props) {
  const { jobId } = await params;
  const { token } = await searchParams;
  if (!token) notFound();

  const service = new ReportJobService(prisma);
  const job = await service.getJobForRender(jobId, token);
  if (!job) notFound();

  const template = getReportTemplate(job.templateKey);
  if (!template) notFound();

  const author = await prisma.user.findUnique({
    where: { id: job.requestedById },
    select: { firstName: true, lastName: true, email: true },
  });
  const authorName =
    [author?.firstName, author?.lastName].filter(Boolean).join(' ').trim() || author?.email || null;

  let body: React.ReactNode = (
    <p className="text-sm text-slate-600">Modèle « {template.label} » — contenu en cours de branchement.</p>
  );

  switch (job.templateKey) {
    case 'pilotage.gr-indicateurs': {
      const data = await loadPilotageGrIndicateursReportData(job.period);
      if (data) body = <PilotageGrIndicateursReport data={data} />;
      break;
    }
    case 'rh.emargement-session': {
      const sessionId = jobParam(job.parameters, 'sessionId');
      if (sessionId) {
        const data = await loadEmargementReportData(sessionId);
        if (data) body = <RhEmargementSessionReport data={data} />;
      }
      break;
    }
    case 'academic.fiche-candidat': {
      const candidatureId = jobParam(job.parameters, 'candidatureId');
      if (candidatureId) {
        const data = await loadFicheCandidatReportData(candidatureId);
        if (data) body = <AcademicFicheCandidatReport data={data} />;
      }
      break;
    }
    case 'rh.contrat-travail': {
      const userId = jobParam(job.parameters, 'userId');
      if (userId) {
        const data = await loadContratTravailReportData(userId);
        if (data) body = <RhContratTravailReport data={data} />;
      }
      break;
    }
    case 'rh.fiche-collaborateur': {
      const userId = jobParam(job.parameters, 'userId');
      if (userId) {
        const data = await loadFicheCollaborateurReportData(userId);
        if (data) body = <RhContratTravailReport data={data} />;
      }
      break;
    }
    default:
      break;
  }

  return (
    <ReportDocumentShell
      title={job.title}
      subtitle={template.label}
      periodLabel={job.periodLabel}
      generatedAt={job.createdAt.toISOString()}
      authorName={authorName}
      summary={job.summary}
    >
      {body}
    </ReportDocumentShell>
  );
}
