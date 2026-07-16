'use client'

import { useEffect, useState } from 'react'
import { formatCardNumber, isValidCardNumber } from '@/lib/payments'

// ── Types ─────────────────────────────────────────────────

interface PendingCardPayment {
  id:              string
  amount:          number
  trackingCode:    string | null
  receiptImageUrl: string | null
  clientName:      string
  packageName:     string
  sessionDate:     string
  sessionTime:     string
  createdAt:       string
}

interface WalletData {
  totalEarned:      number
  lockedAmount:     number
  availableAmount:  number
  shebaNumber:      string | null
  accountHolder:    string | null
  cardNumber:       string | null
  cardHolderName:   string | null
  canRequestPayout: boolean
  minPayoutAmount:  number
  transactions: {
    id:          string
    amount:      number
    type:        'lock' | 'release' | 'burn' | 'payout'
    description: string | null
    createdAt:   string
  }[]
  payoutRequests: {
    id:            string
    amount:        number
    status:        'pending' | 'approved' | 'transferred' | 'rejected'
    requestedAt:   string
    transferredAt: string | null
  }[]
}

// ── Helpers ───────────────────────────────────────────────

function toPersian(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function formatPrice(toman: number): string {
  const s = toman.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return toPersian(s) + ' تومان'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return toPersian(`${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`)
}

const TX_LABELS: Record<string, string> = {
  lock:    'قفل (پس از پرداخت رهجو)',
  release: 'آزادسازی (تأیید جلسه)',
  burn:    'کسر (لغو/استرداد)',
  payout:  'برداشت',
}

const TX_COLORS: Record<string, string> = {
  lock:    '#F59E0B',
  release: '#10B981',
  burn:    '#EF4444',
  payout:  '#3B82F6',
}

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  pending:     'در انتظار',
  approved:    'تأیید شده',
  transferred: 'واریز شده',
  rejected:    'رد شده',
}

const PAYOUT_STATUS_COLORS: Record<string, string> = {
  pending:     '#F59E0B',
  approved:    '#10B981',
  transferred: '#3B82F6',
  rejected:    '#EF4444',
}

// ── Balance Card ──────────────────────────────────────────

