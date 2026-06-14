import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { grantXP } from '@/lib/services/gamification.service'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/journal
export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type  = searchParams.get('type') as 'gratitude' | 'reflection' | 'freewrite' | null
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 200)

  const entries = await prisma.journalEntry.findMany({
    where: {
      userId: payload.sub,
      ...(type ? { type } : {}),
    },
    orderBy: { loggedDate: 'desc' },
    take:    limit,
    select:  { id: true, type: true, content: true, loggedDate: true, createdAt: true },
  })

  return Response.json({ success: true, data: entries })
}

// POST /api/journal
export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    type?:       string
    content?:    string
    loggedDate?: string
  }

  const VALID_TYPES = ['gratitude', 'reflection', 'freewrite']
  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return Response.json({ success: false, error: { message: 'نوع یادداشت نامعتبر است' } }, { status: 400 })
  }
  if (!body.content?.trim()) {
    return Response.json({ success: false, error: { message: 'متن یادداشت الزامی است' } }, { status: 400 })
  }

  const loggedDate = body.loggedDate ? new Date(body.loggedDate) : new Date()
  loggedDate.setHours(0, 0, 0, 0)

  const entry = await prisma.journalEntry.create({
    data: {
      userId:     payload.sub,
      type:       body.type as 'gratitude' | 'reflection' | 'freewrite',
      content:    body.content.trim(),
      loggedDate,
    },
    select: { id: true, type: true, content: true, loggedDate: true, createdAt: true },
  })

  await grantXP(payload.sub, 'journal_entry').catch(() => {})

  return Response.json({ success: true, data: entry }, { status: 201 })
}
