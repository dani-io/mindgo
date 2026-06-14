import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminAuth(req, 'super_admin')
  if (!auth.ok) return authError(auth.status, auth.message)

  const payout = await prisma.payoutRequest.findUnique({
    where:  { id: params.id },
    select: { id: true, status: true, amount: true, walletId: true },
  })
  if (!payout) {
    return Response.json({ success: false, error: { message: 'درخواست یافت نشد' } }, { status: 404 })
  }
  if (payout.status !== 'pending') {
    return Response.json({ success: false, error: { message: 'وضعیت قابل تغییر نیست' } }, { status: 400 })
  }

  // Reject + refund the reserved amount back to available
  await prisma.$transaction([
    prisma.payoutRequest.update({
      where: { id: params.id },
      data:  { status: 'rejected' },
    }),
    prisma.wallet.update({
      where: { id: payout.walletId },
      data:  { availableAmount: { increment: payout.amount } },
    }),
  ])

  return Response.json({ success: true, message: 'درخواست رد شد و مبلغ به کیف پول برگشت داده شد' })
}
