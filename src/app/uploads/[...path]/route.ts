import { NextRequest } from 'next/server'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { Readable } from 'stream'
import path from 'path'
import { resolveLocalUploadPath, getStorageProvider } from '@/lib/services/upload.service'

// Files land on disk after the build, so Next.js will not serve them from
// public/ — its static manifest is fixed at build time. This handler serves
// them instead, keeping the public URL shape /uploads/<key>.
export const dynamic = 'force-dynamic'

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav',
  '.ogg': 'audio/ogg', '.oga': 'audio/ogg', '.aac': 'audio/aac',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  if (getStorageProvider() !== 'local') {
    return new Response('Not found', { status: 404 })
  }

  const key = params.path.join('/')

  let filePath: string
  try {
    filePath = resolveLocalUploadPath(key)
  } catch {
    // Key tried to escape the uploads root.
    return new Response('Not found', { status: 404 })
  }

  let info
  try {
    info = await stat(filePath)
    if (!info.isFile()) return new Response('Not found', { status: 404 })
  } catch {
    return new Response('Not found', { status: 404 })
  }

  const contentType =
    CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream'

  // Keys embed a timestamp, so a given URL always refers to the same bytes.
  const headers: Record<string, string> = {
    'Content-Type':  contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
    // Never let a stored file execute or render as HTML in the app's origin.
    'Content-Disposition':     'inline',
    'X-Content-Type-Options':  'nosniff',
  }

  // Range support so <audio>/<video> can seek in podcasts and meditations.
  const range = req.headers.get('range')
  const match = range?.match(/^bytes=(\d*)-(\d*)$/)
  if (match && (match[1] || match[2])) {
    const start = match[1] ? parseInt(match[1], 10) : info.size - parseInt(match[2], 10)
    const end   = match[1] && match[2] ? parseInt(match[2], 10) : info.size - 1

    if (isNaN(start) || isNaN(end) || start < 0 || start > end || end >= info.size) {
      return new Response('Range Not Satisfiable', {
        status: 416,
        headers: { 'Content-Range': `bytes */${info.size}` },
      })
    }

    const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream
    return new Response(stream, {
      status: 206,
      headers: {
        ...headers,
        'Content-Range':  `bytes ${start}-${end}/${info.size}`,
        'Content-Length': String(end - start + 1),
      },
    })
  }

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream
  return new Response(stream, {
    status: 200,
    headers: { ...headers, 'Content-Length': String(info.size) },
  })
}
