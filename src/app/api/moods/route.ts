import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/moods — returns today's mood for the current user
export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const mood = await prisma.mood.findUnique({
    where: { userId_loggedDate: { userId: payload.sub, loggedDate: today } },
    select: { mood: true },
  })

  return Response.json({ success: true, data: mood })
}

// POST /api/moods — upsert today's mood
export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { mood?: string }
  const VALID = ['great', 'good', 'normal', 'stressed', 'tired']
  if (!body.mood || !VALID.includes(body.mood)) {
    return Response.json({ success: false, error: { message: 'حال نامعتبر است' } }, { status: 400 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const mood = await prisma.mood.upsert({
    where:  { userId_loggedDate: { userId: payload.sub, loggedDate: today } },
    create: { userId: payload.sub, mood: body.mood as 'great' | 'good' | 'normal' | 'stressed' | 'tired', loggedDate: today },
    update: { mood: body.mood as 'great' | 'good' | 'normal' | 'stressed' | 'tired' },
    select: { mood: true },
  })

  return Response.json({ success: true, data: mood })
}
