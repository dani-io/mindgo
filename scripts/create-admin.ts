/**
 * Create or promote a user to super_admin.
 * Usage: npx tsx scripts/create-admin.ts <phone>
 * Example: npx tsx scripts/create-admin.ts 09121234567
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const phone = process.argv[2]
  if (!phone) {
    console.error('Usage: npx tsx scripts/create-admin.ts <phone>')
    process.exit(1)
  }

  // Find or create the user
  let user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    user = await prisma.user.create({
      data: { phone, role: 'admin', name: 'Super Admin' },
    })
    console.log(`✅ New user created: ${user.id}`)
  } else {
    user = await prisma.user.update({
      where: { phone },
      data:  { role: 'admin' },
    })
    console.log(`✅ Existing user updated: ${user.id}`)
  }

  // Upsert AdminRole
  const adminRole = await prisma.adminRole.upsert({
    where:  { userId: user.id },
    update: { role: 'super_admin', isActive: true },
    create: { userId: user.id, role: 'super_admin' },
  })

  console.log(`✅ AdminRole set to: ${adminRole.role}`)
  console.log(`\n📱 Phone: ${phone}`)
  console.log(`🆔 User ID: ${user.id}`)
  console.log(`\nLogin via OTP at /login and you will have admin access.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