function BalanceCard({
  label, amount, icon, color = '#10B981',
}: {
  label: string; amount: number; icon: string; color?: string
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: 'var(--content-tertiary)' }}>{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-lg font-bold" style={{ color }}>{formatPrice(amount)}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────

export default function CoachWalletPage() {
  const [wallet,       setWallet]       = useState<WalletData | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [cardInput,    setCardInput]    = useState('')
  const [cardHolderInput, setCardHolderInput] = useState('')
  const [shebaInput,   setShebaInput]   = useState('')
  const [holderInput,  setHolderInput]  = useState('')
  const [savingBank,   setSavingBank]   = useState(false)
  const [bankMsg,      setBankMsg]      = useState<string | null>(null)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutMsg,    setPayoutMsg]    = useState<{ text: string; ok: boolean } | null>(null)
  const [pendingCards, setPendingCards] = useState<PendingCardPayment[]>([])
  const [verifyingId,  setVerifyingId]  = useState<string | null>(null)

  async function loadWallet() {
    try {
      const res  = await fetch('/api/coaches/me/wallet')
      const json = await res.json()
      if (json.success) {
        setWallet(json.data)
        setCardInput(json.data.cardNumber ? formatCardNumber(json.data.cardNumber) : '')
        setCardHolderInput(json.data.cardHolderName ?? '')
        setShebaInput(json.data.shebaNumber  ?? '')
        setHolderInput(json.data.accountHolder ?? '')
      }
    } catch { /* silent */ }
  }

  async function loadPendingCards() {
    try {
      const res  = await fetch('/api/coaches/me/card-payments')
      const json = await res.json()
      if (json.success) setPendingCards(json.data)
    } catch { /* silent */ }
  }

  useEffect(() => { Promise.all([loadWallet(), loadPendingCards()]).finally(() => setLoading(false)) }, [])

  async function verifyCardPayment(id: string, action: 'confirm' | 'reject') {
    setVerifyingId(id)
    try {
      const res  = await fetch(`/api/payments/${id}/verify`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (json.success) {
        setPendingCards((prev) => prev.filter((p) => p.id !== id))
        loadWallet()
      }
    } catch { /* silent */ } finally {
      setVerifyingId(null)
    }
  }

  // Saves both the card (via /api/coaches/me) and the SHEBA (via wallet/sheba)
  // in one action. Both endpoints stay unchanged; we just call them together.
  async function handleSaveBank() {
    const cardDigits = cardInput.replace(/\D/g, '')
    if (cardDigits !== '' && !isValidCardNumber(cardDigits)) {
      setBankMsg('شماره کارت باید ۱۶ رقم باشد')
      return
    }
    setSavingBank(true)
    setBankMsg(null)
    try {
      const [cardRes, shebaRes] = await Promise.all([
        fetch('/api/coaches/me', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card_number: cardDigits, card_holder_name: cardHolderInput.trim() }),
        }).then((r) => r.json()),
        fetch('/api/coaches/me/wallet/sheba', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheba_number: shebaInput.trim(), account_holder: holderInput.trim() }),
        }).then((r) => r.json()),
      ])
      if (cardRes.success && shebaRes.success) {
        setBankMsg('✓ اطلاعات بانکی ذخیره شد')
        loadWallet()
      } else {
        setBankMsg(cardRes.error?.message ?? shebaRes.error?.message ?? 'خطایی رخ داد')
      }
    } catch {
      setBankMsg('خطا در ارتباط با سرور')
    } finally {
      setSavingBank(false)
    }
  }

  async function handlePayout() {
    const amount = Number(payoutAmount)
    if (!amount || amount < 500_000) {
      setPayoutMsg({ text: 'حداقل مبلغ ۵۰۰,۰۰۰ تومان است', ok: false })
      return
    }
    setPayoutLoading(true)
    setPayoutMsg(null)
    try {
      const res  = await fetch('/api/coaches/me/wallet/payout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const json = await res.json()
      setPayoutMsg({
        text: json.success ? json.message : (json.error?.message ?? 'خطایی رخ داد'),
        ok:   json.success,
      })
      if (json.success) { setPayoutAmount(''); loadWallet() }
    } catch {
      setPayoutMsg({ text: 'خطا در ارتباط با سرور', ok: false })
    } finally {
      setPayoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-5">
        {[80, 80, 80, 160, 160].map((h, i) => (
          <div key={i} className="rounded-xl mb-3 animate-pulse" style={{ height: h, background: 'var(--surface-card)' }} />
        ))}
      </div>
    )
  }

  if (!wallet) return null

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-6">
      <h1 className="text-xl font-bold mb-5" style={{ color: 'var(--content-primary)' }}>کیف پول</h1>

      {/* Balance overview */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        <BalanceCard label="موجودی قابل برداشت"   amount={wallet.availableAmount} icon="💰"  color="#10B981" />
        <div className="grid grid-cols-2 gap-3">
          <BalanceCard label="در قرنطینه (Escrow)" amount={wallet.lockedAmount}    icon="🔒"  color="#F59E0B" />
          <BalanceCard label="کل درآمد"             amount={wallet.totalEarned}    icon="📊"  color="#3B82F6" />
        </div>
      </div>

      {/* Pending card-to-card payments awaiting verification */}
      {pendingCards.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#F59E0B' }}>
            ⏳ پرداخت‌های در انتظار تأیید ({toPersian(pendingCards.length)})
          </h2>
          <div className="flex flex-col gap-3">
            {pendingCards.map((p) => (
              <div
                key={p.id}
                className="rounded-xl p-4"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.3)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm" style={{ color: 'var(--content-primary)' }}>{p.clientName}</p>
                  <p className="font-bold text-sm" style={{ color: '#10B981' }}>{formatPrice(p.amount)}</p>
                </div>
                <p className="text-xs mb-1" style={{ color: 'var(--content-tertiary)' }}>پکیج: {p.packageName}</p>
                <p className="text-xs mb-2" style={{ color: 'var(--content-secondary)' }}>
                  کد رهگیری: <span style={{ direction: 'ltr', fontFamily: 'monospace', color: 'var(--content-primary)' }}>{p.trackingCode}</span>
                </p>
                {p.receiptImageUrl && (
                  <a href={p.receiptImageUrl} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: '#3B82F6' }}>
                    🧾 مشاهده تصویر رسید
                  </a>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => verifyCardPayment(p.id, 'confirm')}
                    disabled={verifyingId === p.id}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                    style={{ background: '#10B981', opacity: verifyingId === p.id ? 0.6 : 1 }}
                  >
                    {verifyingId === p.id ? '...' : 'تأیید دریافت وجه ✅'}
                  </button>
                  <button
                    onClick={() => verifyCardPayment(p.id, 'reject')}
                    disabled={verifyingId === p.id}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
                  >
                    عدم دریافت ❌
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Payout request */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
          💸 درخواست تسویه حساب
        </h2>
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          {!wallet.shebaNumber ? (
            <p className="text-sm text-center py-2" style={{ color: '#F59E0B' }}>
              ⚠️ ابتدا شماره شبا را وارد کنید
            </p>
          ) : !wallet.canRequestPayout ? (
            <p className="text-sm text-center py-2" style={{ color: 'var(--content-tertiary)' }}>
              موجودی کمتر از حداقل برداشت ({formatPrice(wallet.minPayoutAmount)}) است
            </p>
          ) : (
            <>
              <p className="text-xs mb-3" style={{ color: 'var(--content-tertiary)' }}>
                موجودی قابل برداشت: {formatPrice(wallet.availableAmount)} — حداقل {formatPrice(wallet.minPayoutAmount)}
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="مبلغ (تومان)"
                  value={payoutAmount}
                  onChange={(e) => { setPayoutAmount(e.target.value); setPayoutMsg(null) }}
                  className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
                />
                <button
                  onClick={handlePayout}
                  disabled={payoutLoading || !payoutAmount}
                  className="px-4 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                  style={{ background: payoutAmount ? '#10B981' : 'var(--surface-tertiary)' }}
                >
                  {payoutLoading ? '...' : 'درخواست'}
                </button>
              </div>
              {payoutAmount && Number(payoutAmount) > 0 && (
                <p className="text-xs mt-2" style={{ color: '#10B981' }}>
                  معادل: {formatPrice(Number(payoutAmount))}
                </p>
              )}
            </>
          )}

          {payoutMsg && (
            <p className="text-xs text-center mt-3 py-2 rounded-lg"
              style={{
                background: payoutMsg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color:      payoutMsg.ok ? '#10B981' : '#EF4444',
              }}
            >
              {payoutMsg.text}
            </p>
          )}
        </div>
      </section>

      {/* Bank info — card (for card-to-card) + SHEBA (for payouts) together */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
          💳 اطلاعات بانکی
        </h2>
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex flex-col gap-3">
            {/* Card — used for card-to-card payments from رهجوها */}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--content-tertiary)' }}>شماره کارت (برای دریافت کارت‌به‌کارت)</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={19}
                placeholder="---- ---- ---- ----"
                value={cardInput}
                onChange={(e) => { setCardInput(formatCardNumber(e.target.value)); setBankMsg(null) }}
                className="w-full rounded-xl px-4 py-3 text-base outline-none tracking-wider"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', color: 'var(--content-primary)', direction: 'ltr', textAlign: 'center', fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--content-tertiary)' }}>نام صاحب کارت</label>
              <input
                type="text"
                placeholder="نام کامل به فارسی"
                value={cardHolderInput}
                onChange={(e) => { setCardHolderInput(e.target.value); setBankMsg(null) }}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
              />
            </div>

            <div className="my-1" style={{ borderTop: '1px solid var(--border-color)' }} />

            {/* SHEBA — used for platform payouts */}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--content-tertiary)' }}>شماره شبا (IR + ۲۴ رقم) — برای تسویه</label>
              <input
                type="text"
                placeholder="IR000000000000000000000000"
                value={shebaInput}
                onChange={(e) => { setShebaInput(e.target.value.toUpperCase()); setBankMsg(null) }}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', color: 'var(--content-primary)', direction: 'ltr', textAlign: 'left' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--content-tertiary)' }}>نام صاحب حساب</label>
              <input
                type="text"
                placeholder="نام کامل به فارسی"
                value={holderInput}
                onChange={(e) => { setHolderInput(e.target.value); setBankMsg(null) }}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
              />
            </div>

            <button
              onClick={handleSaveBank}
              disabled={savingBank}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: '#10B981', opacity: savingBank ? 0.7 : 1 }}
            >
              {savingBank ? 'در حال ذخیره...' : 'ذخیره اطلاعات بانکی'}
            </button>
            {bankMsg && (
              <p className="text-xs text-center" style={{ color: bankMsg.startsWith('✓') ? '#10B981' : '#EF4444' }}>
                {bankMsg}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Payout history */}
      {wallet.payoutRequests.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
            📋 تاریخچه درخواست‌های تسویه
          </h2>
          <div className="flex flex-col gap-2">
            {wallet.payoutRequests.map((p) => (
              <div
                key={p.id}
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
              >
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--content-primary)' }}>
                    {formatPrice(p.amount)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
                    {formatDate(p.requestedAt)}
                    {p.transferredAt && ` · واریز: ${formatDate(p.transferredAt)}`}
                  </p>
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: `${PAYOUT_STATUS_COLORS[p.status]}20`,
                    color:       PAYOUT_STATUS_COLORS[p.status],
                  }}
                >
                  {PAYOUT_STATUS_LABELS[p.status]}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transaction history */}
      {wallet.transactions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
            📊 تراکنش‌های اخیر
          </h2>
          <div className="flex flex-col gap-2">
            {wallet.transactions.map((tx) => (
              <div
                key={tx.id}
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
              >
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--content-primary)' }}>
                    {TX_LABELS[tx.type] ?? tx.type}
                  </p>
                  {tx.description && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--content-tertiary)' }}>{tx.description}</p>
                  )}
                  <p className="text-xs mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
                    {formatDate(tx.createdAt)}
                  </p>
                </div>
                <span className="font-bold text-sm" style={{ color: TX_COLORS[tx.type] }}>
                  {tx.type === 'burn' || tx.type === 'payout' ? '—' : '+'}
                  {formatPrice(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
