import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_BYTES = 1024 * 1024;

/** Enregistre le logo entreprise sous `public/media/company/` et renvoie l’URL publique `/media/company/...`. */
export async function saveCompanyLogoLocal(file: File): Promise<string> {
  if (!file.size || file.size > MAX_BYTES) {
    throw new Error('Fichier logo invalide ou trop volumineux (max 1 Mo).');
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

  const name = `logo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const relativeDir = path.join('public', 'media', 'company');
  const dir = path.join(process.cwd(), relativeDir);
  await mkdir(dir, { recursive: true });

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buf);

  return `/media/company/${name}`;
}
