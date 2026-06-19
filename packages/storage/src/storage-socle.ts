import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  STORAGE_SOCLE_MARKER,
  STORAGE_SOCLE_PREFIXES,
} from './storage-constants';
import {
  getS3ClientInstance,
  getStorageMode,
  isRemoteStorageConfigured,
  resolveLocalUploadRoot,
} from './index';

export {
  ENTITY_UPLOAD_ROUTES,
  STORAGE_SOCLE_MARKER,
  STORAGE_SOCLE_PREFIXES,
  buildEntityStoragePrefix,
  resolveEntityUploadDir,
} from './storage-constants';
export type { StorageSoclePrefix } from './storage-constants';

export type StorageSoclePrefixStatus = {
  prefix: string;
  ready: boolean;
  markerKey: string;
};

export type EnsureStorageSocleResult = {
  mode: 'local' | 'remote';
  created: string[];
  existing: string[];
};

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function markerKeyForPrefix(prefix: string): string {
  const safe = prefix.replace(/^\/+|\/+$/g, '');
  return `${safe}/${STORAGE_SOCLE_MARKER}`;
}

async function prefixExistsRemote(bucket: string, key: string): Promise<boolean> {
  const client = getS3ClientInstance();
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function putPrefixMarkerRemote(bucket: string, key: string): Promise<void> {
  const client = getS3ClientInstance();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from('socle'),
      ContentType: 'text/plain',
      CacheControl: 'private, max-age=0',
    }),
  );
}

async function putPrefixMarkerLocal(prefix: string): Promise<void> {
  const root = resolveLocalUploadRoot();
  const dir = path.join(root, prefix);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, STORAGE_SOCLE_MARKER), 'socle', 'utf8');
}

async function prefixExistsLocal(prefix: string): Promise<boolean> {
  const root = resolveLocalUploadRoot();
  try {
    const { access } = await import('node:fs/promises');
    await access(path.join(root, prefix, STORAGE_SOCLE_MARKER));
    return true;
  } catch {
    return false;
  }
}

/** Crée le marqueur `.keep` pour un préfixe entité (appel à la création user / équipe / session…). */
export async function ensureEntityStoragePrefix(prefix: string): Promise<'created' | 'existing'> {
  const safe = prefix.replace(/^\/+|\/+$/g, '');
  if (!safe) return 'existing';

  if (getStorageMode() === 'local') {
    if (await prefixExistsLocal(safe)) return 'existing';
    await putPrefixMarkerLocal(safe);
    return 'created';
  }

  if (!isRemoteStorageConfigured()) {
    throw new Error('Stockage distant non configuré.');
  }

  const bucket = getEnv('STORAGE_BUCKET');
  const key = markerKeyForPrefix(safe);
  if (await prefixExistsRemote(bucket, key)) return 'existing';
  await putPrefixMarkerRemote(bucket, key);
  return 'created';
}

/** État du socle (préfixes principaux). */
export async function getStorageSocleStatus(): Promise<{
  mode: 'local' | 'remote';
  prefixes: StorageSoclePrefixStatus[];
  readyCount: number;
  totalCount: number;
}> {
  const mode = getStorageMode();
  const prefixes: StorageSoclePrefixStatus[] = [];

  for (const prefix of STORAGE_SOCLE_PREFIXES) {
    const markerKey = markerKeyForPrefix(prefix);
    let ready = false;
    if (mode === 'local') {
      ready = await prefixExistsLocal(prefix);
    } else if (isRemoteStorageConfigured()) {
      const bucket = getEnv('STORAGE_BUCKET');
      ready = await prefixExistsRemote(bucket, markerKey);
    }
    prefixes.push({ prefix, ready, markerKey });
  }

  const readyCount = prefixes.filter((p) => p.ready).length;
  return {
    mode,
    prefixes,
    readyCount,
    totalCount: prefixes.length,
  };
}

/** Initialise tous les préfixes socle (idempotent). MinIO ou S3 externe — même logique. */
export async function ensureStorageSocle(): Promise<EnsureStorageSocleResult> {
  const mode = getStorageMode();
  const created: string[] = [];
  const existing: string[] = [];

  for (const prefix of STORAGE_SOCLE_PREFIXES) {
    if (mode === 'local') {
      if (await prefixExistsLocal(prefix)) {
        existing.push(prefix);
      } else {
        await putPrefixMarkerLocal(prefix);
        created.push(prefix);
      }
      continue;
    }

    if (!isRemoteStorageConfigured()) {
      throw new Error(
        'Stockage distant non configuré (STORAGE_*). Impossible d’initialiser le socle en production.',
      );
    }

    const bucket = getEnv('STORAGE_BUCKET');
    const key = markerKeyForPrefix(prefix);
    if (await prefixExistsRemote(bucket, key)) {
      existing.push(prefix);
    } else {
      await putPrefixMarkerRemote(bucket, key);
      created.push(prefix);
    }
  }

  return { mode, created, existing };
}
