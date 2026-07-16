// Multi-provider SMS service for OTP delivery.
// Supported providers (via SMS_PROVIDER env): selfhosted | kavenegar | smsir
//
// Two OTP models are supported:
//   - selfhosted: the gateway generates, stores, and verifies the code itself.
//     We only trigger /otp/send and /otp/verify — no code is generated on our side.
//   - kavenegar / smsir: dumb SMS delivery. We generate & store the code in our
//     own DB and pass it in via `code`; verification happens against our DB
//     (handled in the route, not here).

interface SMSProvider {
  // Trigger an OTP SMS. For selfhosted the gateway generates the code, so `code`
  // is ignored. For kavenegar/smsir `code` is required (they only deliver SMS).
  sendOTP(phone: string, code?: string): Promise<boolean>
  // Verify a code with the provider. Only meaningful for providers that manage
  // OTP server-side (selfhosted). DB-backed providers return false — their
  // verification is done against our own DB at the route level.
  verifyOTP(phone: string, code: string): Promise<boolean>
}

// ── Phone format helpers ────────────────────────────────────
// Iranian numbers. Local form "09179498400" ↔ E.164 "+989179498400".
export function toE164(phone: string): string {
  const p = phone.replace(/\s+/g, '')
  if (p.startsWith('+')) return p
  if (p.startsWith('0098')) return '+' + p.slice(2)
  if (p.startsWith('98')) return '+' + p
  if (p.startsWith('0')) return '+98' + p.slice(1)
  return '+98' + p
}

export function fromE164(phone: string): string {
  const p = phone.replace(/\s+/g, '')
  if (p.startsWith('+98')) return '0' + p.slice(3)
  if (p.startsWith('0098')) return '0' + p.slice(4)
  if (p.startsWith('98')) return '0' + p.slice(2)
  if (p.startsWith('0')) return p
  return '0' + p
}

// ── Self-hosted gateway (native OTP endpoints) ──────────────
class SelfHostedProvider implements SMSProvider {
  private config(): { baseUrl: string; apiKey: string } | null {
    const baseUrl = process.env.SMS_SELFHOSTED_URL
    const apiKey = process.env.SMS_SELFHOSTED_KEY
    if (!baseUrl || !apiKey) {
      console.error('[SMS:selfhosted] SMS_SELFHOSTED_URL or SMS_SELFHOSTED_KEY is not set')
      return null
    }
    return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey }
  }

  // The gateway generates its own code and substitutes it into `{code}`.
  async sendOTP(phone: string): Promise<boolean> {
    const cfg = this.config()
    if (!cfg) return false

    try {
      const res = await fetch(`${cfg.baseUrl}/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          phone: toE164(phone),
          template: 'کد تأیید Mindgo: {code}',
        }),
      })

      if (!res.ok) {
        console.error(`[SMS:selfhosted] /otp/send responded ${res.status}: ${await res.text().catch(() => '')}`)
        return false
      }
      return true
    } catch (err) {
      console.error('[SMS:selfhosted] /otp/send request failed:', err)
      return false
    }
  }

  // 200 → verified. 400 invalid / 410 expired / 429 too many → not verified.
  async verifyOTP(phone: string, code: string): Promise<boolean> {
    const cfg = this.config()
    if (!cfg) return false

    try {
      const res = await fetch(`${cfg.baseUrl}/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          phone: toE164(phone),
          code,
        }),
      })

      if (!res.ok) {
        console.error(`[SMS:selfhosted] /otp/verify responded ${res.status}: ${await res.text().catch(() => '')}`)
        return false
      }
      return true
    } catch (err) {
      console.error('[SMS:selfhosted] /otp/verify request failed:', err)
      return false
    }
  }
}

// ── Kavenegar (lookup/verify template) ──────────────────────
class KavenegarProvider implements SMSProvider {
  async sendOTP(phone: string, code?: string): Promise<boolean> {
    const apiKey = process.env.SMS_KAVENEGAR_KEY
    const template = process.env.SMS_KAVENEGAR_TEMPLATE
    if (!apiKey || !template) {
      console.error('[SMS:kavenegar] SMS_KAVENEGAR_KEY or SMS_KAVENEGAR_TEMPLATE is not set')
      return false
    }
    if (!code) {
      console.error('[SMS:kavenegar] sendOTP requires a code')
      return false
    }

    try {
      const params = new URLSearchParams({ receptor: phone, token: code, template })
      const res = await fetch(
        `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        }
      )

      if (!res.ok) {
        console.error(`[SMS:kavenegar] API responded ${res.status}: ${await res.text().catch(() => '')}`)
        return false
      }
      return true
    } catch (err) {
      console.error('[SMS:kavenegar] request failed:', err)
      return false
    }
  }

  // Kavenegar OTPs are verified against our own DB (route level), not the API.
  async verifyOTP(): Promise<boolean> {
    return false
  }
}

// ── SMS.ir (verify template) ────────────────────────────────
class SMSIRProvider implements SMSProvider {
  async sendOTP(phone: string, code?: string): Promise<boolean> {
    const apiKey = process.env.SMS_SMSIR_KEY
    if (!apiKey) {
      console.error('[SMS:smsir] SMS_SMSIR_KEY is not set')
      return false
    }
    if (!code) {
      console.error('[SMS:smsir] sendOTP requires a code')
      return false
    }

    try {
      const res = await fetch('https://api.sms.ir/v1/send/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          mobile: phone,
          templateId: 100000,
          parameters: [{ name: 'CODE', value: code }],
        }),
      })

      if (!res.ok) {
        console.error(`[SMS:smsir] API responded ${res.status}: ${await res.text().catch(() => '')}`)
        return false
      }
      return true
    } catch (err) {
      console.error('[SMS:smsir] request failed:', err)
      return false
    }
  }

  // SMS.ir OTPs are verified against our own DB (route level), not the API.
  async verifyOTP(): Promise<boolean> {
    return false
  }
}

export function getProviderName(): string {
  return (process.env.SMS_PROVIDER ?? '').trim().toLowerCase()
}

export function getProvider(): SMSProvider {
  switch (getProviderName()) {
    case 'kavenegar':
      return new KavenegarProvider()
    case 'smsir':
      return new SMSIRProvider()
    case 'selfhosted':
    default:
      return new SelfHostedProvider()
  }
}

export async function sendOTP(phone: string, code?: string): Promise<boolean> {
  return getProvider().sendOTP(phone, code)
}

export async function verifyOTP(phone: string, code: string): Promise<boolean> {
  return getProvider().verifyOTP(phone, code)
}
