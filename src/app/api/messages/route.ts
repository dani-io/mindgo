import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const payload = await verifyToken(token)
  return payload
}

export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { receiver_id, content } = body as { receiver_id?: string; content?: string }

  if (!receiver_id || !content?.trim()) {
    return Response.json({ success: false, error: { message: 'گیرنده و متن الزامی است' } }, { status: 400 })
  }
  if (receiver_id === payload.sub) {
    return Response.json({ success: false, error: { message: 'امکان ارسال پیام به خود وجود ندارد' } }, { status: 400 })
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiver_id }, select: { id: true } })
  if (!receiver) {
    return Response.json({ success: false, error: { message: 'کاربر مقصد یافت نشد' } }, { status: 404 })
  }

  const message = await prisma.message.create({
    data: {
      senderId:   payload.sub,
      receiverId: receiver_id,
      content:    content.trim(),
    },
    include: {
      sender:   { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
  })

  return Response.json({
    success: true,
    data: {
      id:         message.id,
      content:    message.content,
      senderId:   message.senderId,
      receiverId: message.receiverId,
      isRead:     message.isRead,
      createdAt:  message.createdAt,
    },
  }, { status: 201 })
}
