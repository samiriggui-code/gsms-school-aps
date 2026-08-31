import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveEntityUploadDir } from './storage-constants';

export type StorageVisibility = 'private' | 'internal' | 'public';
export type StorageMode = 'local' | 'remote';

export interface UploadInput {
  file: File;
  module: string;
  entityType: string;
  entityId?: string | null;
  category?: string | null;
  visibility?: StorageVisibility;
}

export interface UploadResult {
  key: string;
  url: string;
  mimeType: string;
  size: number;
  originalName: string;
  visibility: StorageVisibility;
}

export interface StoredFilePayload {
  body: Buffer;
  contentType: string;
  cacheControl: string;
}

const PLACEHOLDER_PATTERNS = [
  /^your[_-]/i,
  /^changeme$/i,
  /^replace[_-]?me$/i,
  /^xxx+$/i,
  /^todo$/i,
];

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function isPlaceholderValue(value: string | undefined | null): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getStorageMode(): StorageMode {
  if (!isRemoteStorageConfigured()) return 'local';
  return 'remote';
}

export function isRemoteStorageConfigured(): boolean {
  const bucket = process.env.STORAGE_BUCKET;
  const endpoint = process.env.STORAGE_ENDPOINT;
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;

  if (
    isPlaceholderValue(bucket) ||
    isPlaceholderValue(endpoint) ||
    isPlaceholderValue(accessKeyId) ||
    isPlaceholderValue(secretAccessKey)
  ) {
    return false;
  }

  return isValidHttpUrl(endpoint!.trim());
}

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Identifiant de clé stockage — CSPRNG (pas Date.now + Math.random). */
function randomId() {
  return randomBytes(16).toString('hex');
}

function forcePathStyle(): boolean {
  const raw = process.env.STORAGE_FORCE_PATH_STYLE;
  if (raw == null || raw === '') return true;
  return raw === '1' || raw.toLowerCase() === 'true';
}

function getClient(): S3Client {
  const region = getEnv('STORAGE_REGION', 'us-east-1');
  const endpoint = getEnv('STORAGE_ENDPOINT').trim();
  const accessKeyId = getEnv('STORAGE_ACCESS_KEY_ID');
  const secretAccessKey = getEnv('STORAGE_SECRET_ACCESS_KEY');

  if (!isValidHttpUrl(endpoint)) {
    throw new Error(`STORAGE_ENDPOINT invalide: ${endpoint}`);
  }

  return new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: forcePathStyle(),
  });
}

function getPublicBaseUrl(): string {
  const cdn = process.env.STORAGE_CDN_URL?.trim().replace(/\/$/, '');
  if (cdn && !isPlaceholderValue(cdn) && isValidHttpUrl(cdn)) {
    return cdn;
  }

  const publicBase = process.env.STORAGE_PUBLIC_BASE_URL?.trim().replace(/\/$/, '');
  if (publicBase && !isPlaceholderValue(publicBase) && isValidHttpUrl(publicBase)) {
    return publicBase;
  }

  const nextAuth = process.env.NEXTAUTH_URL?.trim().replace(/\/$/, '');
  if (nextAuth && isValidHttpUrl(nextAuth)) {
    return `${nextAuth}/api/public/storage`;
  }

  const endpoint = getEnv('STORAGE_ENDPOINT').replace(/\/$/, '');
  const bucket = getEnv('STORAGE_BUCKET');
  return `${endpoint}/${bucket}`;
}

function ensureSafeRelativePath(key: string) {
  return key.replace(/^\/+/, '').replace(/\.\./g, '');
}

/** Racine unique des uploads en dev local (CRM + workers monorepo). */
export function resolveLocalUploadRoot(): string {
  const explicit = process.env.STORAGE_LOCAL_ROOT?.trim();
  if (explicit) return path.resolve(explicit);

  const cwd = process.cwd();
  const normalized = cwd.replace(/\\/g, '/');

  if (normalized.endsWith('/packages/workers') || normalized.includes('/packages/workers/')) {
    return path.resolve(cwd, '../../apps/lms-crm/public/uploads');
  }
  if (normalized.endsWith('/apps/lms-crm') || normalized.includes('/apps/lms-crm/')) {
    return path.resolve(cwd, 'public/uploads');
  }
  return path.resolve(cwd, 'public/uploads');
}

