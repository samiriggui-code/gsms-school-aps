import fs from 'node:fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  CNAPS_CHECKBOXES,
  CNAPS_TEXT_FIELDS,
  type CnapsPoint,
  type CnapsTextField,
} from '@/lib/cnaps/cnaps-form-coordinates';
import { resolveCnapsTemplatePath } from '@/lib/cnaps/cnaps-template-path';
import { composeCandidateAddressLine } from '@/lib/cnaps/cnaps-onboarding-fields';
import type { CnapsFormPayload } from '@/lib/cnaps/resolve-cnaps-form-data';

function asciiSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function toPdfPrintableText(value: string | null | undefined): string {
  if (!value?.trim()) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function composeCandidateAddressLineForPdf(payload: CnapsFormPayload['candidate']): string {
  return composeCandidateAddressLine(payload);
}

function fitFontSize(
  text: string,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  maxWidth: number,
  preferredSize: number,
): number {
  let size = preferredSize;
  while (size >= 6 && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.5;
  }
  return size;
}

function drawTextField(
  pages: ReturnType<PDFDocument['getPages']>,
  field: CnapsTextField,
  value: string | null | undefined,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
) {
  const printable = toPdfPrintableText(value);
  if (!printable) return;
  const page = pages[field.page];
  if (!page) return;

  const maxWidth = field.maxWidth ?? 400;
  const preferredSize = field.size ?? 9;
  const size = fitFontSize(printable, font, maxWidth, preferredSize);

  page.drawText(printable, {
    x: field.x,
    y: field.y,
    size,
    font,
    color: rgb(0.1, 0.1, 0.15),
  });
}

function drawCheckbox(
  pages: ReturnType<PDFDocument['getPages']>,
  point: CnapsPoint,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
) {
  const page = pages[point.page];
  if (!page) return;
  page.drawText('X', {
    x: point.x + 2.2,
    y: point.y + 1.2,
    size: 8,
    font,
    color: rgb(0.1, 0.1, 0.15),
  });
}

export async function buildCnapsPrefilledPdf(payload: CnapsFormPayload): Promise<Buffer> {
  const templatePath = resolveCnapsTemplatePath();
  const templateBytes = fs.readFileSync(templatePath);
  const doc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  drawTextField(pages, CNAPS_TEXT_FIELDS.nom, payload.candidate.lastName, font);
  drawTextField(pages, CNAPS_TEXT_FIELDS.usageName, payload.candidate.usageName, font);
  drawTextField(
    pages,
    CNAPS_TEXT_FIELDS.address,
    composeCandidateAddressLine(payload.candidate),
    font,
  );

  drawTextField(pages, CNAPS_TEXT_FIELDS.schoolName, payload.school.name, font);
  drawTextField(pages, CNAPS_TEXT_FIELDS.schoolSiret, payload.school.siret, font);
  drawTextField(pages, CNAPS_TEXT_FIELDS.schoolCnapsAuth, payload.school.cnapsAuthorization, font);
  drawTextField(pages, CNAPS_TEXT_FIELDS.schoolAddress, payload.school.address, font);
  drawTextField(pages, CNAPS_TEXT_FIELDS.schoolPostalCode, payload.school.postalCode, font);
  drawTextField(pages, CNAPS_TEXT_FIELDS.schoolCity, payload.school.city, font);

  drawTextField(pages, CNAPS_TEXT_FIELDS.formationLabel, payload.formation.label, font);

  for (const key of payload.checkboxes) {
    const point = CNAPS_CHECKBOXES[key];
    if (point) drawCheckbox(pages, point, font);
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export function cnapsPrefilledFilename(lastName: string): string {
  const slug = asciiSlug(lastName).slice(0, 32) || 'candidat';
  const ymd = new Date().toISOString().slice(0, 10);
  return `cnaps-prefill_${slug}_${ymd}.pdf`;
}
