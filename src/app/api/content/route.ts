import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/content
export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type      = searchParams.get('type') as 'podcast' | 'video' | 'book_summary' | null
  const bookmarked = searchParams.get('bookmarked') === 'true'
  const limit     = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

  if (bookmarked) {
    const bms = await prisma.contentBookmark.findMany({
      where:   { userId: payload.sub },
      include: { content: true },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    })
    const items = bms.map((b) => ({
      ...b.content,
      isBookmarked: true,
    }))
    return Response.json({ success: true, data: items })
  }

  const items = await prisma.content.findMany({
    where: {
      isPublished: true,
      ...(type ? { type } : {}),
    },
    orderBy: [{ createdAt: 'desc' }],
    take:    limit,
    include: {
      bookmarks: {
        where: { userId: payload.sub },
        select: { id: true },
      },
    },
  })

  const data = items.map(({ bookmarks, ...c }) => ({
    ...c,
    isBookmarked: bookmarks.length > 0,
  }))

  return Response.json({ success: true, data })
}

// POST /api/content  (admin only)
export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload || payload.role !== 'admin') {
    return Response.json({ success: false, error: { message: 'دسترسی ندارید' } }, { status: 403 })
  }

  const body = await req.json().catch(() => ({})) as {
    title?:           string
    description?:     string
    type?:            string
    durationMinutes?: number
    category?:        string
    thumbnailUrl?:    string
    mediaUrl?:        string
    author?:          string
    isPublished?:     boolean
  }

  const VALID_TYPES = ['podcast', 'video', 'book_summary']
  if (!body.title?.trim()) return Response.json({ success: false, error: { message: 'عنوان الزامی است' } }, { status: 400 })
  if (!body.type || !VALID_TYPES.includes(body.type)) return Response.json({ success: false, error: { message: 'نوع نامعتبر است' } }, { status: 400 })
  if (!body.category?.trim()) return Response.json({ success: false, error: { message: 'دسته‌بندی الزامی است' } }, { status: 400 })

  const item = await prisma.content.create({
    data: {
      title:           body.title.trim(),
      description:     body.description?.trim(),
      type:            body.type as 'podcast' | 'video' | 'book_summary',
      durationMinutes: body.durationMinutes ?? 5,
      category:        body.category.trim(),
      thumbnailUrl:    body.thumbnailUrl?.trim(),
      mediaUrl:        body.mediaUrl?.trim(),
      author:          body.author?.trim(),
      isPublished:     body.isPublished ?? false,
    },
  })

  return Response.json({ success: true, data: item }, { status: 201 })
}
