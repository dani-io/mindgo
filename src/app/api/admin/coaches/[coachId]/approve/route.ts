import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { coachId: string } },
) {
  const auth = await requireAdminAuth(req, 'support_manager')
  if (!auth.ok) return authError(auth.status, auth.message)

  const coach = await prisma.coachProfile.findUnique({
    where:  { id: params.coachId },
    select: { id: true, status: true },
  })

  if (!coach) {
    return Response.json({ success: false, error: { message: 'کوچ یافت نشد' } }, { status: 404 })
  }
  if (coach.status !== 'pending') {
    return Response.json({ success: false, error: { message: 'این درخواست قبلاً بررسی شده' } }, { status: 400 })
  }

  await prisma.coachProfile.update({
    where: { id: params.coachId },
    data:  { status: 'approved', approvedAt: new Date(), approvedBy: auth.userId },
  })

  return Response.json({ success: true, message: 'کوچ با موفقیت تأیید شد' })
}
