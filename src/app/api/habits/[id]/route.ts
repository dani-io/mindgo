import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// PATCH /api/habits/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const habit = await prisma.habit.findUnique({ where: { id: params.id } })
  if (!habit) return Response.json({ success: false, error: { message: 'عادت یافت نشد' } }, { status: 404 })
  if (habit.userId !== payload.sub) return Response.json({ success: false, error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })

  const body = await req.json().catch(() => ({})) as {
    title?:       string
    description?: string
    frequency?:   string
    isActive?:    boolean
  }

  const data: Record<string, unknown> = {}
  if (body.title !== undefined)       data.title       = body.title.trim()
  if (body.description !== undefined) data.description = body.description.trim()
  if (body.isActive !== undefined)    data.isActive    = body.isActive
  if (body.frequency !== undefined)   data.frequency   = body.frequency === 'weekly' ? 'weekly' : 'daily'

  const updated = await prisma.habit.update({ where: { id: params.id }, data })
  return Response.json({ success: true, data: updated })
}

// DELETE /api/habits/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const habit = await prisma.habit.findUnique({ where: { id: params.id } })
  if (!habit) return Response.json({ success: false, error: { message: 'عادت یافت نشد' } }, { status: 404 })
  if (habit.userId !== payload.sub) return Response.json({ success: false, error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })

  await prisma.habit.update({ where: { id: params.id }, data: { isActive: false } })
  return Response.json({ success: true })
}
