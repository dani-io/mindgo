/**
 * Create a new user with admin access, or grant admin access to an existing user.
 * Does NOT change user.role — admin access is tracked separately in admin_roles table.
 *
 * Usage: npx tsx scripts/create-admin.ts <phone> [role]
 * Example: npx tsx scripts/create-admin.ts 09121234567
 *          npx tsx scripts/create-admin.ts 09121234567 support_manager
 *
 * For granting admin access to an existing user, prefer: scripts/make-admin.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type AdminRoleType = 'super_admin' | 'support_manager' | 'support_agent'
const VALID_ROLES: AdminRoleType[] = ['super_admin', 'support_manager', 'support_agent']

async function main() {
  const phone   = process.argv[2]
  const roleArg = (process.argv[3] ?? 'super_admin') as AdminRoleType

  if (!phone) {
    console.error('Usage: npx tsx scripts/create-admin.ts <phone> [role]')
    process.exit(1)
  }

  if (!VALID_ROLES.includes(roleArg)) {
    console.error(`Invalid role "${roleArg}". Must be one of: ${VALID_ROLES.join(', ')}`)
    process.exit(1)
  }

  // Find or create the user — role stays as rehjoo (default) or whatever they already have
  let user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    user = await prisma.user.create({
      data: { phone, name: 'Admin' },
    })
    console.log(`✅ New user created: ${user.id}`)
  } else {
    console.log(`✅ Existing user found: ${user.id} (role: ${user.role})`)
  }

  // Upsert AdminRole entry — this is the source of truth for admin access
  const adminRole = await prisma.adminRole.upsert({
    where:  { userId: user.id },
    update: { role: roleArg, isActive: true },
    create: { userId: user.id, role: roleArg },
  })

  console.log(`✅ AdminRole set to: ${adminRole.role}`)
  console.log(`\n📱 Phone: ${phone}`)
  console.log(`🆔 User ID: ${user.id}`)
  console.log(`\nLogin via OTP at /login and you will have admin access.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
