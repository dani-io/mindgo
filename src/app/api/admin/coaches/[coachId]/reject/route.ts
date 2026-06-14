import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { coachId: string } },
) {
  const auth = await requireAdminAuth(req, 'support_manager')
  if (!auth.ok) return authError(auth.status, auth.message)

  const body = await req.json().catch(() => ({}))
  const { reason } = body as { reason?: string }

  if (!reason?.trim()) {
    return Response.json({ success: false, error: { message: 'دلیل رد اجباری است' } }, { status: 400 })
  }

  const coach = await prisma.coachProfile.findUnique({
    where:  { id: params.coachId },
    select: { id: true, status: true },
  })

  if (!coach) {
    return Response.json({ success: false, error: { message: 'کوچ یافت نشد' } }, { status: 404 })
  }

  await prisma.coachProfile.update({
    where: { id: params.coachId },
    data:  { status: 'rejected', rejectionReason: reason.trim() },
  })

  return Response.json({ success: true, message: 'درخواست رد شد' })
}
