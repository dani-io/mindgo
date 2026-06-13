import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? 'mindgo-dev-secret-change-in-prod'
)

export interface JWTPayload {
  sub: string   // user id
  phone: string
  role: string
  iat?: number
  exp?: number
}

export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export function extractToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}
