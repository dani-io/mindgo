// Payment share (commission) logic — centralized so it's easy to re-enable later.
//
// EARLY LAUNCH: the platform takes 0% commission. Card-to-card payments move
// money directly to the coach's card (off-platform), so the platform never
// touches those funds — platformShare is always 0 for them. Other methods are
// also set to 0 for now; bump PLATFORM_COMMISSION_RATE back to 0.30 to restore
// the historical 70/30 split.
export const PLATFORM_COMMISSION_RATE = 0 // was 0.30

export type PaymentMethodValue = 'zarinpal' | 'snappay' | 'card_to_card'

export function computeShares(
  amount: number,
  method: PaymentMethodValue,
): { platformShare: number; coachShare: number } {
  // Card-to-card: 100% to the coach, no platform cut.
  const rate = method === 'card_to_card' ? 0 : PLATFORM_COMMISSION_RATE
  const platformShare = Math.round(amount * rate)
  const coachShare = amount - platformShare
  return { platformShare, coachShare }
}

// Format a raw 16-digit card number as "1234 5678 9012 3456".
export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

// Mask a card number for public display: "****-****-****-1234".
export function maskCardNumber(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 4) return null
  return `****-****-****-${digits.slice(-4)}`
}

// A valid Iranian debit card number is exactly 16 digits.
export function isValidCardNumber(raw: string): boolean {
  return /^\d{16}$/.test(raw.replace(/\D/g, ''))
}
