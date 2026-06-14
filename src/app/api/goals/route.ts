import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/goals
export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') as 'active' | 'completed' | 'paused' | null

  const goals = await prisma.goal.findMany({
    where:   { userId: payload.sub, ...(status ? { status } : {}) },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    select:  { id: true, title: true, description: true, progressPct: true, isPrivate: true, targetDate: true, status: true, createdAt: true },
  })

  return Response.json({ success: true, data: goals })
}

// POST /api/goals
export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    title?:       string
    description?: string
    targetDate?:  string
    isPrivate?:   boolean
  }

  if (!body.title?.trim()) {
    return Response.json({ success: false, error: { message: 'عنوان هدف الزامی است' } }, { status: 400 })
  }

  const goal = await prisma.goal.create({
    data: {
      userId:      payload.sub,
      title:       body.title.trim(),
      description: body.description?.trim(),
      isPrivate:   body.isPrivate ?? true,
      targetDate:  body.targetDate ? new Date(body.targetDate) : undefined,
    },
    select: { id: true, title: true, description: true, progressPct: true, isPrivate: true, targetDate: true, status: true, createdAt: true },
  })

  return Response.json({ success: true, data: goal }, { status: 201 })
}
