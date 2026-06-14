import ExcelJS from 'exceljs';

export type ExcelSheetInput = {
  name: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
};

export async function buildExcelWorkbook(sheets: ExcelSheetInput[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'FORM\'SSI CRM';
  wb.created = new Date();

  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name.slice(0, 31));
    ws.addRow(sheet.headers);
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' },
    };
    for (const row of sheet.rows) {
      ws.addRow(row.map((c) => (c == null ? '' : c)));
    }
    ws.columns.forEach((col) => {
      let max = 12;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const len = String(cell.value ?? '').length;
        if (len > max) max = Math.min(len + 2, 48);
      });
      col.width = max;
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export type PilotageIndicateursExcelData = {
  kpis: { label: string; value: string | number; subtitle: string }[];
  evolution: { label: string; value: number }[];
  distribution: { name: string; value: number }[];
};

export async function buildPilotageIndicateursExcel(data: PilotageIndicateursExcelData): Promise<Buffer> {
  return buildExcelWorkbook([
    {
      name: 'KPI',
      headers: ['Indicateur', 'Valeur', 'Détail'],
      rows: data.kpis.map((k) => [k.label, k.value, k.subtitle]),
    },
    {
      name: 'Évolution',
      headers: ['Période', 'Valeur'],
      rows: data.evolution.map((p) => [p.label, p.value]),
    },
    {
      name: 'Répartition',
      headers: ['Catégorie', 'Valeur'],
      rows: data.distribution.map((d) => [d.name, d.value]),
    },
  ]);
}

export type EmargementExcelRow = { index: number; name: string; email: string; signature: string };

export async function buildEmargementExcel(meta: {
  formationName: string;
  sessionLabel: string;
  location: string;
  trainerName: string;
  attendanceDate: string;
  participants: EmargementExcelRow[];
}): Promise<Buffer> {
  return buildExcelWorkbook([
    {
      name: 'Émargement',
      headers: ['N°', 'Nom', 'Email', 'Signature'],
      rows: meta.participants.map((p) => [p.index, p.name, p.email, p.signature]),
    },
    {
      name: 'Infos',
      headers: ['Champ', 'Valeur'],
      rows: [
        ['Formation', meta.formationName],
        ['Session', meta.sessionLabel],
        ['Lieu', meta.location],
        ['Formateur', meta.trainerName],
        ['Date', meta.attendanceDate],
      ],
    },
  ]);
}

export async function buildFicheCandidatExcel(rows: { section: string; label: string; value: string }[]): Promise<Buffer> {
  return buildExcelWorkbook([
    {
      name: 'Fiche candidat',
      headers: ['Section', 'Champ', 'Valeur'],
      rows: rows.map((r) => [r.section, r.label, r.value]),
    },
  ]);
}
