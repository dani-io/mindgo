import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return Response.json({ success: false, error: { message: 'توکن نامعتبر' } }, { status: 401 })

  const message = await prisma.message.findUnique({ where: { id: params.id } })
  if (!message) {
    return Response.json({ success: false, error: { message: 'پیام یافت نشد' } }, { status: 404 })
  }
  if (message.receiverId !== payload.sub) {
    return Response.json({ success: false, error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  await prisma.message.update({
    where: { id: params.id },
    data:  { isRead: true },
  })

  return Response.json({ success: true })
}
