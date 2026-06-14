import { NextRequest } from 'next/server'
import { prisma } from './db'
import { verifyToken } from './auth'

export type AdminRoleType = 'super_admin' | 'support_manager' | 'support_agent'

const ROLE_WEIGHT: Record<AdminRoleType, number> = {
  super_admin:     3,
  support_manager: 2,
  support_agent:   1,
}

export const ROLE_LABELS: Record<AdminRoleType, string> = {
  super_admin:     'مدیر ارشد',
  support_manager: 'مدیر پشتیبانی',
  support_agent:   'کارشناس پشتیبانی',
}

export async function checkPermission(userId: string, required: AdminRoleType): Promise<boolean> {
  const record = await prisma.adminRole.findUnique({
    where:  { userId },
    select: { role: true, isActive: true },
  })
  if (!record || !record.isActive) return false
  return ROLE_WEIGHT[record.role as AdminRoleType] >= ROLE_WEIGHT[required]
}

export async function getAdminRole(userId: string): Promise<AdminRoleType | null> {
  const record = await prisma.adminRole.findUnique({
    where:  { userId },
    select: { role: true, isActive: true },
  })
  if (!record || !record.isActive) return null
  return record.role as AdminRoleType
}

export async function requireAdminAuth(
  req: NextRequest,
  minRole: AdminRoleType = 'support_agent',
): Promise<
  | { ok: true;  userId: string; adminRole: AdminRoleType }
  | { ok: false; status: number; message: string }
> {
  const token =
    req.cookies.get('mg_token')?.value ??
    req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) return { ok: false, status: 401, message: 'احراز هویت الزامی است' }

  const payload = await verifyToken(token)
  if (!payload) return { ok: false, status: 401, message: 'احراز هویت الزامی است' }

  // Admin access is determined by admin_roles table, not user.role
  // This allows a rahbalad (coach) to also have admin access
  const adminRole = await getAdminRole(payload.sub)
  if (!adminRole) return { ok: false, status: 403, message: 'دسترسی غیرمجاز' }

  if (ROLE_WEIGHT[adminRole] < ROLE_WEIGHT[minRole]) {
    return { ok: false, status: 403, message: 'سطح دسترسی کافی نیست' }
  }

  return { ok: true, userId: payload.sub, adminRole }
}

export function authError(status: number, message: string) {
  return Response.json({ success: false, error: { code: 'AUTH_ERROR', message } }, { status })
}
