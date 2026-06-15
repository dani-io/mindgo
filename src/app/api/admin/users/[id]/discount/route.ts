import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'MINDGO-'
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// POST /api/admin/users/[id]/discount
// body: { type: 'percentage'|'fixed', value: number, code?: string, expiresInDays?: number }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth(req, 'support_manager')
  if (!auth.ok) return authError(auth.status, auth.message)

  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true } })
  if (!user) return NextResponse.json({ success: false, error: { message: 'کاربر یافت نشد' } }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const { type, value, code: customCode, expiresInDays = 30 } = body as {
    type?:          string
    value?:         number
    code?:          string
    expiresInDays?: number
  }

  if (!type || !['percentage', 'fixed'].includes(type) || !value || value <= 0) {
    return NextResponse.json({ success: false, error: { message: 'type و value معتبر الزامی است' } }, { status: 400 })
  }
  if (type === 'percentage' && value > 100) {
    return NextResponse.json({ success: false, error: { message: 'درصد تخفیف نمی‌تواند بیش از ۱۰۰ باشد' } }, { status: 400 })
  }

  const code      = (customCode?.trim().toUpperCase()) || randomCode()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  try {
    const discount = await prisma.discountCode.create({
      data: {
        code,
        type:     type as 'percentage' | 'fixed',
        value,
        maxUses:  1,
        expiresAt,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id:        discount.id,
        code:      discount.code,
        type:      discount.type,
        value:     discount.value,
        expiresAt: discount.expiresAt,
      },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: { message: 'این کد تخفیف قبلاً وجود دارد' } }, { status: 409 })
  }
}
