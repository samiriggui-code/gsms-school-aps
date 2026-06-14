import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type { PilotagePeriod } from '@/lib/pilotage/modules';
import type {
  PilotageIndicateursPayload,
  PilotageLandingPayload,
  PilotageRapportsPayload,
  PilotageRisquesPayload,
} from '@repo/api-core';

async function parsePilotage<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } }).error?.message ?? 'Erreur serveur';
    throw new Error(msg);
  }
  return unwrapSectionApiData<T>(json) as T;
}

export async function fetchPilotageIndicateurs(moduleId: string, period: PilotagePeriod) {
  const qs = new URLSearchParams({ module: moduleId, period });
  const res = await apiFetch(`/api/sections/pilotage-supervision/pilotage/indicateurs?${qs}`);
  return parsePilotage<PilotageIndicateursPayload & { available?: boolean }>(res);
}

export async function fetchPilotageRisques(moduleId: string) {
  const qs = new URLSearchParams({ module: moduleId });
  const res = await apiFetch(`/api/sections/pilotage-supervision/pilotage/risques?${qs}`);
  return parsePilotage<PilotageRisquesPayload & { available?: boolean }>(res);
}

export async function fetchPilotageRapports(
  moduleId: string,
  period: PilotagePeriod | 'custom',
  customRange?: { start: string; end: string },
) {
  const qs = new URLSearchParams({ module: moduleId, period });
  if (customRange) {
    qs.set('start', customRange.start);
    qs.set('end', customRange.end);
  }
  const res = await apiFetch(`/api/sections/pilotage-supervision/pilotage/rapports?${qs}`);
  return parsePilotage<PilotageRapportsPayload & { available?: boolean; periodLabel?: string }>(res);
}

export async function generatePilotageReport(
  templateId: string,
  period: PilotagePeriod,
  options?: { label?: string; description?: string },
) {
  const res = await apiFetch('/api/sections/pilotage-supervision/pilotage/rapports/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId, period, ...options }),
  });
  return parsePilotage<{ row: PilotageRapportsPayload['rows'][number] }>(res);
}

export async function updatePilotageReport(id: string, patch: { label?: string; description?: string }) {
  const res = await apiFetch(`/api/sections/pilotage-supervision/pilotage/rapports/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return parsePilotage<{ row: PilotageRapportsPayload['rows'][number] }>(res);
}

export async function deletePilotageReport(id: string) {
  const res = await apiFetch(`/api/sections/pilotage-supervision/pilotage/rapports/${id}`, {
    method: 'DELETE',
  });
  return parsePilotage<{ success: boolean }>(res);
}

export function pilotageReportDownloadUrl(id: string) {
  return `/api/sections/pilotage-supervision/pilotage/rapports/${id}/download`;
}

export async function fetchPilotageLanding() {
  const res = await apiFetch('/api/sections/pilotage-supervision/pilotage/landing');
  return parsePilotage<PilotageLandingPayload>(res);
}

export type PilotageReportSchedule = {
  id: string;
  templateKey: string;
  templateLabel: string;
  format: string;
  frequency: 'DAILY' | 'MONTHLY' | 'QUARTERLY';
  frequencyLabel: string;
  title: string;
  summary: string | null;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
};

export async function fetchPilotageReportSchedules() {
  const res = await apiFetch('/api/sections/pilotage-supervision/pilotage/rapports/schedules');
  return parsePilotage<{ schedules: PilotageReportSchedule[] }>(res);
}

export async function updatePilotageReportSchedule(id: string, enabled: boolean) {
  const res = await apiFetch('/api/sections/pilotage-supervision/pilotage/rapports/schedules', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, enabled }),
  });
  return parsePilotage<{ schedule: PilotageReportSchedule }>(res);
}

export async function runPilotageReportScheduleNow(id: string) {
  const res = await apiFetch('/api/sections/pilotage-supervision/pilotage/rapports/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  return parsePilotage<{
    jobId?: string;
    skipped?: boolean;
    message?: string;
    existingJobId?: string;
    existingFileAssetId?: string;
    schedule: PilotageReportSchedule;
  }>(res);
}
