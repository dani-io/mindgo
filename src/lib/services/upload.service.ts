import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { mkdir, writeFile, unlink } from 'fs/promises'
import path from 'path'

// ═══════════════════════════════════════════════════════════════
// Provider selection
// ═══════════════════════════════════════════════════════════════

export type StorageProviderName = 'local' | 's3'

// Read per-call rather than at module scope so the value always reflects the
// container's current env — flipping STORAGE_PROVIDER needs a restart, not a rebuild.
export function getStorageProvider(): StorageProviderName {
  return process.env.STORAGE_PROVIDER === 's3' ? 's3' : 'local'
}

/** How the browser must send the file for a given provider. */
export type UploadMethod = 'PUT' | 'POST'

export interface PresignedUpload {
  /** Where the browser sends the bytes. */
  uploadUrl: string
  /** HTTP verb to use: PUT for S3 presigned, POST (multipart) for local. */
  method: UploadMethod
  /**
   * Public URL the file will be readable at. For local uploads this is a
   * prediction — the authoritative URL comes back from POST /api/upload/local,
   * because that route stamps its own timestamp into the key.
   */
  fileUrl: string
}

// ═══════════════════════════════════════════════════════════════
// Per-folder upload rules (shared by every upload entrypoint)
// ═══════════════════════════════════════════════════════════════

const MB = 1024 * 1024

const IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const AUDIO = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/aac',
               'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm']
const VIDEO = ['video/mp4', 'video/webm', 'video/quicktime']
const PDF   = ['application/pdf']

export const FOLDER_RULES: Record<string, { maxSize: number; mimeTypes: string[] }> = {
  avatars:            { maxSize: 2  * MB, mimeTypes: IMAGE },
  'voice-intros':     { maxSize: 10 * MB, mimeTypes: AUDIO },
  'video-intros':     { maxSize: 50 * MB, mimeTypes: VIDEO },
  certificates:       { maxSize: 5  * MB, mimeTypes: [...IMAGE, ...PDF] },
  podcasts:           { maxSize: 50 * MB, mimeTypes: AUDIO },
  meditations:        { maxSize: 50 * MB, mimeTypes: AUDIO },
  'chat-attachments': { maxSize: 10 * MB, mimeTypes: [...IMAGE, ...PDF, ...AUDIO] },
  exercises:          { maxSize: 10 * MB, mimeTypes: [...IMAGE, ...PDF, ...AUDIO] },
  receipts:           { maxSize: 5  * MB, mimeTypes: [...IMAGE, ...PDF] },
  feedback:           { maxSize: 5  * MB, mimeTypes: IMAGE },
}

/** Returns a Persian error message, or null when the file is acceptable. */
export function validateUpload(
  folder: string,
  contentType: string | null,
  fileSize: number | null,
): string | null {
  const rules = FOLDER_RULES[folder]
  if (!rules) return 'پوشه نامعتبر است'

  if (fileSize !== null && fileSize > rules.maxSize) {
    return `حجم فایل نباید از ${Math.round(rules.maxSize / MB)} مگابایت بیشتر باشد`
  }

  // Browsers append codec params to some audio/video types (e.g. "audio/webm;codecs=opus").
  const base = contentType?.split(';')[0].trim().toLowerCase() ?? ''
  if (base && !rules.mimeTypes.includes(base)) {
    return 'نوع فایل مجاز نیست'
  }

  return null
}

// ═══════════════════════════════════════════════════════════════
// Keys
// ═══════════════════════════════════════════════════════════════

