import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { grantXP, awardStreakBadge } from '@/lib/services/gamification.service'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

async function calculateStreak(habitId: string, fromDate: Date): Promise<number> {
  const logs = await prisma.habitLog.findMany({
    where:   { habitId, completed: true, loggedDate: { lte: fromDate } },
    orderBy: { loggedDate: 'desc' },
    take:    60,
  })
  if (!logs.length) return 0

  let streak  = 0
  const check = new Date(fromDate)
  check.setHours(0, 0, 0, 0)

  for (const log of logs) {
    const ld = new Date(log.loggedDate)
    ld.setHours(0, 0, 0, 0)
    if (ld.getTime() === check.getTime()) {
      streak++
      check.setDate(check.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

// POST /api/habits/[id]/check
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const habit = await prisma.habit.findUnique({ where: { id: params.id } })
  if (!habit) return Response.json({ success: false, error: { message: 'عادت یافت نشد' } }, { status: 404 })
  if (habit.userId !== payload.sub) return Response.json({ success: false, error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })

  const body = await req.json().catch(() => ({})) as { date?: string; completed?: boolean }

  const loggedDate = body.date ? new Date(body.date) : new Date()
  loggedDate.setHours(0, 0, 0, 0)
  const completed  = body.completed !== false

  await prisma.habitLog.upsert({
    where:  { habitId_loggedDate: { habitId: params.id, loggedDate } },
    create: { habitId: params.id, loggedDate, completed },
    update: { completed },
  })

  const streak = await calculateStreak(params.id, loggedDate)

  if (completed) {
    await grantXP(payload.sub, 'habit_check').catch(() => {})
    await awardStreakBadge(payload.sub, streak).catch(() => {})
  }

  // Update user's overall streak count (max of all habit streaks)
  await prisma.user.update({
    where: { id: payload.sub },
    data:  { lastActiveAt: new Date(), streakCount: { set: streak } },
  }).catch(() => {})

  return Response.json({ success: true, data: { completed, streak } })
}
