import { uploadToS3 } from '@/lib/s3-upload';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_BYTES = 1024 * 1024;

/** Enregistre une image profil dirigeant/admin dans MinIO (`company/avatars/`). */
export async function saveCompanyProfileImageLocal(
  file: File,
  role: 'director' | 'admin',
): Promise<string> {
  if (!file.size || file.size > MAX_BYTES) {
    throw new Error('Image invalide ou trop volumineuse (max 1 Mo).');
  }
  if (!ALLOWED.has(file.type)) {
    throw new Error('Format non autorisé (JPG, PNG, GIF ou WebP).');
  }

  const ext =
    file.type === 'image/jpeg'
      ? 'jpg'
      : file.type === 'image/png'
        ? 'png'
        : file.type === 'image/gif'
          ? 'gif'
          : file.type === 'image/webp'
            ? 'webp'
            : 'bin';

  const prefixed = new File(
    [await file.arrayBuffer()],
    `${role}-${Date.now()}.${ext}`,
    { type: file.type },
  );

  return uploadToS3(prefixed, 'company/avatars');
}
