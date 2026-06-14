import {
  deleteFileByKey,
  resolveKeyFromUrl,
  uploadFileToDirectory,
} from '@repo/storage';

export async function uploadToS3(file: File, directory: string): Promise<string> {
  const uploaded = await uploadFileToDirectory(file, directory, { visibility: 'public' });
  return uploaded.url;
}

export async function deleteFromS3(fileUrl: string): Promise<void> {
  if (!fileUrl) throw new Error('No file URL provided');

  const key = resolveKeyFromUrl(fileUrl);
  if (!key) {
    console.warn('deleteFromS3: impossible de résoudre la clé', { fileUrl });
    return;
  }

  await deleteFileByKey(key);
}
