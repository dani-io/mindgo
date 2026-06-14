import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

async function calcStreak(participantId: string, today: Date): Promise<number> {
  const checkins = await prisma.challengeCheckin.findMany({
    where:   { participantId, checkinDate: { lte: today } },
    orderBy: { checkinDate: 'desc' },
    take:    60,
  })
  if (!checkins.length) return 0

  let streak  = 0
  const check = new Date(today)
  check.setHours(0, 0, 0, 0)

  for (const c of checkins) {
    const cd = new Date(c.checkinDate)
    cd.setHours(0, 0, 0, 0)
    if (cd.getTime() === check.getTime()) {
      streak++
      check.setDate(check.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

// POST /api/challenges/[id]/checkin
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const participant = await prisma.challengeParticipant.findUnique({
    where: { userId_challengeId: { userId: payload.sub, challengeId: params.id } },
  })
  if (!participant) return Response.json({ success: false, error: { message: 'ابتدا به چالش بپیوندید' } }, { status: 400 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    await prisma.challengeCheckin.create({
      data: { participantId: participant.id, checkinDate: today },
    })
  } catch {
    return Response.json({ success: false, error: { message: 'امروز قبلاً چک‌این کرده‌اید' } }, { status: 400 })
  }

  const streak = await calcStreak(participant.id, today)

  await prisma.challengeParticipant.update({
    where: { id: participant.id },
    data:  { currentStreak: streak },
  })

  return Response.json({
    success: true,
    data: {
      streak,
      message: streak >= 7 ? `${streak} روز متوالی! عالی هستی!` : `چک‌این امروز ثبت شد. ${streak} روز متوالی`,
    },
  })
}
