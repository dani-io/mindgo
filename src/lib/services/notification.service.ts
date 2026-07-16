import { prisma } from '@/lib/db'

type NotificationCategory =
  | 'session_reminder'
  | 'booking_confirmed'
  | 'payout'
  | 'challenge'
  | 'streak_alert'
  | 'new_message'
  | 'support_reply'
  | 'system'

export async function createInAppNotification(
  userId:   string,
  category: NotificationCategory,
  title:    string,
  body:     string,
): Promise<void> {
  await prisma.notification.create({
    data: { userId, type: 'in_app', category, title, body },
  })
}

// ── Session ────────────────────────────────────────────────

export async function sendSessionReminder(userId: string, coachName: string, sessionTime: string): Promise<void> {
  await createInAppNotification(
    userId, 'session_reminder',
    'یادآور جلسه 🎙️',
    `کمتر از ۳۰ دقیقه تا شروع جلسه با ${coachName} (${sessionTime})`,
  )
}

// ── Booking ────────────────────────────────────────────────

export async function sendBookingConfirmed(userId: string, packageName: string): Promise<void> {
  await createInAppNotification(
    userId, 'booking_confirmed',
    'رزرو تأیید شد ✅',
    `رزرو پکیج «${packageName}» با موفقیت ثبت شد.`,
  )
}

// Notify coach when a new booking arrives
export async function sendBookingReceivedForCoach(coachUserId: string, clientName: string, packageName: string): Promise<void> {
  await createInAppNotification(
    coachUserId, 'booking_confirmed',
    'رزرو جدید دریافت شد 📅',
    `${clientName} پکیج «${packageName}» رو رزرو کرد. جلسه رو تأیید کن.`,
  )
}

// ── Card-to-card payment ──────────────────────────────────

// Notify coach that a rehjoo submitted a card-to-card payment awaiting verification.
export async function sendCardPaymentPendingForCoach(coachUserId: string, clientName: string, amount: number): Promise<void> {
  const amountStr = amount.toLocaleString('fa-IR')
  await createInAppNotification(
    coachUserId, 'booking_confirmed',
    'پرداخت جدید — لطفاً تأیید کنید 💳',
    `${clientName} مبلغ ${amountStr} تومان کارت‌به‌کارت واریز کرد. لطفاً دریافت وجه را تأیید کنید.`,
  )
}

// Notify rehjoo their card-to-card payment was confirmed by the coach.
export async function sendCardPaymentConfirmed(userId: string, packageName: string): Promise<void> {
  await createInAppNotification(
    userId, 'booking_confirmed',
    'پرداخت تأیید شد ✅',
    `کوچ دریافت وجه پکیج «${packageName}» را تأیید کرد. رزرو شما نهایی شد.`,
  )
}

// Notify rehjoo their card-to-card payment was disputed by the coach.
export async function sendCardPaymentDisputed(userId: string, packageName: string): Promise<void> {
  await createInAppNotification(
    userId, 'system',
    'مشکل در تأیید پرداخت ⚠️',
    `کوچ دریافت وجه پکیج «${packageName}» را تأیید نکرد. تیم پشتیبانی موضوع را بررسی می‌کند.`,
  )
}

// Broadcast a system notification to every active admin/support user.
export async function notifyAdmins(title: string, body: string): Promise<void> {
  const admins = await prisma.adminRole.findMany({
    where:  { isActive: true },
    select: { userId: true },
  })
  if (admins.length === 0) return
  await prisma.notification.createMany({
    data: admins.map((a) => ({ userId: a.userId, type: 'in_app' as const, category: 'system' as const, title, body })),
  })
}

// ── Streak / XP ────────────────────────────────────────────

export async function sendStreakAtRiskAlert(userId: string, streak: number): Promise<void> {
  await createInAppNotification(
    userId, 'streak_alert',
    'زنجیره موفقیتت در خطره! 🔥',
    `${streak} روز زنجیره داری — امروز یه عادت ثبت کن تا از دست نره.`,
  )
}

export async function sendStreakMilestone(userId: string, days: number): Promise<void> {
  await createInAppNotification(
    userId, 'streak_alert',
    `زنجیره ${days} روزه! 🎯`,
    `آفرین! ${days} روز پشت هم فعال بودی. همینطور ادامه بده!`,
  )
}

export async function sendXpEarned(userId: string, xp: number, reason: string): Promise<void> {
  await createInAppNotification(
    userId, 'system',
    `+${xp} امتیاز کسب کردی 🏅`,
    reason,
  )
}

// ── Challenge ──────────────────────────────────────────────

export async function sendChallengeUpdate(
  userId: string,
  participantName: string,
  challengeTitle: string,
  day: number,
): Promise<void> {
  await createInAppNotification(
    userId, 'challenge',
    'به‌روزرسانی چالش 🏆',
    `${participantName} روز ${day}م چالش «${challengeTitle}» رو تیک زد!`,
  )
}

export async function sendChallengeBadge(userId: string, challengeTitle: string, day: number): Promise<void> {
  await createInAppNotification(
    userId, 'challenge',
    `روز ${day}م چالش رو تیک زدی! 🏆`,
    `عالیه! در چالش «${challengeTitle}» رو داری خوب پیش می‌ری.`,
  )
}

// ── Messages ───────────────────────────────────────────────

export async function sendNewMessageNotification(userId: string, senderName: string): Promise<void> {
  await createInAppNotification(
    userId, 'new_message',
    'پیام جدید 💬',
    `${senderName} برات پیام فرستاد`,
  )
}

// ── Payout ────────────────────────────────────────────────

export async function sendPayoutNotification(userId: string, amount: number): Promise<void> {
  const amountStr = amount.toLocaleString()
  await createInAppNotification(
    userId, 'payout',
    'تسویه حساب واریز شد 💰',
    `مبلغ ${amountStr} تومان به حساب شما واریز شد.`,
  )
}

// ── Weekly digest ──────────────────────────────────────────

export async function sendWeeklyDigest(userId: string, sessions: number, habits: number, goals: number): Promise<void> {
  await createInAppNotification(
    userId, 'system',
    'خلاصه هفتگی رشد تو 📊',
    `این هفته: ${sessions} جلسه، ${habits} عادت، ${goals} هدف تکمیل شد. آفرین!`,
  )
}

// ── Motivational ───────────────────────────────────────────

export async function sendMotivational(userId: string, message: string): Promise<void> {
  await createInAppNotification(userId, 'system', 'پیام انگیزشی', message)
}

// ── Reaction on inspiration post ──────────────────────────

export async function sendReactionNotification(postAuthorId: string, reactorName: string, emoji: string): Promise<void> {
  await createInAppNotification(
    postAuthorId, 'system',
    'یه نفر به پستت واکنش داد',
    `${reactorName} به پستت ${emoji} گفت!`,
  )
}
