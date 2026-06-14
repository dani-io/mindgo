import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/profile
export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const [user, journalCount, goalGroups, habitCount, sessionCount, moodCount] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: payload.sub },
      select: { id: true, name: true, phone: true, avatarUrl: true, xpPoints: true, level: true, streakCount: true, badges: true, themePref: true },
    }),
    prisma.journalEntry.count({ where: { userId: payload.sub } }),
    prisma.goal.groupBy({ by: ['status'], where: { userId: payload.sub }, _count: true }),
    prisma.habit.count({ where: { userId: payload.sub, isActive: true } }),
    prisma.session.count({ where: { booking: { userId: payload.sub }, status: 'completed' } }),
    prisma.mood.count({ where: { userId: payload.sub } }),
  ])

  if (!user) return Response.json({ success: false, error: { message: 'کاربر یافت نشد' } }, { status: 404 })

  const totalGoals     = goalGroups.reduce((sum, g) => sum + g._count, 0)
  const completedGoals = goalGroups.find((g) => g.status === 'completed')?._count ?? 0

  return Response.json({
    success: true,
    data: {
      ...user,
      stats: {
        totalJournalEntries: journalCount,
        totalGoals,
        completedGoals,
        totalHabits:    habitCount,
        totalSessions:  sessionCount,
        totalMoodLogs:  moodCount,
      },
    },
  })
}

// PATCH /api/profile
export async function PATCH(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    name?:      string
    avatarUrl?: string
    themePref?: string
  }

  const data: Record<string, unknown> = {}
  if (body.name !== undefined)      data.name      = body.name.trim()
  if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl

  const VALID_THEMES = ['auto', 'dark', 'light']
  if (body.themePref && VALID_THEMES.includes(body.themePref)) {
    data.themePref = body.themePref
  }

  const updated = await prisma.user.update({
    where:  { id: payload.sub },
    data,
    select: { id: true, name: true, avatarUrl: true, themePref: true },
  })

  return Response.json({ success: true, data: updated })
}
