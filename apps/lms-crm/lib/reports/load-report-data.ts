import { ReportDataService } from '@repo/api-core';
import { prisma } from '@/lib/prisma';

const dataService = new ReportDataService(prisma);

export async function loadPilotageGrIndicateursReportData(period: string) {
  return dataService.loadPilotageIndicateurs(period);
}

export async function loadEmargementReportData(sessionId: string) {
  return dataService.loadEmargementSession(sessionId);
}

export async function loadFicheCandidatReportData(candidatureId: string) {
  return dataService.loadFicheCandidat(candidatureId);
}

export async function loadContratTravailReportData(userId: string) {
  return dataService.loadContratTravail(userId);
}

export async function loadFicheCollaborateurReportData(userId: string) {
  return dataService.loadFicheCollaborateur(userId);
}
