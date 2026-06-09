import { PutObjectCommand } from '@aws-sdk/client-s3';
import { deleteFileByKey, resolveKeyFromUrl } from '@repo/storage';
import { uid } from './helpers';
import { getS3ClientInstance } from './s3-client';

// Get storage configuration
function getConfig() {
  return {
    bucket: process.env.STORAGE_BUCKET || 'shoplit',
    cdnUrl: process.env.STORAGE_CDN_URL?.replace(/\/$/, ''),
    endpoint: process.env.STORAGE_ENDPOINT?.replace(/\/$/, ''),
  };
}

function getFileUrl(key: string): string {
  const config = getConfig();
  const base =
    config.cdnUrl ||
    (process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL.replace(/\/$/, '')}/api/public/storage`
      : config.endpoint);

  // Path-style S3 (MinIO) : endpoint/bucket/key — proxy CRM : /api/public/storage/key
  if (config.cdnUrl?.includes('/api/public/storage')) {
    return `${config.cdnUrl.replace(/\/$/, '')}/${key}`;
  }
  if (config.endpoint && !config.cdnUrl) {
    return `${config.endpoint}/${config.bucket}/${key}`;
  }
  if (!base) {
    return `/${key}`;
  }
  return `${base.replace(/\/$/, '')}/${key}`;
}

export async function uploadToS3(
  file: File,
  directory: string,
): Promise<string> {
  try {
    const config = getConfig();

    // Validate input
    if (!file) throw new Error('No file provided');
    if (!directory) throw new Error('No directory specified');

    // Generate unique filename
    const filename = `${uid()}_${file.name}`;
    const key = `${directory}/${filename}`;

    // Log upload attempt
    console.log('Uploading file:', {
      filename: file.name,
      size: file.size,
      type: file.type,
      directory,
      bucket: config.bucket,
    });

    // Upload to storage
    const s3Client = getS3ClientInstance();
    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
        CacheControl: 'public, max-age=31536000',
        ACL: 'public-read',
      }),
    );

    // Generate URL
    const fileUrl = getFileUrl(key);
    console.log('File uploaded successfully:', { key, fileUrl });
    return fileUrl;
  } catch (error) {
    console.error('Upload failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      file: file?.name,
      directory,
    });
    throw new Error('Failed to upload file');
  }
}

export async function deleteFromS3(fileUrl: string): Promise<void> {
  if (!fileUrl) throw new Error('No file URL provided');

  const key = resolveKeyFromUrl(fileUrl);
  if (!key) {
    console.warn('deleteFromS3: impossible de résoudre la clé', { fileUrl });
    return;
  }

  try {
    await deleteFileByKey(key);
    console.log('File deleted successfully:', { key });
  } catch (error) {
    console.error('Delete failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      fileUrl,
      key,
    });
    throw new Error('Failed to delete file');
  }
}
