'use client'

import { useEffect, useState } from 'react'

// ── Types ─────────────────────────────────────────────────

interface WalletData {
  totalEarned:      number
  lockedAmount:     number
  availableAmount:  number
  shebaNumber:      string | null
  accountHolder:    string | null
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
  const [shebaInput,   setShebaInput]   = useState('')
  const [holderInput,  setHolderInput]  = useState('')
  const [savingSheba,  setSavingSheba]  = useState(false)
  const [shebaMsg,     setShebaMsg]     = useState<string | null>(null)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutMsg,    setPayoutMsg]    = useState<{ text: string; ok: boolean } | null>(null)

  async function loadWallet() {
    try {
      const res  = await fetch('/api/coaches/me/wallet')
      const json = await res.json()
      if (json.success) {
        setWallet(json.data)
        setShebaInput(json.data.shebaNumber  ?? '')
        setHolderInput(json.data.accountHolder ?? '')
      }
    } catch { /* silent */ }
  }

  useEffect(() => { loadWallet().finally(() => setLoading(false)) }, [])

  async function handleSaveSheba() {
    setSavingSheba(true)
    setShebaMsg(null)
    try {
      const res  = await fetch('/api/coaches/me/wallet/sheba', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheba_number: shebaInput.trim(), account_holder: holderInput.trim() }),
      })
      const json = await res.json()
      setShebaMsg(json.success ? '✓ اطلاعات حساب ذخیره شد' : (json.error?.message ?? 'خطایی رخ داد'))
      if (json.success) loadWallet()
    } catch {
      setShebaMsg('خطا در ارتباط با سرور')
    } finally {
      setSavingSheba(false)
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

      {/* Sheba number */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
          🏦 اطلاعات حساب بانکی
        </h2>
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--content-tertiary)' }}>شماره شبا (IR + ۲۴ رقم)</label>
              <input
                type="text"
                placeholder="IR000000000000000000000000"
                value={shebaInput}
                onChange={(e) => { setShebaInput(e.target.value.toUpperCase()); setShebaMsg(null) }}
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
                onChange={(e) => { setHolderInput(e.target.value); setShebaMsg(null) }}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', color: 'var(--content-primary)' }}
              />
            </div>
            <button
              onClick={handleSaveSheba}
              disabled={savingSheba}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: '#10B981' }}
            >
              {savingSheba ? 'در حال ذخیره...' : 'ذخیره اطلاعات حساب'}
            </button>
            {shebaMsg && (
              <p className="text-xs text-center" style={{ color: shebaMsg.startsWith('✓') ? '#10B981' : '#EF4444' }}>
                {shebaMsg}
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
