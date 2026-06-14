import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return Response.json({ success: false, error: { message: 'توکن نامعتبر' } }, { status: 401 })

  const me      = payload.sub
  const otherId = params.userId

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
  const page  = Math.max(parseInt(searchParams.get('page') ?? '1'), 1)

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: {
        OR: [
          { senderId: me, receiverId: otherId },
          { senderId: otherId, receiverId: me },
        ],
      },
      orderBy: { createdAt: 'asc' },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    prisma.message.count({
      where: {
        OR: [
          { senderId: me, receiverId: otherId },
          { senderId: otherId, receiverId: me },
        ],
      },
    }),
  ])

  // Get the other user's info
  const otherUser = await prisma.user.findUnique({
    where:  { id: otherId },
    select: { id: true, name: true, phone: true, avatarUrl: true },
  })

  return Response.json({
    success: true,
    data: {
      messages: messages.map((m) => ({
        id:         m.id,
        content:    m.content,
        senderId:   m.senderId,
        receiverId: m.receiverId,
        isRead:     m.isRead,
        createdAt:  m.createdAt,
        isMine:     m.senderId === me,
      })),
      otherUser,
      currentUserId: me,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    },
  })
}
