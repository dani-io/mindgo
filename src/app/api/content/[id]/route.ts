import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/content/:id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const item = await prisma.content.findUnique({
    where: { id: params.id },
    include: {
      bookmarks: { where: { userId: payload.sub }, select: { id: true } },
    },
  })

  if (!item || (!item.isPublished && payload.role !== 'admin')) {
    return Response.json({ success: false, error: { message: 'محتوا یافت نشد' } }, { status: 404 })
  }

  await prisma.content.update({ where: { id: params.id }, data: { viewCount: { increment: 1 } } })

  const { bookmarks, ...rest } = item
  return Response.json({ success: true, data: { ...rest, isBookmarked: bookmarks.length > 0 } })
}

// PATCH /api/content/:id  (admin only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload || payload.role !== 'admin') {
    return Response.json({ success: false, error: { message: 'دسترسی ندارید' } }, { status: 403 })
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>

  const allowed = ['title', 'description', 'type', 'durationMinutes', 'category', 'thumbnailUrl', 'mediaUrl', 'author', 'isPublished']
  const data: Record<string, unknown> = {}
  for (const k of allowed) { if (k in body) data[k] = body[k] }

  const updated = await prisma.content.update({ where: { id: params.id }, data })
  return Response.json({ success: true, data: updated })
}

// DELETE /api/content/:id  (admin only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload || payload.role !== 'admin') {
    return Response.json({ success: false, error: { message: 'دسترسی ندارید' } }, { status: 403 })
  }

  await prisma.content.delete({ where: { id: params.id } })
  return Response.json({ success: true })
}
