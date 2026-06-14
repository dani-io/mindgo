import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/challenges
export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const joinedOnly = searchParams.get('joined') === 'true'

  if (joinedOnly) {
    const participations = await prisma.challengeParticipant.findMany({
      where:   { userId: payload.sub },
      include: { challenge: true },
      orderBy: { joinedAt: 'desc' },
    })
    return Response.json({
      success: true,
      data: participations.map((p) => ({
        ...p.challenge,
        isJoined:    true,
        myStreak:    p.currentStreak,
        isAnonymous: p.isAnonymous,
        participantId: p.id,
      })),
    })
  }

  const challenges = await prisma.challenge.findMany({
    where:   { status: { in: ['active', 'upcoming'] } },
    orderBy: { startsAt: 'asc' },
    include: {
      participants: {
        where: { userId: payload.sub },
        take:  1,
      },
    },
  })

  return Response.json({
    success: true,
    data: challenges.map((c) => {
      const me = c.participants[0]
      return {
        id:               c.id,
        title:            c.title,
        description:      c.description,
        durationDays:     c.durationDays,
        status:           c.status,
        participantCount: c.participantCount,
        startsAt:         c.startsAt,
        endsAt:           c.endsAt,
        isJoined:         !!me,
        myStreak:         me?.currentStreak ?? 0,
        isAnonymous:      me?.isAnonymous ?? false,
        participantId:    me?.id ?? null,
      }
    }),
  })
}
