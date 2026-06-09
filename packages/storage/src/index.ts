import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type StorageVisibility = 'private' | 'internal' | 'public';

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

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function randomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getClient() {
  const region = getEnv('STORAGE_REGION', 'ams3');
  const endpoint = getEnv('STORAGE_ENDPOINT');
  const accessKeyId = getEnv('STORAGE_ACCESS_KEY_ID');
  const secretAccessKey = getEnv('STORAGE_SECRET_ACCESS_KEY');

  return new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

function getPublicBaseUrl() {
  const cdn = process.env.STORAGE_CDN_URL?.replace(/\/$/, '');
  if (cdn) return cdn;
  return getEnv('STORAGE_ENDPOINT').replace(/\/$/, '');
}

function hasRemoteStorageConfig() {
  return Boolean(
    process.env.STORAGE_BUCKET &&
      process.env.STORAGE_ENDPOINT &&
      process.env.STORAGE_ACCESS_KEY_ID &&
      process.env.STORAGE_SECRET_ACCESS_KEY,
  );
}

function ensureSafeRelativePath(key: string) {
  return key.replace(/^\/+/, '').replace(/\.\./g, '');
}

async function uploadFileLocal(input: UploadInput): Promise<UploadResult> {
  const ext = input.file.name.includes('.')
    ? `.${input.file.name.split('.').pop()}`.toLowerCase()
    : '';
  const key = `${buildStoragePath(input)}/${randomId()}${ext}`;
  const safeKey = ensureSafeRelativePath(key);
  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
  const targetPath = path.join(uploadsRoot, safeKey);

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, Buffer.from(await input.file.arrayBuffer()));

  return {
    key: `uploads/${safeKey}`,
    url: `/uploads/${safeKey}`,
    mimeType: input.file.type || 'application/octet-stream',
    size: input.file.size,
    originalName: input.file.name,
    visibility: input.visibility || 'private',
  };
}

function buildStoragePath(input: UploadInput): string {
  const moduleName = sanitizeSegment(input.module || 'misc');
  const entityType = sanitizeSegment(input.entityType || 'file');
  const entityId = sanitizeSegment(input.entityId || 'unassigned');
  const category = sanitizeSegment(input.category || 'general');

  return `${moduleName}/${entityType}/${entityId}/${category}`;
}

export async function uploadFile(input: UploadInput): Promise<UploadResult> {
  if (!input.file) throw new Error('No file provided');
  if (!hasRemoteStorageConfig()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Missing remote storage configuration (STORAGE_* env vars) in production',
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
      ACL: visibility === 'public' ? 'public-read' : undefined,
    }),
  );

  const publicBase = getPublicBaseUrl();
  const url = publicBase.includes('/api/public/storage')
    ? `${publicBase.replace(/\/$/, '')}/${key}`
    : `${publicBase.replace(/\/$/, '')}/${bucket}/${key}`;

  return {
    key,
    url,
    mimeType: input.file.type || 'application/octet-stream',
    size: input.file.size,
    originalName: input.file.name,
    visibility,
  };
}

export async function deleteFileByKey(key: string): Promise<void> {
  if (!key) return;
  if (key.startsWith('uploads/')) {
    const safeKey = ensureSafeRelativePath(key.replace(/^uploads\//, ''));
    const localPath = path.join(process.cwd(), 'public', 'uploads', safeKey);
    await unlink(localPath).catch(() => undefined);
    return;
  }
  const bucket = getEnv('STORAGE_BUCKET');
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
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
  if (cdn && trimmed.startsWith(`${cdn}/`)) {
    return trimmed.slice(cdn.length + 1);
  }

  const nextAuth = process.env.NEXTAUTH_URL?.replace(/\/$/, '');
  if (nextAuth && trimmed.startsWith(`${nextAuth}/api/public/storage/`)) {
    return trimmed.replace(`${nextAuth}/api/public/storage/`, '');
  }

  const endpoint = process.env.STORAGE_ENDPOINT?.replace(/\/$/, '');
  const bucket = process.env.STORAGE_BUCKET;
  if (endpoint && trimmed.startsWith(`${endpoint}/`)) {
    let rest = trimmed.slice(endpoint.length + 1);
    if (bucket && rest.startsWith(`${bucket}/`)) {
      rest = rest.slice(bucket.length + 1);
    }
    return rest;
  }

  return null;
}
