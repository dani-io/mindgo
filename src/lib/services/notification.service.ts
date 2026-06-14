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
