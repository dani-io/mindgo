import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// POST /api/content/:id/bookmark  — toggle
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const existing = await prisma.contentBookmark.findUnique({
    where: { userId_contentId: { userId: payload.sub, contentId: params.id } },
  })

  if (existing) {
    await prisma.contentBookmark.delete({ where: { id: existing.id } })
    return Response.json({ success: true, data: { bookmarked: false } })
  }

  await prisma.contentBookmark.create({ data: { userId: payload.sub, contentId: params.id } })
  return Response.json({ success: true, data: { bookmarked: true } })
}
