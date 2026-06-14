import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'
import { createInAppNotification } from '@/lib/services/notification.service'

// PATCH /api/admin/tickets/[id]/status  body: { status: 'open'|'in_progress'|'resolved'|'closed' }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth(req)
  if (!auth.ok) return authError(auth.status, auth.message)

  const body   = await req.json().catch(() => ({}))
  const newStatus = body.status as string
  const valid  = ['open', 'in_progress', 'resolved', 'closed']
  if (!valid.includes(newStatus)) {
    return NextResponse.json({ success: false, error: { message: 'وضعیت نامعتبر' } }, { status: 400 })
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } })
  if (!ticket) return NextResponse.json({ success: false, error: { message: 'تیکت یافت نشد' } }, { status: 404 })

  const updated = await prisma.supportTicket.update({
    where: { id: params.id },
    data:  {
      status:     newStatus as 'open' | 'in_progress' | 'resolved' | 'closed',
      resolvedAt: newStatus === 'resolved' ? new Date() : undefined,
    },
  })

  // Notify user when resolved
  if (newStatus === 'resolved') {
    await createInAppNotification(
      ticket.userId,
      'support_reply',
      'تیکت پشتیبانی حل شد ✅',
      'درخواست پشتیبانی شما بررسی و بسته شد. اگر نیاز دیگری داری دوباره بپرس.',
    )
  }

  return NextResponse.json({ success: true, data: { status: updated.status } })
}