function localAbsolutePath(key: string): string {
  const safeKey = ensureSafeRelativePath(key.replace(/^uploads\//, ''));
  return path.join(resolveLocalUploadRoot(), safeKey);
}

/** Anciens chemins (worker écrivait sous packages/workers/public/uploads). */
function legacyLocalAbsolutePaths(key: string): string[] {
  const safeKey = ensureSafeRelativePath(key.replace(/^uploads\//, ''));
  const cwd = process.cwd();
  const normalized = cwd.replace(/\\/g, '/');
  const legacy: string[] = [];

  if (normalized.endsWith('/apps/lms-crm') || normalized.includes('/apps/lms-crm/')) {
    legacy.push(path.resolve(cwd, '../../packages/workers/public/uploads', safeKey));
  }
  if (normalized.endsWith('/packages/workers') || normalized.includes('/packages/workers/')) {
    legacy.push(path.join(cwd, 'public', 'uploads', safeKey));
  }
  legacy.push(path.join(cwd, 'public', 'uploads', safeKey));

  return [...new Set(legacy)];
}

async function readLocalStoredFile(key: string): Promise<StoredFilePayload | null> {
  const safeKey = ensureSafeRelativePath(key);
  if (!safeKey) return null;

  const candidates = [localAbsolutePath(safeKey), ...legacyLocalAbsolutePaths(safeKey)];

  for (const filePath of candidates) {
    try {
      const bytes = await readFile(filePath);
      return {
        body: bytes,
        contentType: 'application/octet-stream',
        cacheControl: 'public, max-age=86400',
      };
    } catch {
      // essai chemin suivant
    }
  }
  return null;
}

function buildStoragePath(input: UploadInput): string {
  return resolveEntityUploadDir(input);
}

function localPublicUrl(key: string): string {
  const safeKey = ensureSafeRelativePath(key.replace(/^uploads\//, ''));
  return `/uploads/${safeKey}`;
}

export function resolvePublicFileUrl(key: string): string {
  const safeKey = ensureSafeRelativePath(key);
  const publicBase = getPublicBaseUrl();

  if (publicBase.includes('/api/public/storage')) {
    return `${publicBase.replace(/\/$/, '')}/${safeKey}`;
  }

  if (getStorageMode() === 'local') {
    return localPublicUrl(safeKey);
  }

  return `${publicBase.replace(/\/$/, '')}/${safeKey}`;
}

async function uploadFileLocal(input: UploadInput): Promise<UploadResult> {
  const ext = input.file.name.includes('.')
    ? `.${input.file.name.split('.').pop()}`.toLowerCase()
    : '';
  const key = `${buildStoragePath(input)}/${randomId()}${ext}`;
  const safeKey = ensureSafeRelativePath(key);
  const targetPath = localAbsolutePath(safeKey);

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, Buffer.from(await input.file.arrayBuffer()));

  return {
    key: safeKey,
    url: localPublicUrl(safeKey),
    mimeType: input.file.type || 'application/octet-stream',
    size: input.file.size,
    originalName: input.file.name,
    visibility: input.visibility || 'private',
  };
}

/** Upload plat `company/avatars/...` — compat logos CRM historiques. */
export async function uploadFileToDirectory(
  file: File,
  directory: string,
  options?: { visibility?: StorageVisibility },
): Promise<UploadResult> {
  if (!file) throw new Error('No file provided');
  const visibility = options?.visibility ?? 'public';
  const dir = directory
    .split('/')
    .map((part) => sanitizeSegment(part))
    .filter(Boolean)
    .join('/');
  if (!dir) throw new Error('No directory specified');

  if (!isRemoteStorageConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Stockage distant non configuré (STORAGE_*). Définir MinIO/S3 ou monter un volume persistant.',
      );
    }

    const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}`.toLowerCase() : '';
    const key = `${dir}/${randomId()}${ext}`;
    const safeKey = ensureSafeRelativePath(key);
    const targetPath = localAbsolutePath(safeKey);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, Buffer.from(await file.arrayBuffer()));

    return {
      key: safeKey,
      url: localPublicUrl(safeKey),
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      originalName: file.name,
      visibility,
    };
  }

  const bucket = getEnv('STORAGE_BUCKET');
  const client = getClient();
  const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}`.toLowerCase() : '';
  const key = `${dir}/${randomId()}${ext}`;
  const body = Buffer.from(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: file.type || 'application/octet-stream',
      CacheControl: visibility === 'public' ? 'public, max-age=31536000' : 'private, max-age=0',
    }),
  );

  return {
    key,
    url: resolvePublicFileUrl(key),
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    originalName: file.name,
    visibility,
  };
}

export async function uploadFile(input: UploadInput): Promise<UploadResult> {
  if (!input.file) throw new Error('No file provided');

  if (!isRemoteStorageConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Stockage distant non configuré (STORAGE_*). Définir MinIO/S3 ou monter un volume persistant.',
      );
    }
    return uploadFileLocal(input);
  }

  const bucket = getEnv('STORAGE_BUCKET');
  const client = getClient();
  const visibility = input.visibility || 'private';

  const ext = input.file.name.includes('.')
    ? `.${input.file.name.split('.').pop()}`.toLowerCase()
    : '';
  const key = `${buildStoragePath(input)}/${randomId()}${ext}`;
  const body = Buffer.from(await input.file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: input.file.type || 'application/octet-stream',
      CacheControl: visibility === 'public' ? 'public, max-age=31536000' : 'private, max-age=0',
    }),
  );

  return {
    key,
    url: resolvePublicFileUrl(key),
    mimeType: input.file.type || 'application/octet-stream',
    size: input.file.size,
    originalName: input.file.name,
    visibility,
  };
}

