// Multi-provider SMS service for OTP delivery.
// Supported providers (via SMS_PROVIDER env): selfhosted | kavenegar | smsir

interface SMSProvider {
  sendOTP(phone: string, code: string): Promise<boolean>
}

// ── Self-hosted gateway ─────────────────────────────────────
class SelfHostedProvider implements SMSProvider {
  async sendOTP(phone: string, code: string): Promise<boolean> {
    const baseUrl = process.env.SMS_SELFHOSTED_URL
    if (!baseUrl) {
      console.error('[SMS:selfhosted] SMS_SELFHOSTED_URL is not set')
      return false
    }

    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          message: `کد تأیید Mindgo: ${code}`,
          apiKey: process.env.SMS_SELFHOSTED_KEY ?? '',
        }),
      })

      if (!res.ok) {
        console.error(`[SMS:selfhosted] gateway responded ${res.status}: ${await res.text().catch(() => '')}`)
        return false
      }
      return true
    } catch (err) {
      console.error('[SMS:selfhosted] request failed:', err)
      return false
    }
  }
}

// ── Kavenegar (lookup/verify template) ──────────────────────
class KavenegarProvider implements SMSProvider {
  async sendOTP(phone: string, code: string): Promise<boolean> {
    const apiKey = process.env.SMS_KAVENEGAR_KEY
    const template = process.env.SMS_KAVENEGAR_TEMPLATE
    if (!apiKey || !template) {
      console.error('[SMS:kavenegar] SMS_KAVENEGAR_KEY or SMS_KAVENEGAR_TEMPLATE is not set')
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
}

// ── SMS.ir (verify template) ────────────────────────────────
class SMSIRProvider implements SMSProvider {
  async sendOTP(phone: string, code: string): Promise<boolean> {
    const apiKey = process.env.SMS_SMSIR_KEY
    if (!apiKey) {
      console.error('[SMS:smsir] SMS_SMSIR_KEY is not set')
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
}

export function getProvider(): SMSProvider {
  const provider = (process.env.SMS_PROVIDER ?? '').trim().toLowerCase()
  switch (provider) {
    case 'kavenegar':
      return new KavenegarProvider()
    case 'smsir':
      return new SMSIRProvider()
    case 'selfhosted':
    default:
      return new SelfHostedProvider()
  }
}

export async function sendOTP(phone: string, code: string): Promise<boolean> {
  return getProvider().sendOTP(phone, code)
}
