import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'super_admin')
  if (!auth.ok) return authError(auth.status, auth.message)

  const body = await req.json().catch(() => ({}))
  const { payout_ids, paya_ref } = body as { payout_ids?: string[]; paya_ref?: string }

  if (!payout_ids?.length) {
    return Response.json({ success: false, error: { message: 'لیست شناسه‌ها خالی است' } }, { status: 400 })
  }

  const transferredAt = new Date()

  await prisma.payoutRequest.updateMany({
    where: { id: { in: payout_ids }, status: 'approved' },
    data:  {
      status:        'transferred',
      transferredAt,
      ...(paya_ref ? { payaRef: paya_ref } : {}),
    },
  })

  return Response.json({ success: true, message: `${payout_ids.length} درخواست به عنوان واریز شده علامت‌گذاری شد` })
}
