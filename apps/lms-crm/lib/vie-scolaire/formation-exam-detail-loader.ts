import { prisma } from '@/lib/prisma';
import { parseReservedEquipmentIds } from '@repo/api-core';
import { loadSuiviSessionContext } from '@/lib/suivi-formations/session-suivi-context';
import type { SuiviSessionContext } from '@/lib/suivi-formations/session-suivi-context-types';
import {
  formationExamDetailInclude,
  serializeFormationExamRow,
} from '@/app/api/sections/gestion-academique/vie-scolaire/formation-exams/_serialize-formation-exam';
import { FORMATION_EXAM_OFFICIAL_DOCUMENTS } from '@/lib/vie-scolaire/formation-exam-documents';
import { listLatestExamArchivedDocuments } from '@/lib/vie-scolaire/formation-exam-document-store';
import { EXAM_EQUIPMENT_CATALOG } from '@/lib/exam-pedagogical-equipment-catalog';

export type ExamArchivedDocumentSummary = {
  docType: string;
  fileAssetId: string;
  url: string;
  originalName: string;
  size: number;
  createdAt: string;
  createdByName: string | null;
};

export type FormationExamDetailResponse = ReturnType<typeof serializeFormationExamRow> & {
  sessionContext: SuiviSessionContext | null;
  examEquipment: Array<{
    id: string;
    name: string;
    serialNumber: string | null;
    type: string | null;
  }>;
  pedagogicalChecklist: Array<{ label: string; regulatoryRef?: string }>;
  officialDocuments: typeof FORMATION_EXAM_OFFICIAL_DOCUMENTS;
  archivedDocuments: ExamArchivedDocumentSummary[];
  planningComplete: boolean;
  planningWarnings: string[];
};

export async function loadFormationExamDetail(examId: string): Promise<FormationExamDetailResponse | null> {
  const row = await prisma.formationExam.findUnique({
    where: { id: examId },
    include: formationExamDetailInclude,
  });
  if (!row) return null;

  const base = serializeFormationExamRow(row);
  const sessionContext = await loadSuiviSessionContext(row.sessionId);

  const equipmentIds = parseReservedEquipmentIds(row.session.examReservedEquipmentIds);
  const equipmentRows =
    equipmentIds.length > 0
      ? await prisma.equipment.findMany({
          where: { id: { in: equipmentIds } },
          select: {
            id: true,
            label: true,
            serialNumber: true,
            type: true,
          },
          orderBy: { label: 'asc' },
        })
      : [];

  const examEquipment = equipmentRows.map((e) => ({
    id: e.id,
    name: e.label,
    serialNumber: e.serialNumber,
    type: e.type,
  }));

  const planningWarnings: string[] = [];
  if (!base.scheduledAt) {
    planningWarnings.push('Date et heure d’examen non renseignées sur la session.');
  }
  if (!base.venueRoom) {
    planningWarnings.push('Salle d’examen (PCS Orion, Plateau Phoenix…) non assignée.');
  }
  if (base.participantCount === 0) {
    planningWarnings.push('Aucun candidat inscrit avec dossier validé.');
  }
  if (!base.session.trainer?.name && !base.session.trainer?.email) {
    planningWarnings.push('Formateur référent non assigné à la session.');
  }

  const pedagogicalChecklist = EXAM_EQUIPMENT_CATALOG.slice(0, 8).map((entry) => ({
    label: entry.catalogLabel,
    regulatoryRef: entry.regulatoryRef,
  }));

  const archivedDocuments = await listLatestExamArchivedDocuments(row.sessionId, examId);

  return {
    ...base,
    sessionContext,
    examEquipment,
    pedagogicalChecklist,
    officialDocuments: FORMATION_EXAM_OFFICIAL_DOCUMENTS,
    archivedDocuments,
    planningComplete: planningWarnings.length === 0,
    planningWarnings,
  };
}
