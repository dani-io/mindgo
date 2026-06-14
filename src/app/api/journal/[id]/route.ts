import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

async function getOwned(id: string, userId: string) {
  const entry = await prisma.journalEntry.findUnique({ where: { id } })
  if (!entry) return { entry: null, error: 'یافت نشد', status: 404 }
  if (entry.userId !== userId) return { entry: null, error: 'دسترسی غیرمجاز', status: 403 }
  return { entry, error: null, status: 200 }
}

// GET /api/journal/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })
  const { entry, error, status } = await getOwned(params.id, payload.sub)
  if (error) return Response.json({ success: false, error: { message: error } }, { status })
  return Response.json({ success: true, data: entry })
}

// PUT /api/journal/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })
  const { entry, error, status } = await getOwned(params.id, payload.sub)
  if (error) return Response.json({ success: false, error: { message: error } }, { status })
  if (!entry) return Response.json({ success: false, error: { message: 'خطا' } }, { status: 500 })

  const body = await req.json().catch(() => ({})) as { content?: string }
  if (!body.content?.trim()) {
    return Response.json({ success: false, error: { message: 'متن یادداشت الزامی است' } }, { status: 400 })
  }

  const updated = await prisma.journalEntry.update({
    where: { id: params.id },
    data:  { content: body.content.trim() },
    select: { id: true, type: true, content: true, loggedDate: true, createdAt: true },
  })

  return Response.json({ success: true, data: updated })
}

// DELETE /api/journal/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })
  const { error, status } = await getOwned(params.id, payload.sub)
  if (error) return Response.json({ success: false, error: { message: error } }, { status })
  await prisma.journalEntry.delete({ where: { id: params.id } })
  return Response.json({ success: true })
}
