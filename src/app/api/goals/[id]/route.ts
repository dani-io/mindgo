import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { grantXP } from '@/lib/services/gamification.service'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

async function getOwned(id: string, userId: string) {
  const goal = await prisma.goal.findUnique({ where: { id } })
  if (!goal) return { goal: null, err: 'هدف یافت نشد', status: 404 }
  if (goal.userId !== userId) return { goal: null, err: 'دسترسی غیرمجاز', status: 403 }
  return { goal, err: null, status: 200 }
}

// GET /api/goals/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })
  const { goal, err, status } = await getOwned(params.id, payload.sub)
  if (err) return Response.json({ success: false, error: { message: err } }, { status })
  return Response.json({ success: true, data: goal })
}

// PATCH /api/goals/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })
  const { goal, err, status } = await getOwned(params.id, payload.sub)
  if (err) return Response.json({ success: false, error: { message: err } }, { status })
  if (!goal) return Response.json({ success: false, error: { message: 'خطا' } }, { status: 500 })

  const body = await req.json().catch(() => ({})) as {
    progressPct?: number
    status?:      string
    title?:       string
    description?: string
    targetDate?:  string
    isPrivate?:   boolean
  }

  const data: Record<string, unknown> = {}
  if (body.title !== undefined)       data.title       = body.title.trim()
  if (body.description !== undefined) data.description = body.description.trim()
  if (body.isPrivate !== undefined)   data.isPrivate   = body.isPrivate
  if (body.targetDate !== undefined)  data.targetDate  = new Date(body.targetDate)
  if (body.progressPct !== undefined) data.progressPct = Math.max(0, Math.min(100, body.progressPct))

  const VALID_STATUSES = ['active', 'completed', 'paused']
  if (body.status && VALID_STATUSES.includes(body.status)) {
    data.status = body.status
    if (body.status === 'completed' && goal.status !== 'completed') {
      data.progressPct = 100
      await grantXP(payload.sub, 'goal_completed').catch(() => {})
    }
  }

  const updated = await prisma.goal.update({
    where: { id: params.id },
    data:  data as Parameters<typeof prisma.goal.update>[0]['data'],
    select: { id: true, title: true, description: true, progressPct: true, isPrivate: true, targetDate: true, status: true, createdAt: true },
  })

  return Response.json({ success: true, data: updated })
}

// DELETE /api/goals/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })
  const { err, status } = await getOwned(params.id, payload.sub)
  if (err) return Response.json({ success: false, error: { message: err } }, { status })
  await prisma.goal.delete({ where: { id: params.id } })
  return Response.json({ success: true })
}
