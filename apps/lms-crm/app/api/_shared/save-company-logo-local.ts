import { uploadToS3 } from '@/lib/s3-upload';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_BYTES = 1024 * 1024;

/** Enregistre le logo entreprise dans MinIO/S3 (`company/`) et renvoie l’URL publique proxy. */
export async function saveCompanyLogoLocal(file: File): Promise<string> {
  if (!file.size || file.size > MAX_BYTES) {
    throw new Error('Fichier logo invalide ou trop volumineux (max 1 Mo).');
  }
  if (!ALLOWED.has(file.type)) {
    throw new Error('Format non autorisé (JPG, PNG, GIF ou WebP).');
  }

  return uploadToS3(file, 'company');
}
