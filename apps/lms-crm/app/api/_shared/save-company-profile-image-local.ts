import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_BYTES = 1024 * 1024;

/** Enregistre une image profil sous `public/media/company/avatars/` (dirigeant ou admin). */
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

  const name = `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const relativeDir = path.join('public', 'media', 'company', 'avatars');
  const dir = path.join(process.cwd(), relativeDir);
  await mkdir(dir, { recursive: true });

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buf);

  return `/media/company/avatars/${name}`;
}
