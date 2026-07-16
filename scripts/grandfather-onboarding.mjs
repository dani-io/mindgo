// Grandfather existing users past the onboarding wizard.
// Marks onboardingCompleted=true for any user who already has a name set,
// so pre-existing users aren't forced through onboarding on their next login.
//
// Idempotent — safe to run multiple times. Run AFTER `prisma db push`:
//   node scripts/grandfather-onboarding.mjs

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const result = await prisma.user.updateMany({
  where: {
    onboardingCompleted: false,
    name: { not: null },
    NOT: { name: '' },
  },
  data: { onboardingCompleted: true },
})

console.log(`✔ Grandfathered ${result.count} existing user(s) with a name set.`)

await prisma.$disconnect()