export async function getStoredFile(key: string): Promise<StoredFilePayload | null> {
  const safeKey = ensureSafeRelativePath(key);
  if (!safeKey) return null;

  if (getStorageMode() === 'local') {
    return readLocalStoredFile(safeKey);
  }

  const bucket = getEnv('STORAGE_BUCKET');
  const client = getClient();

  try {
    const out = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: safeKey,
      }),
    );
    if (!out.Body) return null;
    const bytes = Buffer.from(await out.Body.transformToByteArray());
    return {
      body: bytes,
      contentType: out.ContentType || 'application/octet-stream',
      cacheControl: out.CacheControl || 'public, max-age=86400',
    };
  } catch {
    return null;
  }
}

export async function deleteFileByKey(key: string): Promise<void> {
  if (!key) return;
  const safeKey = ensureSafeRelativePath(key);

  if (getStorageMode() === 'local') {
    await unlink(localAbsolutePath(safeKey)).catch(() => undefined);
    return;
  }

  const bucket = getEnv('STORAGE_BUCKET');
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: safeKey,
    }),
  );
}

export function resolveKeyFromUrl(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();

  if (trimmed.startsWith('/uploads/')) {
    return trimmed.replace(/^\/uploads\//, '');
  }
  if (trimmed.startsWith('/api/public/storage/')) {
    return trimmed.replace(/^\/api\/public\/storage\//, '');
  }

  const cdn = process.env.STORAGE_CDN_URL?.replace(/\/$/, '');
  if (cdn && !isPlaceholderValue(cdn) && trimmed.startsWith(`${cdn}/`)) {
    return trimmed.slice(cdn.length + 1);
  }

  const publicBase = process.env.STORAGE_PUBLIC_BASE_URL?.replace(/\/$/, '');
  if (publicBase && !isPlaceholderValue(publicBase) && trimmed.startsWith(`${publicBase}/`)) {
    return trimmed.slice(publicBase.length + 1);
  }

  const nextAuth = process.env.NEXTAUTH_URL?.replace(/\/$/, '');
  if (nextAuth && trimmed.startsWith(`${nextAuth}/api/public/storage/`)) {
    return trimmed.replace(`${nextAuth}/api/public/storage/`, '');
  }

  const endpoint = process.env.STORAGE_ENDPOINT?.replace(/\/$/, '');
  const bucket = process.env.STORAGE_BUCKET;
  if (endpoint && !isPlaceholderValue(endpoint) && trimmed.startsWith(`${endpoint}/`)) {
    let rest = trimmed.slice(endpoint.length + 1);
    if (bucket && !isPlaceholderValue(bucket) && rest.startsWith(`${bucket}/`)) {
      rest = rest.slice(bucket.length + 1);
    }
    return rest;
  }

  return null;
}

/** @deprecated Utiliser getStorageMode() / isRemoteStorageConfigured() */
export function getS3ClientInstance(): S3Client {
  return getClient();
}

export {
  ENTITY_UPLOAD_ROUTES,
  STORAGE_SOCLE_MARKER,
  STORAGE_SOCLE_PREFIXES,
  SESSION_DOCUMENT_STORAGE_CATEGORIES,
  buildEntityStoragePrefix,
  buildSessionDocumentStoragePrefix,
  resolveEntityUploadDir,
} from './storage-constants';
export type { StorageSoclePrefix, SessionDocumentStorageCategory } from './storage-constants';
export {
  ensureEntityStoragePrefix,
  ensureStorageSocle,
  getStorageSocleStatus,
} from './storage-socle';
export type {
  EnsureStorageSocleResult,
  StorageSoclePrefixStatus,
} from './storage-socle';
