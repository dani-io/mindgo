import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// Mark all messages FROM a given sender TO current user as read
export async function POST(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return Response.json({ success: false, error: { message: 'توکن نامعتبر' } }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { from_user_id } = body as { from_user_id?: string }
  if (!from_user_id) {
    return Response.json({ success: false, error: { message: 'from_user_id الزامی است' } }, { status: 400 })
  }

  const { count } = await prisma.message.updateMany({
    where:  { senderId: from_user_id, receiverId: payload.sub, isRead: false },
    data:   { isRead: true },
  })

  return Response.json({ success: true, data: { markedRead: count } })
}
