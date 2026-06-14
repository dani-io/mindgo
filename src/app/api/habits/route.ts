import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

async function streakForHabit(habitId: string, today: Date): Promise<number> {
  const logs = await prisma.habitLog.findMany({
    where:   { habitId, completed: true, loggedDate: { lte: today } },
    orderBy: { loggedDate: 'desc' },
    take:    60,
  })
  if (!logs.length) return 0

  let streak    = 0
  const check   = new Date(today)
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

// GET /api/habits
export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const habits = await prisma.habit.findMany({
    where:   { userId: payload.sub, isActive: true },
    orderBy: { createdAt: 'asc' },
    include: { logs: { where: { loggedDate: { gte: (() => { const d = new Date(); d.setDate(d.getDate() - 8); d.setHours(0,0,0,0); return d })() } }, orderBy: { loggedDate: 'desc' } } },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)

  const result = await Promise.all(
    habits.map(async (h) => {
      const todayLog = h.logs.find((l) => {
        const ld = new Date(l.loggedDate)
        return ld.toISOString().slice(0, 10) === todayStr
      })
      const streak = await streakForHabit(h.id, today)

      // Last 7 days heatmap
      const heatmap: { date: string; completed: boolean }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const ds = d.toISOString().slice(0, 10)
        const log = h.logs.find((l) => new Date(l.loggedDate).toISOString().slice(0, 10) === ds)
        heatmap.push({ date: ds, completed: log?.completed ?? false })
      }

      return {
        id:            h.id,
        title:         h.title,
        description:   h.description,
        frequency:     h.frequency,
        assignedBy:    h.assignedBy,
        createdAt:     h.createdAt,
        completedToday: todayLog?.completed ?? false,
        currentStreak:  streak,
        heatmap,
      }
    })
  )

  return Response.json({ success: true, data: result })
}

// POST /api/habits
export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    title?:       string
    description?: string
    frequency?:   string
  }

  if (!body.title?.trim()) {
    return Response.json({ success: false, error: { message: 'عنوان عادت الزامی است' } }, { status: 400 })
  }

  const freq = body.frequency === 'weekly' ? 'weekly' : 'daily'

  const habit = await prisma.habit.create({
    data: {
      userId:      payload.sub,
      title:       body.title.trim(),
      description: body.description?.trim(),
      frequency:   freq,
    },
    select: { id: true, title: true, description: true, frequency: true, assignedBy: true, createdAt: true },
  })

  return Response.json({ success: true, data: { ...habit, completedToday: false, currentStreak: 0, heatmap: [] } }, { status: 201 })
}
