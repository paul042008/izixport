/** Shared display formatters — UI only, no business logic */

export function formatMoney(
  val: unknown,
  currency = 'USD',
): string {
  if (val === null || val === undefined) return '—'
  const num = Number(val)
  if (Number.isNaN(num)) return '—'
  const symbol = currency === 'NGN' ? '₦' : '$'
  return `${symbol}${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function displayName(
  profile: {
    company_name?: string | null
    full_name?: string | null
    email?: string | null
  } | null | undefined,
  fallback = 'IziXport User',
): string {
  if (!profile) return fallback
  return (
    profile.company_name?.trim() ||
    profile.full_name?.trim() ||
    profile.email?.split('@')[0] ||
    fallback
  )
}

export function displayProductTitle(title: string | null | undefined): string {
  const t = title?.trim()
  if (!t || /^unknown/i.test(t)) return 'Product'
  return t
}

export function displayBuyerName(name: string | null | undefined): string {
  const n = name?.trim()
  if (!n || /^unknown/i.test(n)) return 'IziXport Buyer'
  return n
}
