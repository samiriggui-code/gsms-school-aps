import fs from 'fs';
import path from 'path';
import { loadSystemSettings } from '@/app/api/_shared/company-profile-get';
import { buildOrganizationAddressLine } from '@/lib/reports/document-brand';

export type AttendancePdfBrandContext = {
  companyName: string;
  addressLine: string;
  siret: string;
  ndaNumber: string;
  qualiopiRef: string;
  phone: string;
  email: string;
  website: string;
  logoBuffer: Buffer | null;
  qualiopiLogoBuffer: Buffer | null;
};

function readLocalFileIfExists(filePath: string): Buffer | null {
  try {
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath);
  } catch {
    /* ignore */
  }
  return null;
}

function getAppRoot(): string {
  const cwd = process.cwd();
  const nested = path.join(cwd, 'apps', 'lms-crm');
  if (fs.existsSync(path.join(nested, 'package.json'))) return nested;
  return cwd;
}

/** Résout une image locale (`/brand/...`, `public/...`) ou distante en buffer PDFKit. */
export async function loadImageBuffer(source: string | null | undefined): Promise<Buffer | null> {
  const raw = source?.trim();
  if (!raw) return null;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const res = await fetch(raw, { cache: 'no-store' });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
    return null;
  }

  const root = getAppRoot();
  const relative = raw.replace(/^\//, '').replace(/\.\./g, '');
  const candidates = [
    path.join(root, 'public', relative),
    path.join(root, 'content', 'docs', path.basename(relative)),
  ];

  for (const candidate of candidates) {
    const buf = readLocalFileIfExists(candidate);
    if (buf) return buf;
  }

  return null;
}

async function loadDefaultBrandLogo(): Promise<Buffer | null> {
  const root = getAppRoot();
  const candidates = [
    path.join(root, 'public', 'brand', 'formssi-logo-full.png'),
    path.join(root, 'content', 'docs', 'formssi-logo-full.png'),
    path.join(root, 'content', 'docs', 'formssi-logo-light.png'),
  ];
  for (const candidate of candidates) {
    const buf = readLocalFileIfExists(candidate);
    if (buf) return buf;
  }
  return null;
}

async function loadQualiopiLogo(): Promise<Buffer | null> {
  return (
    readLocalFileIfExists(
      path.join(getAppRoot(), 'public', 'images', 'certifications', 'logo-qualiopi.png'),
    ) ?? null
  );
}

/** Charge identité organisme (SystemSetting) + logos pour en-tête PDF. */
export async function loadAttendancePdfBrandContext(): Promise<AttendancePdfBrandContext> {
  const settings = await loadSystemSettings();

  const companyName = settings?.name?.trim() || "FORM'SSI";
  const addressLine = buildOrganizationAddressLine(settings);

  const logoFromSettings = await loadImageBuffer(settings?.logo ?? null);
  const logoBuffer = logoFromSettings ?? (await loadDefaultBrandLogo());
  const qualiopiLogoBuffer = await loadQualiopiLogo();

  return {
    companyName,
    addressLine,
    siret: settings?.siret?.trim() ?? '',
    ndaNumber: settings?.ndaNumber?.trim() ?? '',
    qualiopiRef: settings?.agreementQualiopiRef?.trim() ?? '',
    phone: settings?.supportPhone?.trim() ?? '',
    email: settings?.supportEmail?.trim() ?? '',
    website: settings?.websiteURL?.trim() ?? '',
    logoBuffer,
    qualiopiLogoBuffer,
  };
}
