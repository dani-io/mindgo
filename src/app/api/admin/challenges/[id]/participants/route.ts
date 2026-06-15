import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

// GET /api/admin/challenges/[id]/participants
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth(req, 'support_agent')
  if (!auth.ok) return authError(auth.status, auth.message)

  const challenge = await prisma.challenge.findUnique({
    where:  { id: params.id },
    select: { id: true, title: true },
  })
  if (!challenge) return NextResponse.json({ success: false, error: { message: 'چالش یافت نشد' } }, { status: 404 })

  const participants = await prisma.challengeParticipant.findMany({
    where:   { challengeId: params.id },
    orderBy: { currentStreak: 'desc' },
    include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } },
  })

  return NextResponse.json({
    success: true,
    data: {
      challenge,
      participants: participants.map((p, i) => ({
        rank:         i + 1,
        id:           p.id,
        currentStreak:p.currentStreak,
        isAnonymous:  p.isAnonymous,
        joinedAt:     p.joinedAt,
        user:         p.isAnonymous ? null : p.user,
      })),
    },
  })
}
