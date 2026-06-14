import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  endpoint:    process.env.S3_ENDPOINT,
  region:      process.env.S3_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId:     process.env.S3_ACCESS_KEY ?? '',
    secretAccessKey: process.env.S3_SECRET_KEY ?? '',
  },
  forcePathStyle: true,
})

const BUCKET     = process.env.S3_BUCKET ?? 'mindgo-uploads'
const PUBLIC_BASE = (
  process.env.NEXT_PUBLIC_S3_PUBLIC_URL ??
  `${(process.env.S3_ENDPOINT ?? '').replace(/\/$/, '')}/${process.env.S3_BUCKET ?? 'mindgo-uploads'}`
).replace(/\/$/, '')

export function getPublicUrl(key: string): string {
  return `${PUBLIC_BASE}/${key}`
}

export function buildKey(folder: string, userId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${folder}/${userId}/${Date.now()}-${safe}`
}

export async function uploadFile(
  file:        Buffer,
  key:         string,
  contentType: string,
): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        file,
    ContentType: contentType,
  }))
  return getPublicUrl(key)
}

export async function generatePresignedUploadUrl(
  key:         string,
  contentType: string,
  expiresIn = 3600,
): Promise<{ uploadUrl: string; fileUrl: string }> {
  const command  = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType })
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn })
  return { uploadUrl, fileUrl: getPublicUrl(key) }
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}