export function buildKey(folder: string, userId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${folder}/${userId}/${Date.now()}-${safe}`
}

// ═══════════════════════════════════════════════════════════════
// Local filesystem provider
// ═══════════════════════════════════════════════════════════════

/** Bind-mounted in production: ./uploads -> /app/public/uploads */
const LOCAL_ROOT = process.env.LOCAL_UPLOAD_DIR ?? path.join(process.cwd(), 'public', 'uploads')

const LOCAL_URL_PREFIX = '/uploads'

/**
 * Resolve a storage key to an absolute path, refusing anything that escapes
 * LOCAL_ROOT. Keys reach us from request bodies, so `../..` must not traverse.
 */
function resolveLocalPath(key: string): string {
  const full = path.resolve(LOCAL_ROOT, key)
  const root = path.resolve(LOCAL_ROOT)
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error('Invalid storage key')
  }
  return full
}

/**
 * Absolute path for a stored key, guarded against traversal.
 * Used by the /uploads/* route handler that serves these files back.
 */
export function resolveLocalUploadPath(key: string): string {
  return resolveLocalPath(key)
}

const localProvider = {
  getPublicUrl(key: string): string {
    return `${LOCAL_URL_PREFIX}/${key}`
  },

  async uploadFile(file: Buffer, key: string, _contentType: string): Promise<string> {
    const full = resolveLocalPath(key)
    await mkdir(path.dirname(full), { recursive: true })
    await writeFile(full, file)
    return localProvider.getPublicUrl(key)
  },

  async generatePresignedUploadUrl(key: string): Promise<PresignedUpload> {
    // There is no signed-URL equivalent on a local disk: the browser posts the
    // file through the app, which re-authenticates and re-validates it.
    return {
      uploadUrl: '/api/upload/local',
      method:    'POST',
      fileUrl:   localProvider.getPublicUrl(key),
    }
  },

  async deleteFile(key: string): Promise<void> {
    const full = resolveLocalPath(key)
    // Already-gone is success — callers only care that the file is absent.
    await unlink(full).catch((err: NodeJS.ErrnoException) => {
      if (err.code !== 'ENOENT') throw err
    })
  },
}

// ═══════════════════════════════════════════════════════════════
// S3 provider (retained — enable with STORAGE_PROVIDER=s3)
// ═══════════════════════════════════════════════════════════════

let s3Client: S3Client | null = null

// Constructed on first use so that a local-storage deployment can boot with no
// S3 env vars set at all.
function getS3(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region:   process.env.S3_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId:     process.env.S3_ACCESS_KEY ?? '',
        secretAccessKey: process.env.S3_SECRET_KEY ?? '',
      },
      forcePathStyle: true,
    })
  }
  return s3Client
}

function s3Bucket(): string {
  return process.env.S3_BUCKET ?? 'mindgo-uploads'
}

const s3Provider = {
  getPublicUrl(key: string): string {
    const base = (
      process.env.NEXT_PUBLIC_S3_PUBLIC_URL ??
      `${(process.env.S3_ENDPOINT ?? '').replace(/\/$/, '')}/${s3Bucket()}`
    ).replace(/\/$/, '')
    return `${base}/${key}`
  },

  async uploadFile(file: Buffer, key: string, contentType: string): Promise<string> {
    await getS3().send(new PutObjectCommand({
      Bucket:      s3Bucket(),
      Key:         key,
      Body:        file,
      ContentType: contentType,
    }))
    return s3Provider.getPublicUrl(key)
  },

  async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<PresignedUpload> {
    const command   = new PutObjectCommand({ Bucket: s3Bucket(), Key: key, ContentType: contentType })
    const uploadUrl = await getSignedUrl(getS3(), command, { expiresIn })
    return { uploadUrl, method: 'PUT', fileUrl: s3Provider.getPublicUrl(key) }
  },

  async deleteFile(key: string): Promise<void> {
    await getS3().send(new DeleteObjectCommand({ Bucket: s3Bucket(), Key: key }))
  },
}

// ═══════════════════════════════════════════════════════════════
// Public API — dispatches to the active provider
// ═══════════════════════════════════════════════════════════════

export function getPublicUrl(key: string): string {
  return getStorageProvider() === 's3'
    ? s3Provider.getPublicUrl(key)
    : localProvider.getPublicUrl(key)
}

export async function uploadFile(
  file:        Buffer,
  key:         string,
  contentType: string,
): Promise<string> {
  return getStorageProvider() === 's3'
    ? s3Provider.uploadFile(file, key, contentType)
    : localProvider.uploadFile(file, key, contentType)
}

export async function generatePresignedUploadUrl(
  key:         string,
  contentType: string,
  expiresIn = 3600,
): Promise<PresignedUpload> {
  return getStorageProvider() === 's3'
    ? s3Provider.generatePresignedUploadUrl(key, contentType, expiresIn)
    : localProvider.generatePresignedUploadUrl(key)
}

export async function deleteFile(key: string): Promise<void> {
  return getStorageProvider() === 's3'
    ? s3Provider.deleteFile(key)
    : localProvider.deleteFile(key)
}
