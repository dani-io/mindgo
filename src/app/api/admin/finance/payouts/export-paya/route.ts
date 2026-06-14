import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

// Returns a CSV suitable for Iranian bank PAYA batch transfer
export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'super_admin')
  if (!auth.ok) return authError(auth.status, auth.message)

  const payouts = await prisma.payoutRequest.findMany({
    where:   { status: 'approved' },
    include: {
      wallet: {
        include: {
          coach: { include: { user: { select: { name: true } } } },
        },
      },
    },
    orderBy: { requestedAt: 'asc' },
  })

  if (payouts.length === 0) {
    return Response.json({ success: false, error: { message: 'هیچ درخواست تأیید شده‌ای یافت نشد' } }, { status: 400 })
  }

  // CSV header (PAYA format: row_number, sheba, amount_rials, account_holder, description)
  const rows = [
    ['ردیف', 'شماره شبا', 'مبلغ (ریال)', 'صاحب حساب', 'توضیحات'],
    ...payouts.map((p, i) => [
      i + 1,
      p.wallet.shebaNumber ?? '',
      p.amount * 10,       // toman → rial
      p.wallet.accountHolder ?? p.wallet.coach.user.name ?? '',
      `تسویه کوچ Mindgo - ${new Date().toISOString().slice(0, 10)}`,
    ]),
  ]

  const csv = rows.map((r) => r.join(',')).join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="paya-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
