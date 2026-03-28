/** Проверка exp кастомного JWT из Edge (формат: payloadB64.sigB64). */

export function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return true
    const payloadPart = parts[0]
    const pad = payloadPart.length % 4
    const padded = pad ? payloadPart + '='.repeat(4 - pad) : payloadPart
    const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
    const { exp } = JSON.parse(binary) as { exp?: number }
    if (typeof exp !== 'number') return false
    return exp <= Date.now() / 1000 + 30
  } catch {
    return true
  }
}
