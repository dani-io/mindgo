import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/challenges/[id]/leaderboard
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const participants = await prisma.challengeParticipant.findMany({
    where: {
      challengeId: params.id,
      // Users who opted out of leaderboards are hidden — unless it's the viewer,
      // who should always see their own rank.
      OR: [
        { user: { hideFromLeaderboard: false } },
        { userId: payload.sub },
      ],
    },
    include: { user: { select: { name: true, isPrivateProfile: true } } },
    orderBy: { currentStreak: 'desc' },
    take:    10,
  })

  const data = participants.map((p, i) => ({
    rank:        i + 1,
    displayName: (p.isAnonymous || p.user.isPrivateProfile) ? 'یک هم‌سفر' : (p.user.name ?? 'رهجو'),
    streak:      p.currentStreak,
    isAnonymous: p.isAnonymous,
    isMe:        p.userId === payload.sub,
  }))

  return Response.json({ success: true, data })
}
