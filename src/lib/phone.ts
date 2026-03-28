/** Нормализация к +79XXXXXXXXX (РФ), как на сервере. */
export function normalizePhoneRu(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 0) return null
  let d = digits
  if (d.startsWith('8') && d.length === 11) d = '7' + d.slice(1)
  if (d.startsWith('9') && d.length === 10) d = '7' + d
  if (d.length === 10 && !d.startsWith('7')) d = '7' + d
  if (d.startsWith('7') && d.length === 11) return `+${d}`
  return null
}
