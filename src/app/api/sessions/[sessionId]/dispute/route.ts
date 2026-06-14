import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// POST /api/sessions/[sessionId]/dispute
// Client flags session as disputed → admin review
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return Response.json({ success: false, error: { message: 'توکن نامعتبر' } }, { status: 401 })

  const session = await prisma.session.findUnique({
    where:   { id: params.sessionId },
    include: { booking: true },
  })

  if (!session) return Response.json({ success: false, error: { message: 'جلسه یافت نشد' } }, { status: 404 })
  if (session.booking.userId !== payload.sub) {
    return Response.json({ success: false, error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }
  if (['completed', 'disputed'].includes(session.status)) {
    return Response.json({ success: false, error: { message: 'امکان ثبت شکایت برای این جلسه وجود ندارد' } }, { status: 400 })
  }

  await prisma.session.update({
    where: { id: params.sessionId },
    data:  { status: 'disputed' },
  })

  return Response.json({ success: true, message: 'شکایت شما ثبت شد. تیم Mindgo بررسی خواهد کرد.' })
}
