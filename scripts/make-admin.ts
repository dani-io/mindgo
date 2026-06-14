/**
 * Grant admin access to any user WITHOUT changing their user.role.
 * A coach (rahbalad) or rehjoo can gain admin panel access while keeping their primary role.
 *
 * Usage:
 *   npx tsx scripts/make-admin.ts <phone> [role]
 *
 * Roles: super_admin | support_manager | support_agent  (default: super_admin)
 *
 * Examples:
 *   npx tsx scripts/make-admin.ts 09179498400
 *   npx tsx scripts/make-admin.ts 09121234567 support_manager
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type AdminRoleType = 'super_admin' | 'support_manager' | 'support_agent'
const VALID_ROLES: AdminRoleType[] = ['super_admin', 'support_manager', 'support_agent']

async function main() {
  const phone     = process.argv[2]
  const roleArg   = (process.argv[3] ?? 'super_admin') as AdminRoleType

  if (!phone) {
    console.error('Usage: npx tsx scripts/make-admin.ts <phone> [role]')
    process.exit(1)
  }

  if (!VALID_ROLES.includes(roleArg)) {
    console.error(`Invalid role "${roleArg}". Must be one of: ${VALID_ROLES.join(', ')}`)
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    console.error(`No user found with phone ${phone}. Ask them to log in first.`)
    process.exit(1)
  }

  // Upsert admin_roles entry — does NOT touch user.role
  const adminRole = await prisma.adminRole.upsert({
    where:  { userId: user.id },
    update: { role: roleArg, isActive: true },
    create: { userId: user.id, role: roleArg },
  })

  console.log(`\n✅ Admin access granted`)
  console.log(`   Phone:      ${phone}`)
  console.log(`   User ID:    ${user.id}`)
  console.log(`   User role:  ${user.role}  (unchanged)`)
  console.log(`   Admin role: ${adminRole.role}`)
  console.log(`\nThe user must log out and back in so the new adminRole is encoded in their JWT.`)
  console.log(`They will then be able to access both their primary panel and /admin simultaneously.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
