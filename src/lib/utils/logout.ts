// Shared client-side logout: clears all auth/session state and redirects to login.
// Used by the rehjoo settings page, the coach panel, and anywhere else that needs
// to sign the user out consistently.

// Known localStorage keys written across the app.
const LOCAL_STORAGE_KEYS = [
  'mg_token', // JWT auth token
  'mg_theme', // theme preference (auto | dark | light)
  'journal_draft_v1', // growth-room → journal unsaved draft
  'wol_wizard_v2', // growth-room → wheel-of-life wizard draft
]

// Cookies to clear. `mg_token` is set with httpOnly:false, so document.cookie
// can remove it — the edge middleware reads this cookie to gate routes.
const COOKIE_KEYS = ['mg_token']

/**
 * Clear localStorage (token, theme, drafts), clear cookies, then hard-redirect
 * to the login page. Uses a full-page navigation (not the Next router) so the
 * cleared cookie is reflected on the next request and middleware sees no auth.
 */
export function logout(redirectTo: string = '/login'): void {
  if (typeof window === 'undefined') return

  // 1. Clear known localStorage keys, plus any stray draft keys defensively.
  try {
    LOCAL_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
    Object.keys(localStorage)
      .filter((key) => key.includes('draft'))
      .forEach((key) => localStorage.removeItem(key))
  } catch {
    /* localStorage may be unavailable (private mode) — ignore */
  }

  // 2. Expire cookies on the current path.
  try {
    COOKIE_KEYS.forEach((name) => {
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
    })
  } catch {
    /* ignore */
  }

  // 3. Full-page navigation so the browser sends the cleared cookie state.
  window.location.href = redirectTo
}
