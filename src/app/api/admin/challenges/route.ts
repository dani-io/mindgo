import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

// GET /api/admin/challenges
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'support_agent')
  if (!auth.ok) return authError(auth.status, auth.message)

  const challenges = await prisma.challenge.findMany({
    orderBy: { startsAt: 'desc' },
    include: { _count: { select: { participants: true } } },
  })

  return NextResponse.json({
    success: true,
    data:    challenges.map((c) => ({
      id:               c.id,
      title:            c.title,
      description:      c.description,
      durationDays:     c.durationDays,
      status:           c.status,
      participantCount: c._count.participants,
      startsAt:         c.startsAt,
      endsAt:           c.endsAt,
      createdAt:        c.createdAt,
    })),
  })
}

// POST /api/admin/challenges  body: { title, description?, durationDays, startsAt }
export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'support_manager')
  if (!auth.ok) return authError(auth.status, auth.message)

  const body = await req.json().catch(() => ({}))
  const { title, description, durationDays, startsAt } = body as {
    title?:       string
    description?: string
    durationDays?: number
    startsAt?:    string
  }

  if (!title?.trim() || !durationDays || !startsAt) {
    return NextResponse.json(
      { success: false, error: { message: 'title، durationDays و startsAt الزامی است' } },
      { status: 400 },
    )
  }

  const start  = new Date(startsAt)
  const end    = new Date(start)
  end.setDate(end.getDate() + durationDays)

  const challenge = await prisma.challenge.create({
    data: {
      title:       title.trim(),
      description: description?.trim() || null,
      durationDays,
      startsAt:    start,
      endsAt:      end,
      createdBy:   auth.userId,
      status:      start > new Date() ? 'upcoming' : 'active',
    },
  })

  return NextResponse.json({ success: true, data: challenge }, { status: 201 })
}
