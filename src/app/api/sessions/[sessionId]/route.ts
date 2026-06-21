import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// ── GET /api/sessions/[sessionId] ─────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const session = await prisma.session.findUnique({
    where:   { id: params.sessionId },
    include: {
      booking: {
        include: {
          user:    { select: { id: true, name: true, phone: true } },
          coach:   { include: { user: { select: { id: true, name: true } } } },
          package: { select: { name: true, durationMinutes: true, priceToman: true } },
        },
      },
    },
  })

  if (!session) return Response.json({ success: false, error: { message: 'جلسه یافت نشد' } }, { status: 404 })

  const isParticipant =
    session.booking.userId   === payload.sub ||
    session.booking.coach.userId === payload.sub ||
    payload.role === 'admin'

  if (!isParticipant) return Response.json({ success: false, error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })

  return Response.json({
    success: true,
    data: {
      id:              session.id,
      status:          session.status,
      confirmedByUser: session.confirmedByUser,
      startedAt:       session.startedAt,
      endedAt:         session.endedAt,
      coachNotes:      session.coachNotes,
      autoConfirmAt:   session.autoConfirmAt,
      booking: {
        id:          session.booking.id,
        sessionDate: session.booking.sessionDate,
        sessionTime: session.booking.sessionTime,
        jitsiRoomId: session.booking.jitsiRoomId,
        status:      session.booking.status,
        user:        session.booking.user,
        coach: {
          id:       session.booking.coach.id,
          userId:   session.booking.coach.userId,
          name:     session.booking.coach.user.name,
        },
        package:  session.booking.package,
      },
    },
  })
}

// ── PATCH /api/sessions/[sessionId] ──────────────────────
// Coach only: update status, notes, timestamps

export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const session = await prisma.session.findUnique({
    where:   { id: params.sessionId },
    include: { booking: { include: { coach: true } } },
  })

  if (!session) return Response.json({ success: false, error: { message: 'جلسه یافت نشد' } }, { status: 404 })

  const isCoach = session.booking.coach.userId === payload.sub
  if (!isCoach && payload.role !== 'admin') {
    return Response.json({ success: false, error: { message: 'فقط کوچ می‌تواند وضعیت جلسه را تغییر دهد' } }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { status, coach_notes } = body as {
    status?:      'in_progress' | 'completed'
    coach_notes?: string
  }

  const updateData: Record<string, unknown> = {}

  if (status === 'in_progress' && session.status === 'scheduled') {
    updateData.status    = 'in_progress'
    updateData.startedAt = new Date()
  }

  if (status === 'completed' && (session.status === 'in_progress' || session.status === 'scheduled')) {
    updateData.status  = 'completed'
    updateData.endedAt = new Date()
  }

  if (coach_notes !== undefined) {
    updateData.coachNotes = coach_notes
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ success: false, error: { message: 'هیچ تغییری ارسال نشده' } }, { status: 400 })
  }

  const updated = await prisma.session.update({
    where: { id: params.sessionId },
    data:  updateData as Parameters<typeof prisma.session.update>[0]['data'],
  })

  return Response.json({ success: true, data: { id: updated.id, status: updated.status } })
}
