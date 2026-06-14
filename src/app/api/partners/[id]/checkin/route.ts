import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// POST /api/partners/:id/checkin
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const partnership = await prisma.partnership.findFirst({
    where: {
      id:     params.id,
      status: 'active',
      OR: [{ user1Id: payload.sub }, { user2Id: payload.sub }],
    },
  })

  if (!partnership) {
    return Response.json({ success: false, error: { message: 'پارتنرشیپ یافت نشد' } }, { status: 404 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.partnerCheckin.upsert({
    where: {
      partnershipId_userId_checkinDate: {
        partnershipId: params.id,
        userId:        payload.sub,
        checkinDate:   today,
      },
    },
    create: { partnershipId: params.id, userId: payload.sub, checkinDate: today },
    update: {},
  })

  return Response.json({ success: true, data: { checkedIn: true } })
}
