// src/lib/dojah.ts

export interface CACResult {
  verified: boolean
  rc_number?: string
  company_name?: string
  company_type?: string
  registration_date?: string
  error?: string
  raw?: any
}

export interface NINResult {
  verified: boolean
  error?: string
}

const DOJAH_BASE =
  import.meta.env.PROD
    ? 'https://api.dojah.io'
    : 'https://sandbox.dojah.io'

// ──────────────────────────────────────
// CAC Verification
// ──────────────────────────────────────
export async function verifyCACNumber(
  rcNumber: string
): Promise<CACResult> {
  const clean = rcNumber
    .trim()
    .replace(/\s/g, '')
    .replace(/^[Rr][Cc]/i, '')

  if (!clean) {
    return { verified: false, error: 'Please enter your CAC number' }
  }

  try {
    const response = await fetch(`${DOJAH_BASE}/api/v1/kyb/cac`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        AppId: import.meta.env.VITE_DOJAH_APP_ID,
        Authorization: import.meta.env.VITE_DOJAH_PRIVATE_KEY,
      },
      body: JSON.stringify({ rc_number: clean }),
    })

    // Handle non‑JSON responses (HTML 404 pages, etc.)
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Invalid response from Dojah (probably sandbox down)')
    }

    const data = await response.json()

    if (!response.ok) {
      const msg = data?.error || data?.message || 'CAC number not found'
      return { verified: false, error: msg }
    }

    const entity = data?.entity
    if (!entity) {
      return {
        verified: false,
        error: 'CAC number not found in database.',
      }
    }

    return {
      verified: true,
      rc_number: clean,
      company_name: entity?.company_name || entity?.name || 'Company Verified',
      company_type: entity?.company_type || entity?.type || '',
      registration_date:
        entity?.date_of_registration || entity?.registration_date || '',
      raw: data,
    }
  } catch (err: any) {
    console.error('CAC verification error:', err)

    // Development fallback – allow common test numbers
    if (import.meta.env.DEV) {
      if (clean === '1234567' || clean === 'RC1234567') {
        return {
          verified: true,
          rc_number: clean,
          company_name: 'IziXport Test Company Ltd',
          company_type: 'Private Limited Company',
          registration_date: '01 January 2023',
          raw: null,
        }
      }
      return {
        verified: false,
        error: 'Dojah sandbox unavailable. Try RC1234567 (sandbox test).',
      }
    }

    return {
      verified: false,
      error: err.message?.includes('fetch')
        ? 'Network error. Check your connection.'
        : 'Verification service unavailable.',
    }
  }
}

// ──────────────────────────────────────
// NIN Verification
// ──────────────────────────────────────
export async function verifyNINNumber(nin: string): Promise<NINResult> {
  const clean = nin.trim().replace(/\s/g, '')

  if (!/^\d{11}$/.test(clean)) {
    return {
      verified: false,
      error: 'NIN must be exactly 11 digits.',
    }
  }

  try {
    const response = await fetch(`${DOJAH_BASE}/api/v1/kyc/nin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        AppId: import.meta.env.VITE_DOJAH_APP_ID,
        Authorization: import.meta.env.VITE_DOJAH_PRIVATE_KEY,
      },
      body: JSON.stringify({ nin: clean }),
    })

    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Invalid response from Dojah (probably sandbox down)')
    }

    const data = await response.json()

    if (!response.ok) {
      const msg = data?.error || data?.message || 'NIN verification failed'
      return { verified: false, error: msg }
    }

    if (!data?.entity) {
      return {
        verified: false,
        error: 'NIN not found.',
      }
    }

    return { verified: true }
  } catch (err: any) {
    console.error('NIN verification error:', err)

    // Development fallback
    if (import.meta.env.DEV) {
      if (clean === '12345678901') {
        return { verified: true }
      }
      return {
        verified: false,
        error: 'Dojah sandbox unavailable. Try 12345678901 (sandbox test).',
      }
    }

    return {
      verified: false,
      error: err.message?.includes('fetch')
        ? 'Network error. Check your connection.'
        : 'Verification service unavailable.',
    }
  }
}